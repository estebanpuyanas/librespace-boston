import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel from '@server/models/user.model';
import { loginUser, registerUser } from '@server/services/auth.service';
import { mockUser1, mockSafeUser1 } from '../mockData.models';

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- loginUser ----

  describe('loginUser', () => {
    it('returns token and safe user on valid credentials', async () => {
      jest.spyOn(UserModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser1),
      } as unknown as ReturnType<typeof UserModel.findOne>);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await loginUser('alice', 'password123');

      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('alice');
      expect((result.user as unknown as { password?: string }).password).toBeUndefined();
    });

    it('throws if user is not found', async () => {
      jest.spyOn(UserModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      } as unknown as ReturnType<typeof UserModel.findOne>);

      await expect(loginUser('nobody', 'password')).rejects.toThrow('Invalid credentials');
    });

    it('throws if password does not match', async () => {
      jest.spyOn(UserModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser1),
      } as unknown as ReturnType<typeof UserModel.findOne>);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(loginUser('alice', 'wrongpass')).rejects.toThrow('Invalid credentials');
    });

    it('issues a JWT that decodes to the correct claims', async () => {
      jest.spyOn(UserModel, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockUser1),
      } as unknown as ReturnType<typeof UserModel.findOne>);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const { token } = await loginUser('alice', 'password123');
      const decoded = jwt.decode(token) as { username: string; role: string };

      expect(decoded.username).toBe('alice');
      expect(decoded.role).toBe('USER');
    });
  });

  // ---- registerUser ----

  describe('registerUser', () => {
    it('returns token and safe user on successful registration', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
      jest.spyOn(UserModel, 'create').mockResolvedValue({
        ...mockUser1,
        _id: mockUser1._id,
        toObject: () => ({ ...mockUser1 }),
      } as unknown as typeof mockUser1);

      const result = await registerUser('alice', 'alice@example.com', 'password123');

      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('alice');
    });

    it('throws if username is already taken', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue(mockUser1 as unknown as Awaited<ReturnType<typeof UserModel.findOne>>);

      await expect(
        registerUser('alice', 'alice@example.com', 'password123')
      ).rejects.toThrow('Username or email already in use');
    });

    it('hashes the password before storing', async () => {
      jest.spyOn(UserModel, 'findOne').mockResolvedValue(null);
      const hashSpy = jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
      jest.spyOn(UserModel, 'create').mockResolvedValue({
        ...mockUser1, toObject: () => ({ ...mockUser1 }),
      } as unknown as typeof mockUser1);

      await registerUser('alice', 'alice@example.com', 'plaintext');

      expect(hashSpy).toHaveBeenCalledWith('plaintext', 10);
    });
  });
});
