import { z } from 'zod';

/** Schema de login — email + senha */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'E-mail obrigatório' })
    .email({ message: 'E-mail inválido' })
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Senha obrigatória' })
    .min(6, { message: 'Mínimo 6 caracteres' }),
});

/** Schema de cadastro — acrescenta nome e confirmação de senha */
export const registerSchema = loginSchema
  .extend({
    nome: z
      .string({ required_error: 'Nome obrigatório' })
      .min(2, { message: 'Mínimo 2 caracteres' })
      .max(80, { message: 'Máximo 80 caracteres' })
      .trim(),
    passwordConfirm: z.string({ required_error: 'Confirme a senha' }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    path: ['passwordConfirm'],
    message: 'As senhas não coincidem',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
