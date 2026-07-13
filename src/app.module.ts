import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { envValidationSchema } from './config/env.validation';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { EventsModule } from './modules/events/events.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { RsvpModule } from './modules/rsvp/rsvp.module';
import { CheckinsModule } from './modules/checkins/checkins.module';
import { GatewaysModule } from './gateways/gateways.module';
import { OrdersModule } from './modules/orders/orders.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig],
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production',
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    UsersModule,
    TemplatesModule,
    EventsModule,
    InvitationsModule,
    RsvpModule,
    CheckinsModule,
    GatewaysModule,
    OrdersModule,
    NotificationsModule,
    ReportsModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
