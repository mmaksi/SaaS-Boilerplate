import console from 'node:console';

// XML Parser as a singleton
import Sitemapper from 'sitemapper';

import { dateFormatter } from '../libs/DateFormatter';

type SitemapData = {
  name: string;
  submissionDate: string;
  pages: string[];
};

export class SitemapParser {
  private sitemapData: SitemapData;

  constructor(private url: string) {
    this.sitemapData = {
      name: this.domain,
      submissionDate: dateFormatter.getCurrentDate(),
      pages: [],
    };
  }

  private get domain() {
    return new URL(this.url).hostname;
  }

  /**
   * Differentiates between different types of sitemap URLs coming from robots.txt.
   *
   * URLs might be sitemap.xml, sitemap.xml.gz or sitemap-index.xml
   */
  async extractSitemapPages(sitemapUrls: any[]) {
    for (const url of sitemapUrls) {
      if (url.endsWith('gz')) {
        this.sitemapData.pages.push(`The sitemap is too large. Please contact the support team.`);
      }

      // If the sitemapUrl leads to other XML URLs
      if (url.endsWith('xml')) {
        const sitemapper = new Sitemapper({
          url,
          timeout: 15000, // 15 seconds
        });

        const { sites } = await sitemapper.fetch();

        if (!sites[0]?.endsWith('xml')) {
          const url = new URL(sites[0]!);
          const domainName = url.hostname;
          const submissionDate = dateFormatter.getCurrentDate();
          this.sitemapData = {
            name: domainName,
            submissionDate,
            pages: sites,
          };
        }
        sitemapUrls.push(...sites);
      }
    }
    return this.sitemapData;
  }

  /**
   * Returns all the sitemap URLs found in the robots.txt file no matter how deep they are.
   *
   * URLs might be sitemap.xml, sitemap.xml.gz or sitemap-index.xml
   */
  async extractRobotsSitemaps(): Promise<string[]> {
    const sitemapUrls: string[] = [];
    try {
      const response = await fetch(`https://${this.domain}/robots.txt`);
      const robotsTxt = await response.text();
      const lines = robotsTxt.split(/\r?\n/);
      for (const line of lines) {
        if (line.startsWith('Sitemap:') || (line.startsWith('http:') && line.endsWith('.xml'))) {
          const sitemapUrl = line.split(': ')[1]?.trim();
          if (sitemapUrl) {
            sitemapUrls.push(sitemapUrl);
          }
        }
      }
    } catch (error) {
      console.error(`Error extracting sitemap URLs for ${this.domain}:`, error);
    }
    return sitemapUrls;
  }
}
