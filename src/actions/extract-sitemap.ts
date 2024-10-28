'use server';

import fs from 'node:fs';
import path from 'node:path';

import { currentUser } from '@clerk/nextjs/server';

import { deleteSitemapByUserId, getUserSitemaps, insertSitemap } from '@/libs/database/sitemap-schema';
import { dateFormatter } from '@/libs/DateFormatter';
import { SitemapParser } from '@/services/XMLParser';

type FormData = {
  urls: string[];
};

type TrackedSitemapData = {
  name: string;
  submissionDate: string;
  trackedDate: string;
  pages: string[];
};

const user = await currentUser();
if (!user) {
  throw new Error('User not authenticated');
}

export const fetchSitemapPages = async (urls: string[], tracked: boolean) => {
  const sitemapDataArray = [];
  for (const url of urls) {
    try {
      const sitemapParser = new SitemapParser(url); // a parser for every website
      const sitemapUrls = await sitemapParser.extractRobotsSitemaps(); // from robots.txt
      const sitemapData = await sitemapParser.extractSitemapPages(sitemapUrls);

      if (tracked) {
        const trackedContent = { ...sitemapData, trackedDate: dateFormatter.formatDate(new Date()) } as TrackedSitemapData;
        sitemapDataArray.push(trackedContent);
      } else {
        sitemapDataArray.push(sitemapData);
      }

      const userId = user!.id;
      const fileName = `${userId}`;
      const filePath = path.join(process.cwd(), 'public', 'sitemaps', tracked ? `${fileName}-tracked.json` : `${fileName}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(sitemapDataArray));
    } catch (error) {
      await deleteSitemapByUserId(user!.id);
      console.error(`Error processing ${url}:`, error);
      return `An error occurred while processing the sitemaps. Please try again.`;
    }
  }
  return `Thank you! You will get a report by email on ${dateFormatter.getReportDate()}.`;
};

export async function handleSubmit(formData: FormData) {
  try {
    // await deleteSitemapByUserId(user!.id); // TODO comment this line in production
    if (await getUserSitemaps(user!.id)) {
      return 'Sorry you have already requested a report.';
    }

    const urls = formData.urls;
    if (!await getUserSitemaps(user!.id)) {
      await insertSitemap(user!.id, urls);
    }

    return await fetchSitemapPages(urls, false);
  } catch (error) {
    console.error('Error in handleSubmit:', error);
    return 'An error occurred. Please try again later.';
  }
}
