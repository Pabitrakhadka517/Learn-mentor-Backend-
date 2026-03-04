type User = { id: string; name: string; email: string };

export {};

describe('Mock Database Module (db.js equivalent)', () => {
  const buildDb = () => {
    const store: User[] = [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' }
    ];

    return {
      // Returns user by id or null.
      getUserById: jest.fn(async (id: string) => store.find((u) => u.id === id) || null),
      // Creates a new user.
      createUser: jest.fn(async (payload: Omit<User, 'id'>) => {
        const created = { id: String(store.length + 1), ...payload };
        store.push(created);
        return created;
      }),
      // Updates user by id or returns null.
      updateUser: jest.fn(async (id: string, patch: Partial<User>) => {
        const idx = store.findIndex((u) => u.id === id);
        if (idx < 0) return null;
        store[idx] = { ...store[idx], ...patch };
        return store[idx];
      }),
      // Deletes user by id.
      deleteUser: jest.fn(async (id: string) => {
        const idx = store.findIndex((u) => u.id === id);
        if (idx < 0) return false;
        store.splice(idx, 1);
        return true;
      })
    };
  };

  // Should fetch existing user by id.
  it('getUserById returns user when found', async () => {
    const db = buildDb();
    await expect(db.getUserById('1')).resolves.toEqual({
      id: '1',
      name: 'Alice',
      email: 'alice@example.com'
    });
  });

  // Should return null for unknown id.
  it('getUserById returns null when missing', async () => {
    const db = buildDb();
    await expect(db.getUserById('999')).resolves.toBeNull();
  });

  // Should create and return a new user record.
  it('createUser adds a new user', async () => {
    const db = buildDb();
    const created = await db.createUser({ name: 'Chris', email: 'chris@example.com' });
    expect(created).toEqual({ id: '3', name: 'Chris', email: 'chris@example.com' });
  });

  // Should update and return changed user.
  it('updateUser updates existing user', async () => {
    const db = buildDb();
    const updated = await db.updateUser('2', { name: 'Bobby' });
    expect(updated).toEqual({ id: '2', name: 'Bobby', email: 'bob@example.com' });
  });

  // Should return null when trying to update unknown user.
  it('updateUser returns null for unknown id', async () => {
    const db = buildDb();
    await expect(db.updateUser('999', { name: 'X' })).resolves.toBeNull();
  });

  // Should delete existing user.
  it('deleteUser returns true for existing id', async () => {
    const db = buildDb();
    await expect(db.deleteUser('1')).resolves.toBe(true);
  });

  // Should return false for missing user deletion.
  it('deleteUser returns false for unknown id', async () => {
    const db = buildDb();
    await expect(db.deleteUser('999')).resolves.toBe(false);
  });
});
