import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt } from 'hono/jwt';
import { hash, compare } from 'bcryptjs';
import { zValidator } from '@hono/zod-validator';
import { registerSchema, loginSchema, progressSchema, listSchema, updateUserSchema } from './validators';

type Bindings = {
    DB: D1Database;
    JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Simple In-Memory Rate Limiter (Per Worker Instance)
// Note: In a distributed environment like Cloudflare, this is per-isolate.
// For strict global rate limiting, use Cloudflare Rate Limiting feature or KV/Durable Objects.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // 100 requests per minute per IP

const rateLimiter = async (c: any, next: any) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const now = Date.now();

    let record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        record = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
        rateLimitMap.set(ip, record);
    }

    if (record.count >= MAX_REQUESTS) {
        return c.json({ error: 'Too many requests' }, 429);
    }

    record.count++;
    await next();
};

// Enable CORS
app.use('/*', cors());

// Apply Rate Limiter globally
app.use('/*', rateLimiter);

// JWT Middleware for protected routes
app.use('/api/*', async (c, next) => {
    const jwtMiddleware = jwt({
        secret: c.env.JWT_SECRET || 'flixview-secret-key-change-me',
    });
    return jwtMiddleware(c, next);
});

// --- Auth Routes ---

// --- Auth Routes ---

app.post('/auth/register', zValidator('json', registerSchema), async (c) => {
    const { email, username, password } = c.req.valid('json');

    const passwordHash = await hash(password, 10);
    const userId = crypto.randomUUID();

    try {
        const { success } = await c.env.DB.prepare(
            'INSERT INTO users (id, email, username, password_hash) VALUES (?, ?, ?, ?)'
        ).bind(userId, email, username, passwordHash).run();

        if (success) {
            return c.json({ message: 'User created', userId });
        } else {
            return c.json({ error: 'Failed to create user' }, 500);
        }
    } catch (e: any) {
        if (e.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'Email or Username already exists' }, 409);
        }
        return c.json({ error: e.message }, 500);
    }
});

app.post('/auth/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const secret = c.env.JWT_SECRET || 'flixview-secret-key-change-me';

    const user = await c.env.DB.prepare(
        'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const valid = await compare(password, user.password_hash as string);
    if (!valid) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate JWT
    // @ts-ignore
    const token = await import('hono/jwt').then(m => m.sign({
        id: user.id,
        email: user.email,
        username: user.username,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 days
    }, secret));

    return c.json({ token, user: { id: user.id, email: user.email, username: user.username, profilePicture: user.profile_picture_url } });
});

// --- Protected Routes ---

// Update User Profile
app.put('/api/user', zValidator('json', updateUserSchema.extend({ profilePicture: updateUserSchema.shape.profilePicture.optional() })), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.id;
    const { username, password, profilePicture } = c.req.valid('json');

    if (!username && !password && profilePicture === undefined) {
        return c.json({ error: 'No changes provided' }, 400);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (username) {
        updates.push('username = ?');
        values.push(username);
    }

    if (password) {
        const passwordHash = await hash(password, 10);
        updates.push('password_hash = ?');
        values.push(passwordHash);
    }

    if (profilePicture !== undefined) {
        updates.push('profile_picture_url = ?');
        values.push(profilePicture);
    }

    values.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    try {
        await c.env.DB.prepare(query).bind(...values).run();
        const user = await c.env.DB.prepare('SELECT id, email, username, profile_picture_url as profilePicture FROM users WHERE id = ?').bind(userId).first();
        return c.json({ user });

    } catch (e: any) {
        if (e.message.includes('UNIQUE constraint failed')) {
            return c.json({ error: 'Username already taken' }, 409);
        }
        return c.json({ error: e.message }, 500);
    }
});

// Get all user data (Sync)
app.get('/api/sync', async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.id;

    // Fetch and parse JSON fields
    const { results: progressRaw } = await c.env.DB.prepare(
        'SELECT * FROM progress_records WHERE user_id = ?'
    ).bind(userId).all();

    const { results: watchlistRaw } = await c.env.DB.prepare(
        'SELECT * FROM watchlist_items WHERE user_id = ?'
    ).bind(userId).all();

    const { results: favoritesRaw } = await c.env.DB.prepare(
        'SELECT * FROM favorite_items WHERE user_id = ?'
    ).bind(userId).all();

    // Helper to parse JSON columns
    const parseItems = (items: any[]) => items.map(item => ({
        ...item,
        progress_data: item.progress_data ? JSON.parse(item.progress_data as string) : null,
        media_data: item.media_data ? JSON.parse(item.media_data as string) : null
    }));

    return c.json({
        progress: parseItems(progressRaw),
        watchlist: parseItems(watchlistRaw),
        favorites: parseItems(favoritesRaw)
    });
});

// Upsert Watch Progress
app.post('/api/progress', zValidator('json', progressSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.id;
    const { mediaId, mediaType, progressData, mediaData } = c.req.valid('json');

    // Stringify JSON blobs
    // Client sends complete merged state, so we just overwrite/update.
    const progressJson = JSON.stringify(progressData);
    const mediaJson = JSON.stringify(mediaData);

    const existing = await c.env.DB.prepare(
        'SELECT id FROM progress_records WHERE user_id = ? AND media_id = ? AND media_type = ?'
    ).bind(userId, mediaId, mediaType).first();

    if (existing) {
        await c.env.DB.prepare(
            'UPDATE progress_records SET progress_data = ?, media_data = ?, updated_at = datetime(\'now\') WHERE id = ?'
        ).bind(progressJson, mediaJson, existing.id).run();
    } else {
        await c.env.DB.prepare(
            'INSERT INTO progress_records (user_id, media_id, media_type, progress_data, media_data) VALUES (?, ?, ?, ?, ?)'
        ).bind(userId, mediaId, mediaType, progressJson, mediaJson).run();
    }

    return c.json({ success: true });
});

// Manage Lists (Watchlist/Favorites)
app.post('/api/list', zValidator('json', listSchema), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.id;
    const { mediaId, mediaType, listType, title, posterPath } = c.req.valid('json');

    let table = listType === 'watchlist' ? 'watchlist_items' : 'favorite_items';
    const mediaData = JSON.stringify({ title, posterPath });

    const existing = await c.env.DB.prepare(
        `SELECT id FROM ${table} WHERE user_id = ? AND media_id = ? AND media_type = ?`
    ).bind(userId, mediaId, mediaType).first();

    if (!existing) {
        await c.env.DB.prepare(
            `INSERT INTO ${table} (user_id, media_id, media_type, media_data) VALUES (?, ?, ?, ?)`
        ).bind(userId, mediaId, mediaType, mediaData).run();
    }

    return c.json({ success: true });
});

app.delete('/api/list', zValidator('json', listSchema.pick({ mediaId: true, mediaType: true, listType: true })), async (c) => {
    const payload = c.get('jwtPayload');
    const userId = payload.id;
    const { mediaId, mediaType, listType } = c.req.valid('json');

    let table = listType === 'watchlist' ? 'watchlist_items' : 'favorite_items';

    await c.env.DB.prepare(
        `DELETE FROM ${table} WHERE user_id = ? AND media_id = ? AND media_type = ?`
    ).bind(userId, mediaId, mediaType).run();

    return c.json({ success: true });
});

export default app;
