import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { EventsService } from './events.service';
import { EventQueryDto } from './dto/event-query.dto';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
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

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(UserRole.PELANGGAN)
  create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() user: { user_id: string },
  ) {
    return this.eventsService.create(createEventDto, user.user_id);
  }

  @Get()
  @Roles(UserRole.PELANGGAN)
  findAll(
    @CurrentUser() user: { user_id: string },
    @Query() query: EventQueryDto,
  ) {
    return this.eventsService.findAllByPelanggan(user.user_id, query);
  }

  @Get(':id')
  @Roles(UserRole.PELANGGAN)
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PELANGGAN)
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() user: { user_id: string },
  ) {
    return this.eventsService.update(id, updateEventDto, user.user_id);
  }

  @Delete(':id')
  @Roles(UserRole.PELANGGAN)
  remove(@Param('id') id: string, @CurrentUser() user: { user_id: string }) {
    return this.eventsService.remove(id, user.user_id);
  }

  @Get(':id/dashboard')
  @Roles(UserRole.PELANGGAN)
  getDashboard(
    @Param('id') id: string,
    @CurrentUser() user: { user_id: string },
  ) {
    return this.eventsService.getDashboardStats(id, user.user_id);
  }

  @Post(':id/gallery')
  @Roles(UserRole.PELANGGAN)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'gallery', maxCount: 10 }], {
      storage: storageConfig(path.join(process.cwd(), 'uploads', 'gallery')),
      fileFilter: imageFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadGallery(
    @Param('id') id: string,
    @CurrentUser() user: { user_id: string },
    @UploadedFiles() files: { gallery?: Express.Multer.File[] },
  ) {
    if (!files?.gallery?.length) {
      throw new BadRequestException('At least one gallery image is required');
    }

    const event = await this.eventsService.findOne(id);
    if (event.pelanggan_id !== user.user_id) {
      throw new ForbiddenException('You can only update your own events');
    }

    const newUrls = files.gallery.map(
      (file) => `/uploads/gallery/${file.filename}`,
    );

    const existingUrls = event.gallery_urls
      ? JSON.parse(event.gallery_urls)
      : [];
    const allUrls = [...existingUrls, ...newUrls];

    await this.eventsService.update(
      id,
      { gallery_urls: JSON.stringify(allUrls) } as any,
      user.user_id,
    );

    return { gallery_urls: allUrls };
  }
}
