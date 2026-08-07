import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { JwtUser } from '../strategies/jwt.strategy';

/**
 * Autenticação opcional: valida o token quando ele vem e segue sem `req.user` quando não vem.
 *
 * Existe para o checkout, a única rota que atende os dois públicos — o visitante que se
 * cadastra durante a compra e o aluno que já tem conta. Duplicá-la em versão pública e
 * versão autenticada faria as duas divergirem na regra de cobrança, que é a parte cara.
 *
 * Um token **inválido ou expirado** continua sendo tratado como ausente (o visitante segue,
 * informando os dados de cadastro): o `handleRequest` só descarta o erro, ele não aceita
 * credencial ruim como se fosse boa — nada aqui devolve usuário sem assinatura válida.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = JwtUser>(_error: unknown, user: TUser | false): TUser | undefined {
    return user === false ? undefined : user;
  }
}
