import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Invitation } from '../../invitations/entities/invitation.entity';
import { User } from '../../users/entities/user.entity';

export enum CheckInMethod {
  QR_SCAN = 'qr_scan',
  MANUAL = 'manual',
}

@Entity('check_ins')
export class CheckIn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  invitation_id: string;

  @ManyToOne(() => Invitation, (invitation) => invitation.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invitation_id' })
  invitation: Invitation;

  @CreateDateColumn({ type: 'timestamp' })
  checked_in_at: Date;

  @Column({ type: 'uuid' })
  checked_in_by: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checked_in_by' })
  checked_in_by_user: User;

  @Column({
    type: 'enum',
    enum: CheckInMethod,
    default: CheckInMethod.QR_SCAN,
  })
  method: CheckInMethod;
}
