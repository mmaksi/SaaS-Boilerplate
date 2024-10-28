import { currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { sitemapSchema } from '@/models/Schema';

const user = await currentUser();
if (!user) {
  throw new Error('User not authenticated');
}

export async function deleteSitemapByUserId(userId: string) {
  await db.delete(sitemapSchema).where(eq(sitemapSchema.userId, userId));
}

export async function insertSitemap(userId: string, trackedWebsites: string[]) {
  await db.insert(sitemapSchema).values({
    userId,
    trackedWebsites,
  });
}

export async function getUserSitemaps(userId: string) {
  const sitemaps = await db.select().from(sitemapSchema).where(eq(sitemapSchema.userId, userId));
  return sitemaps[0];
}

export async function getUserWebsites(userId: string) {
  const sitemaps = await db.select().from(sitemapSchema).where(eq(sitemapSchema.userId, userId));
  return sitemaps[0]?.trackedWebsites;
}

export async function getDatabaseUser() {
  const data = await db.select().from(sitemapSchema).where(eq(sitemapSchema.userId, user!.id));
  return data[0]?.userId;
}

export async function getSavedDate() {
  const sitemaps = await db
    .select()
    .from(sitemapSchema)
    .where(eq(sitemapSchema.userId, user!.id))
    .limit(1);
  return sitemaps[0]?.createdAt;
}
