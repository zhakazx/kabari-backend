import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckinsService } from './checkins.service';
import { CheckinsController } from './checkins.controller';
import { CheckIn } from './entities/check-in.entity';
import { Invitation } from '../invitations/entities/invitation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckIn, Invitation])],
  controllers: [CheckinsController],
  providers: [CheckinsService],
  exports: [CheckinsService],
})
export class CheckinsModule {}
