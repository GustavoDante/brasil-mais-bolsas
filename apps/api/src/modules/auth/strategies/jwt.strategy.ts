import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from '../types/jwt-payload.type';

export type JwtUser = {
  userId: string;
  email: string;
  type: string;
  institution_id?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? '',
    });
  }

  validate(payload: JwtPayload): JwtUser {
    return {
      userId: payload.sub,
      email: payload.email,
      type: payload.type,
      institution_id: payload.institution_id,
    };
  }
}
