import { z } from 'zod'

// ─── Shared primitives ──────────────────────────────────────────────

/** Accepts "user@domain.com" or RFC 5321 display-name format "Name <user@domain.com>" */
const emailOrAddressField = z
  .string()
  .min(1)
  .max(320)
  .refine(
    (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ||
      /<[^\s@]+@[^\s@]+\.[^\s@]{2,}>/.test(v),
    { message: 'Invalid email address or RFC 5321 address format' }
  )

// ─── Schemas ────────────────────────────────────────────────────────

/** /api/email/inbound — sent by Cloudflare Worker */
export const inboundEmailSchema = z.object({
  to: emailOrAddressField,
  from: emailOrAddressField,
  subject: z.string().min(1).max(998), // RFC 5321 line limit
  body: z.string().max(100_000).optional().default(''), // 100 KB cap
})

/** /api/calendar/add */
export const calendarAddSchema = z.object({
  title: z.string().min(1).max(500).trim(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}/, 'Date must start with YYYY-MM-DD')
    .max(50),
  type: z.string().min(1).max(50).trim(),
})

/** /api/company-info?name= */
export const companyInfoSchema = z.object({
  name: z.string().min(1).max(200).trim(),
})

// ─── Helper ─────────────────────────────────────────────────────────

/**
 * Returns `{ ok: true, data }` on success, or a 400 NextResponse on failure.
 * Usage:
 *   const result = parseBody(inboundEmailSchema, rawBody)
 *   if (!result.ok) return result.response
 *   const { to, from } = result.data
 */
export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  input: unknown
): { ok: true; data: z.infer<T> } | { ok: false; response: Response } {
  const parsed = schema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(', ')
    return {
      ok: false,
      response: Response.json({ error: 'Validation failed', details: message }, { status: 400 }),
    }
  }
  return { ok: true, data: parsed.data }
}
