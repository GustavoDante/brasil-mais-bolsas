import { z } from "zod";

export const searchPanelSchema = z.object({
  category: z.string({
    error: "Por favor, selecione uma categoria de estudo.",
  }),
  course: z.string().optional(),
  college: z.string().optional(),
  city: z.string().optional(),
  modalities: z
    .array(z.string())
    .min(1, { message: "Selecione pelo menos uma modalidade." }),
});

export type SearchPanelFormData = z.infer<typeof searchPanelSchema>;
