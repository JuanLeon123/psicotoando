import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.users.findOneBy({ id });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOneBy({ email: email.toLowerCase() });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.users.findOneBy({ googleId });
  }

  create(data: Partial<User>): Promise<User> {
    return this.users.save(this.users.create(data));
  }

  save(user: User): Promise<User> {
    return this.users.save(user);
  }

  /** Cuentas de clientes (sin la de administración), opcionalmente desde una fecha. */
  countCustomers(since?: Date): Promise<number> {
    return this.users.countBy({
      role: 'customer',
      ...(since ? { createdAt: MoreThanOrEqual(since) } : {}),
    });
  }
}
