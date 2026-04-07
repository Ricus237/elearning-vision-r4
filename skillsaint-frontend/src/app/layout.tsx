import type { Metadata } from "next";

import "./globals.css";
import { siteName, siteUrl } from "@/utils/envExport";
import { Inter, Inter_Tight, Mulish } from "next/font/google";
import Header from "@/components/header";
import Footer from "@/components/footer";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});
const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "International Bible Institute",
  description: "A House Where Leaders Are Formed in Scripture, Holiness, and the Power of God!",
  keywords: ["International Bible Institute", "Bible Study", "Spiritual Growth", "IBI"],
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
        alt: "International Bible Institute",
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
        alt: "International Bible Institute",
      },
    ],
  },
};

import ConditionalWrapper from "@/components/ConditionalWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${interTight.variable} ${mulish.variable} ${inter.variable} antialiased`}
      >
        <ConditionalWrapper>
          <Header/>
        </ConditionalWrapper>
        {children}
        <ConditionalWrapper>
          <Footer/>
        </ConditionalWrapper>
      </body>
    </html>
  );
}
