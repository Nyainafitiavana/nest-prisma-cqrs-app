import { Injectable } from '@nestjs/common';
import { environment } from '../../environment';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const adapter = new PrismaPg({
      host: environment.DB_HOST,
      port: environment.DB_PORT,
      user: environment.DB_USER,
      password: environment.DB_PASSWORD,
      database: environment.DB_NAME,
      connectionLimit: 10, // optional, default is 10
    });
    super({ adapter });
  }
}
