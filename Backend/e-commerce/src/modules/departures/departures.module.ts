import { Module } from '@nestjs/common';
import { DeparturesController } from './departures.controller';
import { DeparturesService } from './departures.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeparturesController],
  providers: [DeparturesService],
  exports: [DeparturesService],
})
export class DeparturesModule {}
