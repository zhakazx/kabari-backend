import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplatesService } from './templates.service';
import { Template, TemplateStatus } from './entities/template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateStatusDto } from './dto/update-template-status.dto';
import { TemplateQueryDto } from './dto/template-query.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockTemplateRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

describe('TemplatesService', () => {
  let service: TemplatesService;
  let repository: jest.Mocked<Repository<Template>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: getRepositoryToken(Template),
          useFactory: mockTemplateRepository,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    repository = module.get(getRepositoryToken(Template));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a template with pending_review status', async () => {
      const createDto: CreateTemplateDto = {
        name: 'Wedding Template',
        category: 'wedding',
        description: 'A beautiful wedding template',
        price: 150000,
      };
      const creatorId = 'creator-123';
      const thumbnailUrl = '/uploads/templates/thumb.png';
      const fileUrl = '/uploads/templates/template.zip';

      const expectedTemplate = {
        id: 'template-123',
        ...createDto,
        creator_id: creatorId,
        thumbnail_url: thumbnailUrl,
        file_url: fileUrl,
        status: TemplateStatus.PENDING_REVIEW,
      };

      repository.create.mockReturnValue(expectedTemplate as any);
      repository.save.mockResolvedValue(expectedTemplate as any);

      const result = await service.create(createDto, creatorId, thumbnailUrl, fileUrl);

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        creator_id: creatorId,
        thumbnail_url: thumbnailUrl,
        file_url: fileUrl,
        status: TemplateStatus.PENDING_REVIEW,
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.status).toBe(TemplateStatus.PENDING_REVIEW);
    });
  });

  describe('findAllPublic', () => {
    it('should return published templates with pagination', async () => {
      const query: TemplateQueryDto = {
        category: 'wedding',
        keyword: 'elegant',
        page: 1,
        limit: 10,
      };

      const templates = [
        { id: '1', name: 'Elegant Wedding', status: TemplateStatus.PUBLISHED },
      ] as Template[];

      repository.findAndCount.mockResolvedValue([templates, 1]);

      const result = await service.findAllPublic(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: TemplateStatus.PUBLISHED,
            category: 'wedding',
            name: expect.any(Object), // Like operator
          }),
          skip: 0,
          take: 10,
          order: { created_at: 'DESC' },
        }),
      );
      expect(result.data).toEqual(templates);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a template by id', async () => {
      const template = { id: '1', name: 'Test' } as Template;
      repository.findOne.mockResolvedValue(template);

      const result = await service.findOne('1');
      expect(result).toEqual(template);
    });

    it('should throw NotFoundException if template not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update template status and notes', async () => {
      const template = {
        id: '1',
        name: 'Test',
        status: TemplateStatus.PENDING_REVIEW,
      } as Template;

      const updateDto: UpdateTemplateStatusDto = {
        status: TemplateStatus.PUBLISHED,
        notes: 'Looks good',
      };

      repository.findOne.mockResolvedValue(template);
      repository.save.mockResolvedValue({
        ...template,
        status: TemplateStatus.PUBLISHED,
        admin_notes: 'Looks good',
      } as Template);

      const result = await service.updateStatus('1', updateDto);

      expect(result.status).toBe(TemplateStatus.PUBLISHED);
      expect(result.admin_notes).toBe('Looks good');
    });
  });

  describe('remove', () => {
    it('should remove template if owned by creator', async () => {
      const template = {
        id: '1',
        creator_id: 'creator-123',
      } as Template;

      repository.findOne.mockResolvedValue(template);
      repository.remove.mockResolvedValue(undefined);

      await service.remove('1', 'creator-123');
      expect(repository.remove).toHaveBeenCalledWith(template);
    });

    it('should throw ForbiddenException if not owner', async () => {
      const template = {
        id: '1',
        creator_id: 'creator-123',
      } as Template;

      repository.findOne.mockResolvedValue(template);

      await expect(service.remove('1', 'other-creator')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
