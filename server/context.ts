import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import jwt from 'jsonwebtoken';
import { getDb } from './db';
import { users } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export const createContext = async ({ req, res }: CreateExpressContextOptions) => {
  const token = req.cookies.token;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
      const db = await getDb() as any;
      if (!db) return { req, res, user: null };

      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId),
      });

      return { req, res, user: user || null };
    } catch (err) {
      // Invalid token
    }
  }

  return { req, res, user: null };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
