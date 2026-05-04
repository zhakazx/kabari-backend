import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Template } from '../../templates/entities/template.entity';
import { Order } from './order.entity';

@Entity('template_sales')
export class TemplateSale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  royalty_amount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  royalty_percent: number;

  @Column({ type: 'timestamp', nullable: true })
  paid_to_creator_at: Date;

  @Column({ type: 'uuid' })
  template_id: string;

  @ManyToOne(() => Template, (template) => template.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: Template;

  @Column({ type: 'uuid' })
  order_id: string;

  @ManyToOne(() => Order, (order) => order.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
