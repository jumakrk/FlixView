import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email(),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dots, and hyphens'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export const progressSchema = z.object({
    mediaId: z.string(),
    mediaType: z.enum(['movie', 'tv']),
    progressData: z.record(z.any()), // JSON object
    mediaData: z.record(z.any()), // JSON object
});

export const listSchema = z.object({
    mediaId: z.union([z.string(), z.number()]), // Client sends number sometimes, converted to string? Let's check api.ts
    mediaType: z.string().refine((val) => val === 'movie' || val === 'tv'),
    listType: z.enum(['watchlist', 'favorites']),
    title: z.string().optional(), // title/poster might be optional if deleting?
    posterPath: z.string().nullable().optional(),
});

export const updateUserSchema = z.object({
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dots, and hyphens').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    profilePicture: z.string().nullable().optional(), // Base64 data URL or null to remove
});
