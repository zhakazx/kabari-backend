import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UserQueryDto } from './dto/user-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.userRepository.create({
      ...createUserDto,
      password_hash: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async findAll(query: UserQueryDto) {
    const { page, limit, keyword, role } = query;
    const skip = (page! - 1) * limit!;

    const where: any[] = [];

    if (role && keyword) {
      where.push(
        { role, full_name: Like(`%${keyword}%`) },
        { role, email: Like(`%${keyword}%`) },
      );
    } else if (keyword) {
      where.push(
        { full_name: Like(`%${keyword}%`) },
        { email: Like(`%${keyword}%`) },
      );
    } else if (role) {
      where.push({ role });
    }

    const finalWhere = where.length > 0 ? where : undefined;

    const [data, total] = await this.userRepository.findAndCount({
      where: finalWhere,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const counts: Record<string, number> = {};
    for (const r of Object.values(UserRole)) {
      counts[r] = await this.userRepository.count({ where: { role: r } });
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit!),
      },
      counts,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      (user as any).password_hash = updateUserDto.password;
      delete (updateUserDto as any).password;
    }
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
