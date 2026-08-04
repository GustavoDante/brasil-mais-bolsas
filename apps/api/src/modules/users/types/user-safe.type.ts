import type { User } from '@repo/db';

export type UserSafe = Omit<User, 'password' | 'reset_password_token' | 'reset_password_expires'>;
