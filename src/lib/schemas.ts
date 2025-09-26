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

// Event schemas
export const eventSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  presenter: z.string().optional(),
  startDate: z.date(),
  startTime: z.string(),
  endDate: z.date(),
  endTime: z.string(),
  locationType: z.enum(['presencial', 'online', 'indefinido']),
  address: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  onlineLink: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().optional(),
  isPaid: z.boolean().default(false),
  priceCoins: z.number().int().min(0, "Preço deve ser um número positivo").optional(),
  paymentRequired: z.boolean().default(false),
  paymentType: z.enum(['free', 'coins', 'external']).default('free'),
  externalPaymentUrl: z.string().url().optional().or(z.literal('')),
  paymentApprovalRequired: z.boolean().default(false),
}).refine((data) => {
  const startDateTime = new Date(`${data.startDate.toDateString()} ${data.startTime}`);
  const endDateTime = new Date(`${data.endDate.toDateString()} ${data.endTime}`);
  return endDateTime > startDateTime;
}, {
  message: "Data e hora de fim devem ser posteriores à data e hora de início",
  path: ["endTime"],
}).refine((data) => {
  if (data.locationType === 'presencial') {
    const hasRequiredFields = data.address && data.neighborhood && data.city && data.state && data.postalCode;
    return hasRequiredFields;
  }
  return true;
}, {
  message: "Endereço completo é obrigatório para eventos presenciais",
  path: ["address"],
}).refine((data) => {
  if (data.locationType === 'online') {
    return data.onlineLink && data.onlineLink.length > 0;
  }
  return true;
}, {
  message: "Link da reunião é obrigatório para eventos online",
  path: ["onlineLink"],
}).refine((data) => {
  if (data.isPaid || data.paymentType !== 'free') {
    if (data.paymentType === 'coins') {
      return data.priceCoins && data.priceCoins > 0;
    }
  }
  return true;
}, {
  message: "Preço em moedas é obrigatório para eventos pagos com moedas",
  path: ["priceCoins"],
}).refine((data) => {
  if (data.paymentType === 'external') {
    return data.externalPaymentUrl && data.externalPaymentUrl.length > 0;
  }
  return true;
}, {
  message: "URL de pagamento externo é obrigatória para eventos com pagamento externo",
  path: ["externalPaymentUrl"],
});

export type EventFormData = z.infer<typeof eventSchema>;