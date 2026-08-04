export type JwtPayload = {
  sub: string;
  email: string;
  type: string;
  institution_id?: string;
};
