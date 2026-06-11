import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Logger } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  constructor(){
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    const adapter = new PrismaPg({
        connectionString,
    })
    super({
        adapter,
        log: process.env.NODE_ENV === 'development'
    ? [
        { emit: 'event', level: 'query' },  // ← emit: 'event' mới trigger được $on
        { emit: 'event', level: 'warn' },
        { emit: 'stdout', level: 'info' },  // info in thẳng ra console
      ]
    : [{ emit: 'event', level: 'error' }],
    })
  }

  async onModuleInit() {
  // Prisma 5+ dùng cách này thay vì $on
  const prisma = this as unknown as PrismaClient & {
    $on(event: string, callback: (e: any) => void): void;
  };

  prisma.$on('query', (e: any) => {
    this.logger.log(`⏱ Duration: ${e.duration}ms`);
    this.logger.debug(`📝 Query: ${e.query}`);
    this.logger.debug(`📦 Params: ${e.params}`);
  });

  prisma.$on('warn', (e: any) => this.logger.warn(e.message));
  prisma.$on('error', (e: any) => this.logger.error(e.message));

  await this.$connect();
}
  async onModuleDestroy(){
    await this.$disconnect();
  }

  async cleanDb(){
    if(process.env.NODE_ENV === 'production') throw new Error('Cannot clean database in production');

    const models = Reflect.ownKeys(this).filter((key) => typeof key === 'string' && key.startsWith('_'));
    
    await Promise.all(
        models.map(modelkey =>{
            if(typeof modelkey === 'string' ) return this[modelkey].deleteMany();
        })
    );
  }
}
