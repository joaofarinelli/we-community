import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// Schemas para o novo cadastro em 2 etapas
export const emailStepSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const userDetailsStepSchema = z.object({
  fullName: z.string().min(2, 'Nome completo é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const twoStepSignupSchema = z.object({
  email: z.string().email('Email inválido'),
  fullName: z.string().min(2, 'Nome completo é obrigatório'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

// Schema original para compatibilidade
export const companySignupSchema = z.object({
  // Dados da empresa
  companyName: z.string().min(2, 'Nome da empresa é obrigatório'),
  cnpj: z.string().optional(),
  companyPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  
  // Dados do usuário proprietário
  firstName: z.string().min(2, 'Nome é obrigatório'),
  lastName: z.string().min(2, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  userPhone: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type EmailStepFormData = z.infer<typeof emailStepSchema>;
export type UserDetailsStepFormData = z.infer<typeof userDetailsStepSchema>;
export type TwoStepSignupFormData = z.infer<typeof twoStepSignupSchema>;
export type CompanySignupFormData = z.infer<typeof companySignupSchema>;