import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Template } from '../../templates/entities/template.entity';

export enum EventStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  event_name: string;

  @Column({ type: 'timestamp' })
  event_date: Date;

  @Column({ type: 'varchar', length: 255 })
  venue_name: string;

  @Column({ type: 'text', nullable: true })
  venue_address: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  maps_url: string;

  @Column({ type: 'text', nullable: true })
  gallery_urls: string; // JSON array of image URLs

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  status: EventStatus;

  @Column({ type: 'uuid' })
  pelanggan_id: string;

  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pelanggan_id' })
  pelanggan: User;

  @Column({ type: 'uuid', nullable: true })
  template_id: string;

  @ManyToOne(() => Template, (template) => template.id, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'template_id' })
  template: Template;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
