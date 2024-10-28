import nodemailer from 'nodemailer';

import type { TrackedSitemapData } from '@/app/api/cron-job';

// Configure email transport
export const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER!,
    pass: process.env.EMAIL_PASS!,
  },
});

export const sendEmail = async (email: string, firstName: string, reportPages: TrackedSitemapData[], titles: string[]) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Sitemap Monitor - Weekly Report',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <p>Hello, ${firstName}</p>
        <p>Here are this week's newly added pages:</p>
        ${reportPages.map((page, index) => `
          <div>
            <h2>Website ${index + 1}: ${page.name}</h2>
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

  return await transporter.sendMail(mailOptions);
};
