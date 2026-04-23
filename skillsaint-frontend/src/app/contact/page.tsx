import ContactClient from "@/components/contact/ContactClient";
import { getGlobalSiteData } from "@/lib/data";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getGlobalSiteData();
  return {
    title: `Contact Us | ${data.hero_badge || "Global Bible Institute"}`,
    description: data.highlights?.footer_description || "Get in touch with our team for support or inquiries.",
  };
}

export default async function ContactPage() {
  const siteData = await getGlobalSiteData();
  
  return (
    <main>
      <ContactClient siteData={siteData} />
    </main>
  );
}

