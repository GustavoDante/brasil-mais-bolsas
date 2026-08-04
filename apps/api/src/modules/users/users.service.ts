import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma/prisma.service';
import type { Address, User } from '@repo/db';
import type { RegisterDto } from './dto/register.dto';
import type { AdminUpdateUserDto, CreateUserDto, UpdateUserDto } from './dto/users.dto';
import type { UserSafe } from './types/user-safe.type';

export type UserWithAddress = User & { address: Address | null };

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByIdWithAddress(id: string): Promise<UserWithAddress | null> {
    return this.prisma.user
      .findUnique({
        where: { id },
        include: { address: true },
      })
      .then((u) => (u && !u.delete ? u : null));
  }

  async findAll(): Promise<UserWithAddress[]> {
    return this.prisma.user.findMany({
      where: { delete: false },
      include: { address: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findSystemUsers(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        delete: false,
        type: { in: ['admin', 'manager'] },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateUserDto): Promise<UserWithAddress> {
    const existing = await this.findByEmail(dto.email.toLowerCase());
    if (existing) {
      throw new ConflictException('Email já está em uso');
    }

    const passwordRaw = dto.cpf.replace(/\D/g, '');
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.toUpperCase(),
        email: dto.email.toLowerCase(),
        password: hashedPassword,
        phone: dto.phone,
        birthdate: new Date(dto.birthdate),
        cpf: dto.cpf,
        rg: dto.rg,
        rg_emissor: dto.rg_emissor,
        type: dto.type ?? 'user',
        secondary_phone: dto.secondary_phone,
        whatsapp_phone: dto.whatsapp_phone,
        friend_phone: dto.friend_phone,
        ccp: dto.ccp?.toUpperCase(),
        observations: dto.observations,
        partner_id: dto.partner_id,
        institution_id: dto.institution_id,
        address: {
          create: {
            street: dto.address.street.toUpperCase(),
            city: dto.address.city.toUpperCase(),
            state: dto.address.state.toUpperCase(),
            number: dto.address.number,
            district: dto.address.district.toUpperCase(),
            postal_code: dto.address.postal_code,
            complement: dto.address.complement?.toUpperCase(),
          },
        },
      },
      include: { address: true },
    });

    return user;
  }

  /**
   * Cadastro público de aluno (porte do `POST /user/register` do legado).
   *
   * O tipo é sempre `user` — a rota é anônima e não pode criar admin/manager. A senha
   * inicial é o CPF (só números), como no sistema antigo, e o vínculo com parceiro é
   * resolvido a partir do `partner_code` (código inválido é ignorado, não é erro).
   * Os admins recebem uma notificação, igual ao fluxo antigo.
   */
  async register(dto: RegisterDto): Promise<UserWithAddress> {
    const email = dto.email.toLowerCase();
    const cpfDigits = dto.cpf.replace(/\D/g, '');

    if (await this.findByEmail(email)) {
      throw new ConflictException('Email já está em uso');
    }

    const existingCpf = await this.prisma.user.findFirst({
      where: { cpf: dto.cpf, delete: false },
    });
    if (existingCpf) {
      throw new ConflictException('CPF já cadastrado');
    }

    const partnerId = await this.resolvePartnerCode(dto.partner_code);
    const hashedPassword = await bcrypt.hash(cpfDigits, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.toUpperCase(),
        email,
        password: hashedPassword,
        type: 'user',
        phone: dto.phone,
        birthdate: new Date(dto.birthdate),
        cpf: dto.cpf,
        rg: dto.rg,
        rg_emissor: dto.rg_emissor,
        secondary_phone: dto.secondary_phone,
        whatsapp_phone: dto.whatsapp_phone,
        friend_phone: dto.friend_phone,
        family_income: dto.family_income,
        ccp: dto.ccp?.toUpperCase(),
        register_scholarship: dto.register_scholarship,
        partner_id: partnerId,
        address: {
          create: {
            street: dto.address.street.toUpperCase(),
            city: dto.address.city.toUpperCase(),
            state: dto.address.state.toUpperCase(),
            number: dto.address.number,
            district: dto.address.district.toUpperCase(),
            postal_code: dto.address.postal_code,
            complement: dto.address.complement?.toUpperCase(),
          },
        },
      },
      include: { address: true },
    });

    await this.notifyAdminsOfNewUser(user);

    return user;
  }

  /** Grava o hash do token de recuperação e a validade. */
  async setPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { reset_password_token: tokenHash, reset_password_expires: expiresAt },
    });
  }

  /** Busca pelo hash do token, desde que ainda esteja no prazo e a conta esteja ativa. */
  findByValidResetToken(tokenHash: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        reset_password_token: tokenHash,
        reset_password_expires: { gt: new Date() },
        delete: false,
        active: true,
      },
    });
  }

  /** Troca a senha e invalida o token — um link de recuperação só serve uma vez. */
  async updatePasswordAndClearResetToken(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
      },
    });
  }

  private async resolvePartnerCode(code?: string): Promise<string | undefined> {
    if (!code) return undefined;

    const partner = await this.prisma.partner.findFirst({
      where: { code, active: true, delete: false },
      select: { id: true },
    });

    return partner?.id;
  }

  private async notifyAdminsOfNewUser(user: User): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { type: 'admin', delete: false, active: true },
      select: { id: true, name: true },
    });

    if (admins.length === 0) return;

    await this.prisma.notification.createMany({
      data: admins.map((admin) => ({
        user_id: admin.id,
        title: 'Novo usuário cadastrado',
        message: `Olá, ${admin.name}. O usuário ${user.name} (e-mail: ${user.email}) foi cadastrado no sistema.`,
      })),
    });
  }

  async update(id: string, dto: UpdateUserDto | AdminUpdateUserDto): Promise<UserWithAddress> {
    const user = await this.findByIdWithAddress(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (dto.email) {
      const emailLower = dto.email.toLowerCase();
      const existing = await this.findByEmail(emailLower);
      if (existing && existing.id !== id) {
        throw new ConflictException('Email já está em uso');
      }
    }

    const { address: addressDto, password, ...userFields } = dto;

    const dataToUpdate: Record<string, unknown> = {};

    if (userFields.name) dataToUpdate['name'] = userFields.name.toUpperCase();
    if (userFields.email) dataToUpdate['email'] = userFields.email.toLowerCase();
    if (userFields.phone) dataToUpdate['phone'] = userFields.phone;
    if (userFields.birthdate) dataToUpdate['birthdate'] = new Date(userFields.birthdate);
    if (userFields.cpf) dataToUpdate['cpf'] = userFields.cpf;
    if (userFields.rg) dataToUpdate['rg'] = userFields.rg;
    if (userFields.rg_emissor) dataToUpdate['rg_emissor'] = userFields.rg_emissor;
    if (userFields.secondary_phone !== undefined)
      dataToUpdate['secondary_phone'] = userFields.secondary_phone;
    if (userFields.whatsapp_phone !== undefined)
      dataToUpdate['whatsapp_phone'] = userFields.whatsapp_phone;
    if (userFields.friend_phone !== undefined)
      dataToUpdate['friend_phone'] = userFields.friend_phone;
    if (userFields.ccp) dataToUpdate['ccp'] = userFields.ccp.toUpperCase();
    if (userFields.observations !== undefined)
      dataToUpdate['observations'] = userFields.observations;
    if ('type' in userFields && userFields.type) dataToUpdate['type'] = userFields.type;
    if ('active' in userFields && userFields.active !== undefined)
      dataToUpdate['active'] = userFields.active;
    if (password) dataToUpdate['password'] = await bcrypt.hash(password, 10);

    const addressUpdate: Record<string, unknown> = {};
    if (addressDto) {
      if (addressDto.street) addressUpdate['street'] = addressDto.street.toUpperCase();
      if (addressDto.city) addressUpdate['city'] = addressDto.city.toUpperCase();
      if (addressDto.state) addressUpdate['state'] = addressDto.state.toUpperCase();
      if (addressDto.number) addressUpdate['number'] = addressDto.number;
      if (addressDto.district) addressUpdate['district'] = addressDto.district.toUpperCase();
      if (addressDto.postal_code) addressUpdate['postal_code'] = addressDto.postal_code;
      if (addressDto.complement !== undefined)
        addressUpdate['complement'] = addressDto.complement?.toUpperCase();
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...dataToUpdate,
        ...(Object.keys(addressUpdate).length > 0
          ? {
              address: user.address
                ? { update: addressUpdate }
                : {
                    create: {
                      street: (addressUpdate['street'] as string) ?? '',
                      city: (addressUpdate['city'] as string) ?? '',
                      state: (addressUpdate['state'] as string) ?? '',
                      number: (addressUpdate['number'] as string) ?? '',
                      district: (addressUpdate['district'] as string) ?? '',
                      postal_code: (addressUpdate['postal_code'] as string) ?? '',
                    },
                  },
            }
          : {}),
      },
      include: { address: true },
    });
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user || user.delete) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.prisma.user.update({
      where: { id },
      data: { active: !user.active },
    });
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user || user.delete) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.prisma.user.update({
      where: { id },
      data: { delete: true, active: false },
    });
  }

  toSafeUser(user: User): UserSafe {
    const {
      password: _password,
      reset_password_token: _reset_password_token,
      reset_password_expires: _reset_password_expires,
      ...safe
    } = user;
    return safe;
  }
}
