import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { MailService } from '../../integrations/mail/mail.service';
import type { RegisterDto } from '../users/dto/register.dto';
import type { UserSafe } from '../users/types/user-safe.type';
import { UsersService } from '../users/users.service';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { JwtPayload } from './types/jwt-payload.type';
import { AppException } from '../../common/exceptions/app.exception';

const DEFAULT_RESET_TOKEN_TTL_HOURS = 24;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserSafe | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !user.password) {
      return null;
    }

    const normalized = password.replace(/\D/g, '');
    const matchesPassword = await bcrypt.compare(password, user.password);

    if (!matchesPassword && normalized !== password && normalized.length === 11) {
      const matchesCpf = await bcrypt.compare(normalized, user.password);
      if (!matchesCpf) {
        return null;
      }
    } else if (!matchesPassword) {
      return null;
    }

    return this.usersService.toSafeUser(user);
  }

  async login(user: UserSafe): Promise<AuthResponseDto> {
    // `institution_id` entra por spread condicional, não como `?? undefined`: é a chave de
    // escopo que `/institutions`, `/courses`, `/scholarships` e `/reports` leem de
    // `req.user`, e quem não tem vínculo (aluno, admin) continua com um token de 3 claims.
    // Ela era declarada em `JwtPayload` e lida pelo `JwtStrategy`, mas nunca era assinada —
    // ou seja, todo gestor em produção caía no ramo sem escopo e via dado de outras
    // instituições. Token já emitido só ganha a claim depois de um novo login: rotacione
    // `JWT_SECRET` no deploy para fechar a janela.
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      type: user.type,
      ...(user.institution_id ? { institution_id: user.institution_id } : {}),
    };

    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken, user };
  }

  /**
   * Cadastro público de aluno: cria o usuário, manda as boas-vindas e já devolve o token,
   * para o site não precisar de um login logo em seguida.
   */
  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.register(dto);

    // E-mail é efeito colateral: o cadastro está feito mesmo se o envio falhar
    await this.mailService.sendNewUser(user.email, { name: user.name });

    return this.login(this.usersService.toSafeUser(user));
  }

  /**
   * Início da recuperação de senha.
   *
   * A resposta é sempre a mesma, exista ou não a conta — o legado devolvia
   * `user-not-found`, o que transformava a rota em um verificador de e-mails cadastrados.
   * O token vai por e-mail em texto puro, mas no banco fica só o hash SHA-256: um vazamento
   * da tabela não permite redefinir senha de ninguém.
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email.toLowerCase());

    if (!user || user.delete || !user.active) return;

    const token = randomBytes(32).toString('hex');
    const expiresInHours = this.resetTokenTtlHours;
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

    await this.usersService.setPasswordResetToken(user.id, this.hashToken(token), expiresAt);

    const result = await this.mailService.sendPasswordReset(user.email, {
      name: user.name,
      token,
      expiresInHours,
    });

    // Não propaga a falha: o retorno precisa ser idêntico ao de um e-mail inexistente
    if (!result.sent) {
      this.logger.error(
        `Token de recuperação gerado para o usuário ${user.id}, mas o e-mail não saiu (${result.reason})`,
      );
    }
  }

  /** Conclusão da recuperação: valida o token, troca a senha e avisa o dono da conta. */
  async resetPassword(token: string, password: string, repassword: string): Promise<void> {
    if (!this.matchesConfirmation(password, repassword)) {
      throw new AppException('passwords-not-matching');
    }

    const user = await this.usersService.findByValidResetToken(this.hashToken(token));

    if (!user) {
      throw new AppException('token-not-found-or-expired');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.usersService.updatePasswordAndClearResetToken(user.id, hashedPassword);

    await this.mailService.sendPasswordResetConfirm(user.email, {
      name: user.name,
      changedAt: new Date(),
    });
  }

  private get resetTokenTtlHours(): number {
    const configured = Number(this.configService.get<string>('PASSWORD_RESET_TOKEN_TTL_HOURS'));

    return Number.isFinite(configured) && configured > 0
      ? configured
      : DEFAULT_RESET_TOKEN_TTL_HOURS;
  }

  /** SHA-256 é suficiente aqui: o token já é 256 bits de aleatoriedade, não uma senha. */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private matchesConfirmation(password: string, repassword: string): boolean {
    const a = Buffer.from(password);
    const b = Buffer.from(repassword);

    return a.length === b.length && timingSafeEqual(a, b);
  }
}
