import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CertificatesModule } from './modules/certificates/certificates.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    CoursesModule,
    DashboardModule,
    CertificatesModule
  ],
})
export class AppModule {}
