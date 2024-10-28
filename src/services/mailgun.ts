import FormData from 'form-data';
import Mailgun from 'mailgun.js';

import type { TrackedSitemapData } from '@/app/api/cron-job';

const DOMAIN = process.env.MAILGUN_DOMAIN!;
const API_KEY = process.env.MAILGUN_KEY!;

export const sendMailgunEmail = async (userEmail: string, userName: string, reportPages: TrackedSitemapData[], titles: string[]) => {
  const mailgun = new Mailgun(FormData);
  const mg = mailgun.client({
    username: 'api',
    key: API_KEY,
  });

  const emailData = {
    to: 'mmaksi.dev@gmail.com',
    from: 'Sitemap Monitor <services@markmaksi.com>',
    subject: 'Welcome to Our Service',
    html: `
    <div>
        <p>Hello, ${userName}</p>
        <p>Here are this week's newly added pages:</p>
        ${reportPages.map((page, index) => `
          <div>
            <p>Website ${index + 1}: ${page.name}</p>
            <p>
              <ul>
                ${page.pages.map((pageUrl: string) => `
                  <li>${titles[index]}: ${pageUrl}</li>
                `).join('')}
              </ul>
            </p>
          </div>
        `).join('')}
      </div>
      `,
  };

  await mg.messages.create(DOMAIN, emailData);
  console.warn('sent by mailgun');
};
