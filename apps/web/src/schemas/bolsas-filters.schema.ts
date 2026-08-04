import { z } from "zod";

export const bolsasFiltersSchema = z.object({
  course: z.string().optional(),
  college: z.string().optional(),
  city: z.string().optional(),
  modalities: z.array(z.string()).optional(),
});

export type BolsasFiltersFormData = z.infer<typeof bolsasFiltersSchema>;
