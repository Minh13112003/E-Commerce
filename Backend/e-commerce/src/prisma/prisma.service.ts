import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(){
    const adapter = new PrismaPg({
        connectionString: process.env.DATABASE_URL,
    })
    super({
        adapter,
        log : process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn'] : ['error'],
    })
  }

  async onModuleInit(){
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
