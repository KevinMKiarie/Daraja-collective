import { z } from 'zod'

export const configSchema = z.object({
  environment: z.enum(['sandbox', 'production']).default('sandbox'),
  consumerKey: z.string().min(1, 'Consumer key is required'),
  consumerSecret: z.string().min(1, 'Consumer secret is required'),
  shortcode: z.string().min(4, 'Shortcode must be at least 4 digits'),
  passkey: z.string().optional(),
  initiatorName: z.string().optional(),
  initiatorPassword: z.string().optional(),
  callbackUrl: z.string().url('Callback URL must be a valid URL').optional(),
  validationUrl: z.string().url('Validation URL must be a valid URL').optional(),
  confirmationUrl: z.string().url('Confirmation URL must be a valid URL').optional(),
})

export type DarajaConfig = z.infer<typeof configSchema>

// Partial config loaded from disk — only validated when a command actually needs a field
export type PartialDarajaConfig = Partial<DarajaConfig>
