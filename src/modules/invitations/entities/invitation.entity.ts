import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../../events/entities/event.entity';

export enum InvitationCategory {
  DIGITAL = 'digital',
  FISIK = 'fisik',
}

export enum RsvpStatus {
  PENDING = 'pending',
  HADIR = 'hadir',
  TIDAK_HADIR = 'tidak_hadir',
}

export enum CheckInStatus {
  BELUM_CHECK_IN = 'belum_check_in',
  SUDAH_CHECK_IN = 'sudah_check_in',
}

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  tamu_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tamu_phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  tamu_email: string;

  @Column({
    type: 'enum',
    enum: InvitationCategory,
    default: InvitationCategory.DIGITAL,
  })
  category: InvitationCategory;

  @Column({ type: 'varchar', length: 255, unique: true })
  qr_code_token: string;

  @Column({
    type: 'enum',
    enum: RsvpStatus,
    default: RsvpStatus.PENDING,
  })
  rsvp_status: RsvpStatus;

  @Column({ type: 'int', default: 0 })
  jumlah_hadir: number;

  @Column({
    type: 'enum',
    enum: CheckInStatus,
    default: CheckInStatus.BELUM_CHECK_IN,
  })
  check_in_status: CheckInStatus;

  @Column({ type: 'uuid' })
  event_id: string;

  @ManyToOne(() => Event, (event) => event.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
