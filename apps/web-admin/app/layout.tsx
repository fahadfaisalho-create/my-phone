import type { Metadata } from 'next';
import { Cairo, IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { LocaleProvider } from '@/lib/i18n';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'لوحة تحكم الإدارة — My Phone',
  description: 'مراجعة طلبات تسجيل المحلات وإدارة الاشتراكات',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${ibmPlexArabic.variable}`}>
      <head>
        {/* يقرأ لغة المستخدم المحفوظة قبل أول رسم لتفادي وميض اتجاه خاطئ */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem('admin_locale');if(l==='en'){document.documentElement.lang='en';document.documentElement.dir='ltr';}}catch(e){}`,
          }}
        />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
