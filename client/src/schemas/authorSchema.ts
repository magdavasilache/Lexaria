import z from "zod";

export const authorFormSchema = z.object({
    first_name: z.string().min(1, "Author's first name is required!"),
    last_name: z.string().nullable().optional(),
    image: z.instanceof(File).nullable().optional(),
    birthdate: z.string().nullable().optional(),
    country_id: z.number({
        required_error: "Country is required!",
        invalid_type_error: "Country must be a number!"
    }),
    about: z.string().nullable().optional()
});

export type AuthorFormValues = z.infer<typeof authorFormSchema>;