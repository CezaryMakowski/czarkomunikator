import { z } from "zod";

// Schema dla wiadomości
export const messageSchema = z.object({
  id: z.string(),
  body: z.string().nullable(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
  clientSideId: z.string().nullable(),
  conversationId: z.string(),
  senderId: z.string(),
  senderName: z.string().optional().default("Unknown user"),
  seen: z.boolean(),
});

// Typ wywnioskowany z schema
export type Message = z.infer<typeof messageSchema>;

// Schema dla wysyłania wiadomości (bez pól generowanych przez serwer)
export const sendMessageSchema = z.object({
  body: z.string().optional(),
  image: z.string().optional(),
  conversationId: z.string(),
  clientSideId: z.string().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// Schema dla formularza rejestracji
export const registryFormSchema = z
  .object({
    name: z.string().min(1, "to pole jest wymagane"),
    email: z.email().min(1, "email jest wymagany"),
    password: z.string().min(7, "hasło za krótkie (min 7 znaków)"),
    confirmPassword: z.string().min(1, "powtórz hsło"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "podane hasła nie są takie same",
    path: ["confirmPassword"],
  });

export type RegistryFormInput = z.infer<typeof registryFormSchema>;
