import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { ContactRequestDto, ContactResponseDto } from './dto/contact.dto';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly service: ContactService) {}

  // Rota publica que dispara e-mail: sem limite proprio, o teto global de 100/60s ainda
  // permitiria inundar a caixa do suporte a partir de um unico IP.
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post()
  @ApiOperation({
    summary: 'Envia uma mensagem para o suporte',
    description:
      'O destino e resolvido no servidor a partir de `type`; o remetente nao escolhe o destinatario.',
  })
  @ApiResponse({ status: 201, description: 'Mensagem encaminhada', type: ContactResponseDto })
  @ApiResponse({ status: 400, description: 'Payload invalido' })
  @ApiResponse({ status: 429, description: 'Limite de envios excedido' })
  @ApiResponse({ status: 503, description: 'Envio indisponivel (`contact-not-delivered`)' })
  submit(@Body() payload: ContactRequestDto): Promise<ContactResponseDto> {
    return this.service.submit(payload);
  }
}
