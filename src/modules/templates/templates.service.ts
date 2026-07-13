import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Template, TemplateStatus } from './entities/template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UpdateTemplateStatusDto } from './dto/update-template-status.dto';
import { TemplateQueryDto } from './dto/template-query.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
  ) {}

  async create(
    createTemplateDto: CreateTemplateDto,
    creatorId: string,
    thumbnailUrl?: string,
    fileUrl?: string,
  ): Promise<Template> {
    const template = this.templateRepository.create({
      ...createTemplateDto,
      creator_id: creatorId,
      thumbnail_url: thumbnailUrl,
      file_url: fileUrl,
      status: TemplateStatus.PENDING_REVIEW,
    });
    return this.templateRepository.save(template);
  }

  async findAllAdmin(query: TemplateQueryDto) {
    const { page, limit, status } = query;
    const skip = (page! - 1) * limit!;

    const where: any = {};
    if (status) where.status = status;

    const [data, total] = await this.templateRepository.findAndCount({
      where,
      relations: ['creator'],
      select: {
        creator: {
          id: true,
          full_name: true,
        },
      },
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const counts: Record<string, number> = {};
    for (const s of Object.values(TemplateStatus)) {
      counts[s] = await this.templateRepository.count({ where: { status: s } });
    }

    return {
      data,
      meta: {
        total,
        page: page,
        limit: limit,
        total_pages: Math.ceil(total / limit!),
      },
      counts,
    };
  }

  async findAllPublic(query: TemplateQueryDto) {
    const { category, keyword, page, limit } = query;
    const skip = (page! - 1) * limit!;

    const where: any = { status: TemplateStatus.PUBLISHED };

    if (category) {
      where.category = category;
    }

    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }

    const [data, total] = await this.templateRepository.findAndCount({
      where,
      relations: ['creator'],
      select: {
        creator: {
          id: true,
          full_name: true,
        },
      },
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page: page,
        limit: limit,
        total_pages: Math.ceil(total / limit!),
      },
    };
  }

  async findOne(id: string): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['creator'],
    });
    if (!template) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }
    return template;
  }

  async findByCreator(creatorId: string, query: TemplateQueryDto) {
    const { page, limit } = query;
    const skip = (page! - 1) * limit!;

    const [data, total] = await this.templateRepository.findAndCount({
      where: { creator_id: creatorId },
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page: page,
        limit: limit,
        total_pages: Math.ceil(total / limit!),
      },
    };
  }

  async update(
    id: string,
    creatorId: string,
    updateDto: UpdateTemplateDto,
    thumbnailUrl?: string,
    fileUrl?: string,
  ): Promise<Template> {
    const template = await this.findOne(id);
    if (template.creator_id !== creatorId) {
      throw new ForbiddenException('You can only update your own templates');
    }

    if (updateDto.name !== undefined) template.name = updateDto.name;
    if (updateDto.category !== undefined)
      template.category = updateDto.category;
    if (updateDto.description !== undefined)
      template.description = updateDto.description;
    if (updateDto.price !== undefined) template.price = updateDto.price;
    if (thumbnailUrl !== undefined) template.thumbnail_url = thumbnailUrl;
    if (fileUrl !== undefined) template.file_url = fileUrl;

    return this.templateRepository.save(template);
  }

  async updateStatus(
    id: string,
    updateDto: UpdateTemplateStatusDto,
  ): Promise<Template> {
    const template = await this.findOne(id);

    template.status = updateDto.status;
    if (updateDto.notes) {
      template.admin_notes = updateDto.notes;
    }

    return this.templateRepository.save(template);
  }

  async remove(id: string, creatorId: string): Promise<void> {
    const template = await this.findOne(id);
    if (template.creator_id !== creatorId) {
      throw new ForbiddenException('You can only delete your own templates');
    }
    await this.templateRepository.remove(template);
  }
}
