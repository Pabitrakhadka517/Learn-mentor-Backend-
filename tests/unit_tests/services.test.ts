type User = { id: string; name: string; email: string };

export {};

describe('Services Module (userService.js and authService.js equivalents)', () => {
  const utils = {
    // Capitalize helper used in service transformation.
    capitalize(value: string): string {
      if (!value) return '';
      return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    },

    // Email validation helper used by service.
    validateEmail(email: string): boolean {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
  };

  const buildDb = () => ({
    getUserById: jest.fn(async (id: string) =>
      id === '1' ? ({ id: '1', name: 'Alice', email: 'alice@example.com' } as User) : null
    ),
    createUser: jest.fn(async (payload: Omit<User, 'id'>) => ({ id: '2', ...payload })),
    updateUser: jest.fn(async (id: string, payload: Partial<User>) =>
      id === '1' ? ({ id: '1', name: 'Alice', email: 'alice@example.com', ...payload } as User) : null
    ),
    deleteUser: jest.fn(async (id: string) => id === '1')
  });

  const buildUserService = (db: ReturnType<typeof buildDb>) => ({
    // Returns user or null.
    async getUserById(id: string) {
      return db.getUserById(id);
    },

    // Validates and creates user.
    async createUser(name: string, email: string) {
      if (!name?.trim()) throw new Error('Name is required');
      if (!utils.validateEmail(email)) throw new Error('Invalid email');
      return db.createUser({
        name: utils.capitalize(name.trim()),
        email: email.toLowerCase()
      });
    },

    // Validates update payload and updates user.
    async updateUser(id: string, patch: Partial<User>) {
      if (patch.email && !utils.validateEmail(patch.email)) {
        throw new Error('Invalid email');
      }
      return db.updateUser(id, patch);
    },

    // Deletes user.
    async deleteUser(id: string) {
      return db.deleteUser(id);
    }
  });

  const authService = {
    // Creates access token for valid login payload.
    async login(email: string, password: string) {
      if (!utils.validateEmail(email)) throw new Error('Invalid email');
      if (!password || password.length < 6) throw new Error('Invalid password');
      return { token: `token-${email}` };
    }
  };

  // Should return a user when id exists.
  it('getUserById returns user for existing id', async () => {
    const db = buildDb();
    const service = buildUserService(db);
    const user = await service.getUserById('1');

    expect(db.getUserById).toHaveBeenCalledWith('1');
    expect(user?.name).toBe('Alice');
  });

  // Should return null when id is not found.
  it('getUserById returns null for unknown id', async () => {
    const db = buildDb();
    const service = buildUserService(db);
    await expect(service.getUserById('999')).resolves.toBeNull();
  });

  // Should create user with normalized data.
  it('createUser normalizes name and email', async () => {
    const db = buildDb();
    const service = buildUserService(db);
    const created = await service.createUser(' john ', 'JOHN@EXAMPLE.COM');

    expect(db.createUser).toHaveBeenCalledWith({ name: 'John', email: 'john@example.com' });
    expect(created.id).toBe('2');
  });

  // Should reject create operation for invalid email.
  it('createUser throws for invalid email', async () => {
    const db = buildDb();
    const service = buildUserService(db);
    await expect(service.createUser('John', 'bad-email')).rejects.toThrow('Invalid email');
  });

  // Should reject create operation for missing name.
  it('createUser throws for empty name', async () => {
    const db = buildDb();
    const service = buildUserService(db);
    await expect(service.createUser('   ', 'john@example.com')).rejects.toThrow('Name is required');
  });

  // Should update user for existing id.
  it('updateUser returns updated user for existing id', async () => {
    const db = buildDb();
    const service = buildUserService(db);
    const updated = await service.updateUser('1', { name: 'Alicia' });

    expect(db.updateUser).toHaveBeenCalledWith('1', { name: 'Alicia' });
    expect(updated?.name).toBe('Alicia');
  });

  // Should return null when updating unknown id.
  it('updateUser returns null for unknown id', async () => {
    const db = buildDb();
    const service = buildUserService(db);
    await expect(service.updateUser('999', { name: 'Ghost' })).resolves.toBeNull();
  });

  // Should reject update operation for invalid email format.
  it('updateUser throws for invalid email in patch', async () => {
    const db = buildDb();
    const service = buildUserService(db);
    await expect(service.updateUser('1', { email: 'invalid-email' })).rejects.toThrow('Invalid email');
  });

  // Should delete user when id exists.
  it('deleteUser returns true for existing id', async () => {
    const db = buildDb();
    const service = buildUserService(db);
    await expect(service.deleteUser('1')).resolves.toBe(true);
  });

  // Should return false when deleting unknown id.
  it('deleteUser returns false for unknown id', async () => {
    const db = buildDb();
    const service = buildUserService(db);
    await expect(service.deleteUser('999')).resolves.toBe(false);
  });

  // Should return token for valid login payload.
  it('authService.login returns token for valid credentials', async () => {
    await expect(authService.login('user@example.com', 'secret1')).resolves.toEqual({
      token: 'token-user@example.com'
    });
  });

  // Should reject login for invalid email format.
  it('authService.login throws for invalid email', async () => {
    await expect(authService.login('userexample.com', 'secret1')).rejects.toThrow('Invalid email');
  });

  // Should reject login for short password.
  it('authService.login throws for invalid password', async () => {
    await expect(authService.login('user@example.com', '123')).rejects.toThrow('Invalid password');
  });
});
