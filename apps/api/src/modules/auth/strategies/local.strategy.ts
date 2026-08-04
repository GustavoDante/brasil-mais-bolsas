import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import type { UserSafe } from '../../users/types/user-safe.type';
import { AuthService } from '../auth.service';
import { AppException } from '../../../common/exceptions/app.exception';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<UserSafe> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new AppException('invalid-credentials');
    }

    return user;
  }
}
