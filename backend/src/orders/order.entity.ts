import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from '../catalog/product.entity';

/** Estado del pago, tal como lo reporta Wompi (pending hasta tener respuesta final). */
export type PaymentStatus =
  'pending' | 'approved' | 'declined' | 'voided' | 'error';

/** Estado logístico que gestiona la administración desde el panel. */
export type FulfillmentStatus =
  'unfulfilled' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Referencia única enviada a Wompi; también la ve el cliente. */
  @Column({ type: 'varchar', length: 40 })
  reference!: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: PaymentStatus;

  @Column({ type: 'varchar', length: 20, default: 'unfulfilled' })
  fulfillment!: FulfillmentStatus;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'customer_name', type: 'varchar', length: 120 })
  customerName!: string;

  @Column({ name: 'customer_email', type: 'varchar', length: 254 })
  customerEmail!: string;

  @Column({ name: 'customer_phone', type: 'varchar', length: 30 })
  customerPhone!: string;

  @Column({ name: 'customer_document', type: 'varchar', length: 30 })
  customerDocument!: string;

  @Column({ name: 'shipping_department', type: 'varchar', length: 60 })
  shippingDepartment!: string;

  @Column({ name: 'shipping_city', type: 'varchar', length: 80 })
  shippingCity!: string;

  @Column({ name: 'shipping_address', type: 'varchar', length: 200 })
  shippingAddress!: string;

  @Column({
    name: 'shipping_notes',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  shippingNotes!: string | null;

  @Column({ name: 'subtotal_cop', type: 'integer' })
  subtotalCop!: number;

  @Column({ name: 'shipping_cop', type: 'integer' })
  shippingCop!: number;

  @Column({ name: 'total_cop', type: 'integer' })
  totalCop!: number;

  @Column({ type: 'varchar', length: 3, default: 'COP' })
  currency!: string;

  @Column({
    name: 'wompi_transaction_id',
    type: 'varchar',
    length: 60,
    nullable: true,
  })
  wompiTransactionId!: string | null;

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  paymentMethod!: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  /** True cuando ya se descontó el inventario (evita descontarlo dos veces). */
  @Column({ name: 'stock_applied', type: 'boolean', default: false })
  stockApplied!: boolean;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: ['insert'] })
  items!: OrderItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

/** Línea del pedido con nombre y precio copiados al comprar (no cambian después). */
@Entity({ name: 'order_items' })
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'product_id', type: 'uuid', nullable: true })
  productId!: string | null;

  @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_id' })
  product!: Product | null;

  @Column({ name: 'product_name', type: 'varchar', length: 120 })
  productName!: string;

  @Column({ name: 'unit_price_cop', type: 'integer' })
  unitPriceCop!: number;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ name: 'line_total_cop', type: 'integer' })
  lineTotalCop!: number;
}
