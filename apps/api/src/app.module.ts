import { Module } from '@nestjs/common';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { PublicController } from './public/public.controller';
import { PrismaService } from './prisma.service';

@Module({
  controllers: [AdminController, PublicController],
  providers: [AdminService, PrismaService]
})
export class AppModule {}
