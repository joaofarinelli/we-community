import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
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

// Schema para seleção de tipo de espaço
export const spaceTypeSelectionSchema = z.object({
  type: z.enum(['publications', 'events', 'chat', 'course', 'members', 'images']),
});

// Schema para configuração do espaço
export const spaceConfigurationSchema = z.object({
  name: z.string().min(2, 'Nome do espaço deve ter pelo menos 2 caracteres'),
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  visibility: z.enum(['public', 'private', 'secret']),
  enableNotifications: z.boolean(),
  customIconType: z.enum(['default', 'emoji', 'image']).optional().default('default'),
  customIconValue: z.string().optional(),
});

// Schema completo para criação de espaço
export const createSpaceSchema = spaceTypeSelectionSchema.merge(spaceConfigurationSchema);

export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type EmailStepFormData = z.infer<typeof emailStepSchema>;
export type UserDetailsStepFormData = z.infer<typeof userDetailsStepSchema>;
export type TwoStepSignupFormData = z.infer<typeof twoStepSignupSchema>;
export type CompanySignupFormData = z.infer<typeof companySignupSchema>;
export type SpaceTypeSelectionFormData = z.infer<typeof spaceTypeSelectionSchema>;
export type SpaceConfigurationFormData = z.infer<typeof spaceConfigurationSchema>;
export type CreateSpaceFormData = z.infer<typeof createSpaceSchema>;

// Schema para criação de categoria
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Nome da categoria deve ter pelo menos 2 caracteres'),
  slug: z.string().optional(),
  permissions: z.object({
    can_create_spaces: z.boolean(),
    can_manage_members: z.boolean(),
    can_moderate_content: z.boolean(),
    can_view_analytics: z.boolean(),
  }),
});

export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;