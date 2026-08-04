import { z } from 'zod';

import { apiEnvelope } from '../common';
import { NotificationSchema } from '../models';
import { zId, zOptionalBoolean, zText } from '../primitives';

export const CreateNotificationSchema = z
  .object({
    title: zText('Informe o título'),
    message: zText('Informe a mensagem'),
    user_id: zId('Informe o usuário'),
    read: zOptionalBoolean(),
  })
  .strict()
  .meta({ id: 'CreateNotification' });

export const UpdateNotificationSchema = CreateNotificationSchema.partial()
  .strict()
  .meta({ id: 'UpdateNotification' });

export const NotificationResponseSchema = NotificationSchema.meta({ id: 'NotificationResponse' });

export const NotificationEnvelopeSchema = apiEnvelope('notification', NotificationResponseSchema);
export const NotificationListEnvelopeSchema = apiEnvelope(
  'notifications',
  z.array(NotificationResponseSchema),
);

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof UpdateNotificationSchema>;
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
