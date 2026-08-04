import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
});

export type NewsletterFormData = z.infer<typeof newsletterSchema>;
