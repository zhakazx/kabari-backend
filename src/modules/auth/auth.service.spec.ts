import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/entities/user.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

const mockUsersService = () => ({
  findByEmail: jest.fn(),
  create: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'mocked-jwt-token'),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useFactory: mockUsersService },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      full_name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: UserRole.PELANGGAN,
    };

    it('should register a new user successfully', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 'user-123',
        full_name: registerDto.full_name,
        email: registerDto.email,
        role: registerDto.role,
        password_hash: 'hashed',
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).toHaveBeenCalledWith({
        full_name: registerDto.full_name,
        email: registerDto.email,
        password: registerDto.password,
        role: registerDto.role,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-123',
        email: registerDto.email,
        role: registerDto.role,
      });
      expect(result).toEqual({
        user_id: 'user-123',
        name: registerDto.full_name,
        role: registerDto.role,
        access_token: 'mocked-jwt-token',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'existing' } as any);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-123',
        full_name: 'Test User',
        email: loginDto.email,
        role: UserRole.PELANGGAN,
        password_hash:
          '$2b$10$mockedhashformatchingpasswordvalidation',
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      const bcryptCompareSpy = jest
        .spyOn(require('bcrypt'), 'compare')
        .mockImplementation(async () => true);

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-123',
        email: loginDto.email,
        role: UserRole.PELANGGAN,
      });
      expect(result).toEqual({
        user_id: 'user-123',
        name: 'Test User',
        role: UserRole.PELANGGAN,
        access_token: 'mocked-jwt-token',
      });

      bcryptCompareSpy.mockRestore();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: 'user-123',
        full_name: 'Test User',
        email: loginDto.email,
        role: UserRole.PELANGGAN,
        password_hash: 'hashed-password',
        created_at: new Date(),
        updated_at: new Date(),
      } as any);

      const bcryptCompareSpy = jest
        .spyOn(require('bcrypt'), 'compare')
        .mockImplementation(async () => false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      bcryptCompareSpy.mockRestore();
    });
  });
});
