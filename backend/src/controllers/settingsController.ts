import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';

const settingsSchema = z.object({
  nvidiaApiKey: z.string().optional(),
  defaultWordCount: z.number().int().min(300).max(10000).optional(),
  defaultCountry: z.string().optional(),
  defaultAudience: z.string().optional(),
});

export async function getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await prisma.settings.findMany();
    const map: Record<string, string> = {};
    for (const s of settings) {
      if (s.key === 'nvidiaApiKey') {
        map[s.key] = s.value ? '••••••••' + s.value.slice(-4) : '';
      } else {
        map[s.key] = s.value;
      }
    }
    res.json({ data: map });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = settingsSchema.parse(req.body);

    const updates: Array<{ key: string; value: string }> = [];

    if (body.nvidiaApiKey?.trim()) {
      updates.push({ key: 'nvidiaApiKey', value: body.nvidiaApiKey.trim() });
      // Also set as env var for current process so the AI service can pick it up immediately
      process.env['NVIDIA_API_KEY'] = body.nvidiaApiKey.trim();
    }
    if (body.defaultWordCount !== undefined) {
      updates.push({ key: 'defaultWordCount', value: String(body.defaultWordCount) });
    }
    if (body.defaultCountry !== undefined) {
      updates.push({ key: 'defaultCountry', value: body.defaultCountry });
    }
    if (body.defaultAudience !== undefined) {
      updates.push({ key: 'defaultAudience', value: body.defaultAudience });
    }

    await Promise.all(
      updates.map((u) =>
        prisma.settings.upsert({
          where: { key: u.key },
          create: u,
          update: { value: u.value },
        })
      )
    );

    res.json({ data: { message: 'Settings updated' } });
  } catch (err) {
    next(err);
  }
}
