import type { Metadata } from "next";
import "./globals.css";
import { siteName, siteUrl } from "@/utils/envExport";
import { Inter_Tight } from "next/font/google";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getMoodleSiteData, getGlobalSiteData } from "@/lib/data";
import ConditionalWrapper from "@/components/ConditionalWrapper";
import ToasterProvider from "@/components/ToasterProvider";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Global Bible Institute",
  description: "A House Where Leaders Are Formed in Scripture, Holiness, and the Power of God!",
  keywords: ["Global Bible Institute", "Bible Study", "Spiritual Growth", "IBI"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "IBI",
  },
  formatDetection: {
    telephone: false,
  },

  openGraph: {
    title: `${siteName}`,
    description: `${siteName} Online Learning Platform. Create your own online courses and sell them to the world.`,
    type: "website",
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Global Bible Institute",
      },
    ],
  },

  twitter: {
    title: `${siteName}`,
    description: `${siteName} Online Learning Platform. Create your own online courses and sell them to the world.`,
    card: "summary_large_image",
    images: [
      {
        url: `${siteUrl}/images/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Global Bible Institute",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch dynamic footer data
  const [siteData, globalData] = await Promise.all([
    getMoodleSiteData(),
    getGlobalSiteData()
  ]);

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${interTight.variable} antialiased`}
      >
        <ConditionalWrapper type="header">
          <Header />
        </ConditionalWrapper>
        {children}
        <ConditionalWrapper type="footer">
          <Footer 
            siteName={siteData.sitename} 
            description={globalData.highlights.footer_description} 
          />
        </ConditionalWrapper>
        <SpeedInsights />
        <ToasterProvider />
      </body>
    </html>
  );
}
