import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Apply parsed values (supports .strict() schemas) to block mass assignment
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params !== undefined) Object.assign(req.params, parsed.params);
    if (parsed.query !== undefined) Object.assign(req.query, parsed.query);

    return next();
  } catch (error) {
    return next(error);
  }
};

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    // role_id intentionally omitted from public registration to prevent privilege escalation
  }),
});

export const customerRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    preferred_language: z.enum(['en', 'kn', 'hi']).optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    preferred_language: z.enum(['en', 'kn', 'hi']).optional(),
    profile_image: z.string().nullable().optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export default {
  validate,
  registerSchema,
  customerRegisterSchema,
  updateProfileSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
};
