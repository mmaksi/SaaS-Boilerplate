import fs from 'node:fs';
import path from 'node:path';

import { currentUser } from '@clerk/nextjs/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

import { fetchSitemapPages } from '@/actions/extract-sitemap';
import { deleteSitemapByUserId, getDatabaseUser, getSavedDate, getUserWebsites } from '@/libs/database/sitemap-schema';
import { dateFormatter } from '@/libs/DateFormatter';
import { sendMailgunEmail } from '@/services/mailgun'; // to send emails with Mailgun
// import { sendEmail } from '@/services/mailer'; // to send emails with Nodemailer

const dbUser = await getDatabaseUser();
const clerkUser = await currentUser();
if (!clerkUser) {
  throw new Error('User not authenticated');
}

type SitemapData = {
  name: string;
  submissionDate: string;
  pages: string[];
};

export type TrackedSitemapData = {
  name: string;
  trackedDate: string;
  pages: string[];
};

const userEmail = clerkUser!.primaryEmailAddress!.emailAddress;
const userName = clerkUser!.firstName!;

async function sendReport() {
  const urls = await getUserWebsites(dbUser!) as string[];
  const titles = await getTitles(urls);
  const trackedSitemapsArrayFile = path.join(process.cwd(), 'public', 'sitemaps', `${clerkUser!.id}-tracked.json`);
  const trackedUserSitemaps = JSON.parse(fs.readFileSync(trackedSitemapsArrayFile, 'utf8')) as TrackedSitemapData[];
  try {
    // Send the unhashed resetToken via email
    return await sendMailgunEmail(userEmail, userName, trackedUserSitemaps, titles);
  } catch {
    throw new Error('Error sending email');
  }
};

async function getTitles(urls: string[]) {
  const titles = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i] as string;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    // Extract the title after the page loads
    const title = await page.title();
    titles.push(title);
    await browser.close();
  }
  return titles;
}

const analyzeSitemaps = async () => {
  const sitemapsArrayFile = path.join(process.cwd(), 'public', 'sitemaps', `${clerkUser!.id}.json`);
  const userSitemaps = JSON.parse(fs.readFileSync(sitemapsArrayFile, 'utf8')) as SitemapData[];

  // convert userSitemaps pages of every object to a set
  const firstSet = userSitemaps.map((sitemap) => {
    return {
      name: sitemap.name,
      submissionDate: sitemap.submissionDate,
      pages: new Set(sitemap.pages),
    };
  });

  // fetch user webistes from db
  const dbWebsites = await getUserWebsites(clerkUser!.id);

  // fetch sitemap pages for db's websites
  if (dbWebsites) {
    await fetchSitemapPages(dbWebsites, true);
  }

  // convert dbSitemaps pages of every object to a set
  const trackedSitemapsArrayFile = path.join(process.cwd(), 'public', 'sitemaps', `${clerkUser!.id}-tracked.json`);
  const trackedUserSitemaps = JSON.parse(fs.readFileSync(trackedSitemapsArrayFile, 'utf8')) as TrackedSitemapData[];
  const trackedSet = trackedUserSitemaps.map((sitemap) => {
    return {
      name: sitemap.name,
      trackedDate: sitemap.trackedDate,
      pages: new Set(sitemap.pages),
    };
  });

  // compare the pages of every domain between trackedSet and firstSet
  const trackedContentArray = [];
  for (let i = 0; i < firstSet.length; i++) {
    const firstSetData = firstSet[i];
    const trackedSetData = trackedSet[i];

    if (firstSetData && trackedSetData) {
      const newPages = new Set([...firstSetData.pages].filter(page => !trackedSetData.pages.has(page)));
      const trackedContent = {
        name: trackedSetData.name,
        trackedDate: dateFormatter.formatDate(new Date()),
        pages: Array.from(newPages),
      };
      trackedContentArray.push(trackedContent);
    }
  }

  // if there are changes, save the object in a file: ${user.id}-${tracked}.json
  const filePath = path.join(process.cwd(), 'public', 'sitemaps', `${clerkUser!.id}-tracked.json`);
  await fs.promises.writeFile(filePath, JSON.stringify(trackedContentArray));
};

export default async function handler(
  _: NextApiRequest,
  res: NextApiResponse,
) {
  const currentTime = new Date();
  const savedStartDate = await getSavedDate() as Date;
  // const sevenDaysInMillis = 7 * 24 * 60 * 60 * 1000;
  const tenMinutesInMillis = 10 * 60 * 1000;

  if (!clerkUser) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (!dbUser) {
    return res.status(200).json({ message: '' });
  } else {
    // Compare every day for 7 days
    if (currentTime.getTime() - savedStartDate.getTime() < tenMinutesInMillis) {
      await analyzeSitemaps();
      return res.status(200).json({ message: 'Sitemap analyzed' });
    // Send report and delete the user's sitemaps from db
    } else {
      try {
        await sendReport();
        await deleteSitemapByUserId(clerkUser!.id);
        return res.status(200).json({ message: 'Report sent.' });
      } catch (e: unknown) {
        return res.status(200).json({ message: `Error occured while trying to send the report: ${e}.` });
      }
    }
  }
}
