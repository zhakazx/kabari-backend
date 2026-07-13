import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { UpdateTemplateStatusDto } from './dto/update-template-status.dto';
import { TemplateQueryDto } from './dto/template-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  storageConfig,
  imageFileFilter,
} from '../../common/utils/storage.util';
import * as path from 'path';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  findAllPublic(@Query() query: TemplateQueryDto) {
    return this.templatesService.findAllPublic(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.KREATOR)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'template_file', maxCount: 1 },
      ],
      {
        storage: storageConfig(
          path.join(process.cwd(), 'uploads', 'templates'),
        ),
        fileFilter: (req, file, callback) => {
          if (file.fieldname === 'thumbnail') {
            return imageFileFilter(req, file, callback);
          }
          callback(null, true);
        },
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      },
    ),
  )
  create(
    @Body() createTemplateDto: CreateTemplateDto,
    @CurrentUser() user: { user_id: string; role: string },
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      template_file?: Express.Multer.File[];
    },
  ) {
    if (!files?.thumbnail?.[0]) {
      throw new BadRequestException('Thumbnail is required');
    }

    const thumbnailUrl = `/uploads/templates/${files.thumbnail[0].filename}`;
    const fileUrl = files.template_file?.[0]
      ? `/uploads/templates/${files.template_file[0].filename}`
      : undefined;

    return this.templatesService.create(
      createTemplateDto,
      user.user_id,
      thumbnailUrl,
      fileUrl,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.KREATOR)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'thumbnail', maxCount: 1 },
        { name: 'template_file', maxCount: 1 },
      ],
      {
        storage: storageConfig(
          path.join(process.cwd(), 'uploads', 'templates'),
        ),
        fileFilter: (req, file, callback) => {
          if (file.fieldname === 'thumbnail') {
            return imageFileFilter(req, file, callback);
          }
          callback(null, true);
        },
        limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      },
    ),
  )
  update(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @CurrentUser() user: { user_id: string; role: string },
    @UploadedFiles()
    files: {
      thumbnail?: Express.Multer.File[];
      template_file?: Express.Multer.File[];
    },
  ) {
    const thumbnailUrl = files?.thumbnail?.[0]
      ? `/uploads/templates/${files.thumbnail[0].filename}`
      : undefined;
    const fileUrl = files?.template_file?.[0]
      ? `/uploads/templates/${files.template_file[0].filename}`
      : undefined;

    return this.templatesService.update(
      id,
      user.user_id,
      updateTemplateDto,
      thumbnailUrl,
      fileUrl,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id/validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  validateTemplate(
    @Param('id') id: string,
    @Body() updateDto: UpdateTemplateStatusDto,
  ) {
    return this.templatesService.updateStatus(id, updateDto);
  }

  @Get('creator/my-templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.KREATOR)
  findMyTemplates(
    @CurrentUser() user: { user_id: string },
    @Query() query: TemplateQueryDto,
  ) {
    return this.templatesService.findByCreator(user.user_id, query);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllAdmin(@Query() query: TemplateQueryDto) {
    return this.templatesService.findAllAdmin(query);
  }
}
