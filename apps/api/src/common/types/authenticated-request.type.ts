import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    type: string;
    institution_id?: string;
  };
}
