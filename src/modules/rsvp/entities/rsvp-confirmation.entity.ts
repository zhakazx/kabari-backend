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

export enum RsvpConfirmationStatus {
  HADIR = 'hadir',
  TIDAK_HADIR = 'tidak_hadir',
}

@Entity('rsvp_confirmations')
export class RsvpConfirmation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  invitation_id: string;

  @ManyToOne(() => Invitation, (invitation) => invitation.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invitation_id' })
  invitation: Invitation;

  @Column({
    type: 'enum',
    enum: RsvpConfirmationStatus,
  })
  rsvp_status: RsvpConfirmationStatus;

  @Column({ type: 'int', default: 1 })
  jumlah_hadir: number;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'boolean', default: false })
  is_proxy: boolean;

  @Column({ type: 'uuid', nullable: true })
  proxy_by_user_id: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'proxy_by_user_id' })
  proxy_by_user: User;

  @CreateDateColumn({ type: 'timestamp' })
  confirmed_at: Date;
}
