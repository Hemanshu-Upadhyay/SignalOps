import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('Missing Authorization header');

    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = await this.jwtService.verifyAsync(token);
      const user = await this.users.findOne({
        where: { id: payload.sub },
        relations: ['tenant'],
      });
      if (!user) throw new UnauthorizedException();
      request.user = user;
      request.tenant = user.tenant;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}

