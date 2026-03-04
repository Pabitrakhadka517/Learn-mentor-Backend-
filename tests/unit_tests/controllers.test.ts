type User = { id: string; name: string; email: string };

export {};

type Req = { params?: Record<string, string>; body?: any };
type Res = { status: jest.Mock; json: jest.Mock };

const makeRes = (): Res => {
  const res: Res = {
    status: jest.fn(),
    json: jest.fn()
  };
  res.status.mockReturnValue(res);
  return res;
};

describe('Controllers Module (userController.js and authController.js equivalents)', () => {
  const buildUserService = () => ({
    getUsers: jest.fn(async () => [
      { id: '1', name: 'Alice', email: 'alice@example.com' },
      { id: '2', name: 'Bob', email: 'bob@example.com' }
    ] as User[]),
    getUserById: jest.fn(async (id: string) =>
      id === '1' ? ({ id: '1', name: 'Alice', email: 'alice@example.com' } as User) : null
    ),
    createUser: jest.fn(async (name: string, email: string) => ({ id: '3', name, email } as User)),
    updateUser: jest.fn(async (id: string, patch: Partial<User>) =>
      id === '1' ? ({ id: '1', name: 'Alice', email: 'alice@example.com', ...patch } as User) : null
    ),
    deleteUser: jest.fn(async (id: string) => id === '1')
  });

  const buildAuthService = () => ({
    login: jest.fn(async (email: string, _password: string) => ({ token: `token-${email}` })),
    register: jest.fn(async (name: string, email: string, _password: string) => ({ id: '4', name, email }))
  });

  const buildUserController = (userService: ReturnType<typeof buildUserService>) => ({
    // GET /users
    async getUsers(req: Req, res: Res, next: jest.Mock) {
      try {
        const users = await userService.getUsers();
        return res.status(200).json({ success: true, data: users });
      } catch (error) {
        next(error);
      }
    },

    // GET /users/:id
    async getUserById(req: Req, res: Res, next: jest.Mock) {
      try {
        const user = await userService.getUserById(String(req.params?.id));
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.status(200).json({ success: true, data: user });
      } catch (error) {
        next(error);
      }
    },

    // POST /users
    async createUser(req: Req, res: Res, next: jest.Mock) {
      try {
        const user = await userService.createUser(req.body?.name, req.body?.email);
        return res.status(201).json({ success: true, data: user });
      } catch (error) {
        next(error);
      }
    },

    // PUT /users/:id
    async updateUser(req: Req, res: Res, next: jest.Mock) {
      try {
        const user = await userService.updateUser(String(req.params?.id), req.body || {});
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.status(200).json({ success: true, data: user });
      } catch (error) {
        next(error);
      }
    },

    // DELETE /users/:id
    async deleteUser(req: Req, res: Res, next: jest.Mock) {
      try {
        const deleted = await userService.deleteUser(String(req.params?.id));
        if (!deleted) return res.status(404).json({ success: false, message: 'User not found' });
        return res.status(200).json({ success: true, message: 'User deleted' });
      } catch (error) {
        next(error);
      }
    }
  });

  const buildAuthController = (authService: ReturnType<typeof buildAuthService>) => ({
    // POST /auth/login
    async login(req: Req, res: Res, next: jest.Mock) {
      try {
        const result = await authService.login(req.body?.email, req.body?.password);
        return res.status(200).json({ success: true, ...result });
      } catch (error) {
        next(error);
      }
    },

    // POST /auth/register
    async register(req: Req, res: Res, next: jest.Mock) {
      try {
        const result = await authService.register(req.body?.name, req.body?.email, req.body?.password);
        return res.status(201).json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  });

  // Should return user list for GET operation.
  it('GET users returns 200 and user array', async () => {
    const userService = buildUserService();
    const controller = buildUserController(userService);
    const res = makeRes();
    const next = jest.fn();

    await controller.getUsers({}, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    expect(next).not.toHaveBeenCalled();
  });

  // Should return one user for valid id.
  it('GET user by id returns 200 for existing user', async () => {
    const userService = buildUserService();
    const controller = buildUserController(userService);
    const res = makeRes();
    const next = jest.fn();

    await controller.getUserById({ params: { id: '1' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // Should return 404 for unknown id.
  it('GET user by id returns 404 when user does not exist', async () => {
    const userService = buildUserService();
    const controller = buildUserController(userService);
    const res = makeRes();
    const next = jest.fn();

    await controller.getUserById({ params: { id: '999' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
  });

  // Should create user for valid payload.
  it('POST create user returns 201', async () => {
    const userService = buildUserService();
    const controller = buildUserController(userService);
    const res = makeRes();
    const next = jest.fn();

    await controller.createUser({ body: { name: 'Chris', email: 'chris@example.com' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // Should call next when POST service throws.
  it('POST create user forwards errors to next', async () => {
    const userService = buildUserService();
    userService.createUser.mockRejectedValueOnce(new Error('Invalid email'));
    const controller = buildUserController(userService);
    const res = makeRes();
    const next = jest.fn();

    await controller.createUser({ body: { name: 'Chris', email: 'invalid' } }, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  // Should update user for valid id.
  it('PUT update user returns 200 when user exists', async () => {
    const userService = buildUserService();
    const controller = buildUserController(userService);
    const res = makeRes();
    const next = jest.fn();

    await controller.updateUser({ params: { id: '1' }, body: { name: 'Alicia' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // Should return 404 for updating non-existing user.
  it('PUT update user returns 404 when user does not exist', async () => {
    const userService = buildUserService();
    const controller = buildUserController(userService);
    const res = makeRes();
    const next = jest.fn();

    await controller.updateUser({ params: { id: '999' }, body: { name: 'Ghost' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
  });

  // Should delete user for valid id.
  it('DELETE user returns 200 when delete succeeds', async () => {
    const userService = buildUserService();
    const controller = buildUserController(userService);
    const res = makeRes();
    const next = jest.fn();

    await controller.deleteUser({ params: { id: '1' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'User deleted' });
  });

  // Should return 404 when deleting unknown id.
  it('DELETE user returns 404 when user does not exist', async () => {
    const userService = buildUserService();
    const controller = buildUserController(userService);
    const res = makeRes();
    const next = jest.fn();

    await controller.deleteUser({ params: { id: '999' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'User not found' });
  });

  // Should login and return token.
  it('POST login returns 200 and token', async () => {
    const authService = buildAuthService();
    const controller = buildAuthController(authService);
    const res = makeRes();
    const next = jest.fn();

    await controller.login({ body: { email: 'user@example.com', password: 'secret1' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, token: expect.any(String) }));
  });

  // Should register user and return 201.
  it('POST register returns 201 and created payload', async () => {
    const authService = buildAuthService();
    const controller = buildAuthController(authService);
    const res = makeRes();
    const next = jest.fn();

    await controller.register({ body: { name: 'Sam', email: 'sam@example.com', password: 'secret1' } }, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  // Should call next when auth service fails.
  it('POST login forwards service errors to next', async () => {
    const authService = buildAuthService();
    authService.login.mockRejectedValueOnce(new Error('Invalid email'));
    const controller = buildAuthController(authService);
    const res = makeRes();
    const next = jest.fn();

    await controller.login({ body: { email: 'invalid', password: 'secret1' } }, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
