import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'customer' | 'admin';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 254 })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'full_name', type: 'varchar', length: 120 })
  fullName!: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone!: string | null;

  @Column({ name: 'child_name', type: 'varchar', length: 120, nullable: true })
  childName!: string | null;

  @Column({ name: 'child_birth_date', type: 'date', nullable: true })
  childBirthDate!: string | null;

  @Column({ name: 'google_id', type: 'varchar', nullable: true })
  googleId!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'customer' })
  role!: UserRole;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

export interface PublicUser {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly phone: string | null;
  readonly childName: string | null;
  readonly childBirthDate: string | null;
  readonly avatarUrl: string | null;
  readonly hasPassword: boolean;
  readonly googleLinked: boolean;
  readonly role: UserRole;
  readonly createdAt: string;
}

/** The only shape of a user that leaves the API; never exposes hashes or provider ids. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    childName: user.childName,
    childBirthDate: user.childBirthDate,
    avatarUrl: user.avatarUrl,
    hasPassword: user.passwordHash !== null,
    googleLinked: user.googleId !== null,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
