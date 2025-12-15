import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey, Tenant, User } from '../../entities';
import { AuthService } from './auth.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { JwtAuthGuard } from './guards/jwt.guard';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, ApiKey, Tenant]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('auth.jwtSecret'),
        signOptions: { expiresIn: `${config.get<number>('auth.jwtTtlSeconds')}s` },
      }),
    }),
  ],
  providers: [AuthService, ApiKeyGuard, JwtAuthGuard],
  exports: [AuthService, ApiKeyGuard, JwtAuthGuard, JwtModule],
})
export class AuthModule {}

