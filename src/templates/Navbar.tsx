import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/buttonVariants';
import { CenteredMenu } from '@/features/landing/CenteredMenu';
import { Section } from '@/features/landing/Section';

import { Logo } from './Logo';

export const Navbar = () => {
  const t = useTranslations('Navbar');

  return (
    <Section className="px-3 py-6">
      <CenteredMenu
        logo={<Logo />}
        rightMenu={(
          <>
            {/* PRO: Dark mode toggle button */}
            <li>
              {/* <LocaleSwitcher /> */}
            </li>
            <li className="ml-1 mr-2.5">
              <Link href="/sign-in">{t('sign_in')}</Link>
            </li>
            <li>
              <Link className={buttonVariants()} href="/sign-up">
                {t('sign_up')}
              </Link>
            </li>
          </>
        )}
      >
        <li>
          <Link href="/#features">{t('features')}</Link>
        </li>

        <li>
          <Link href="/#pricing">{t('pricing')}</Link>
        </li>

        <li>
          <Link href="/#faq">{t('faq')}</Link>
        </li>

        <li>
        <Link href="mailto:contact@sitemapalert.com">{t('contact')}</Link>
        </li>
      </CenteredMenu>
    </Section>
  );
};
