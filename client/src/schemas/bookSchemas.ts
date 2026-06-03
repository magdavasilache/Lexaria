import { z } from "zod";

export const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author_id: z.number().optional(),
  language_id: z.number().optional(),
  country_id: z.number().optional(),
  genre_ids: z.array(z.number()).optional(),
  pages: z.coerce.number().int().nonnegative().optional(),
  published_at: z.string().optional(),
  synopsis: z.string().optional(),
  settings: z.string().optional(),  
  characters: z.string().optional(),
  image_front: z.instanceof(File).nullable().optional(),
  image_back: z.instanceof(File).nullable().optional(),
  image_page: z.instanceof(File).nullable().optional(),
});


export type BookFormValues = z.infer<typeof bookFormSchema>;