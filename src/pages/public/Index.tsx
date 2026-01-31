import { MainLayout } from "@/components/layout/MainLayout";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { ProgramsSection } from "@/components/sections/ProgramsSection";
import { AnnouncementsSection } from "@/components/sections/AnnouncementsSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { ContactSection } from "@/components/sections/ContactSection";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <MainLayout>
      <Helmet>
        <title>Pesantren An-Nur | Pondok Pesantren Modern Terpercaya</title>
        <meta name="description" content="Pesantren An-Nur adalah pondok pesantren modern yang mengintegrasikan pendidikan Islam tradisional dengan kurikulum akademik kontemporer. Bergabunglah bersama kami." />

        {/* Open Graph */}
        <meta property="og:title" content="Pesantren An-Nur | Pondok Pesantren Modern Terpercaya" />
        <meta property="og:description" content="Pesantren An-Nur adalah pondok pesantren modern yang mengintegrasikan pendidikan Islam tradisional dengan kurikulum akademik kontemporer." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Pesantren An-Nur" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Pesantren An-Nur" />
        <meta name="twitter:description" content="Pondok pesantren modern yang mengintegrasikan pendidikan Islam tradisional dengan kurikulum akademik kontemporer." />

        {/* SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.origin : ''} />
      </Helmet>

      <HeroSection />

      {/* Intro About - Full page at /about */}
      <AboutSection />

      <ProgramsSection />

      {/* Donation CTA */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 fixed-bg" />
        <div className="container-section text-center relative z-10">
          <span className="text-amber-500 font-bold text-xs uppercase tracking-[0.2em] mb-4 block">
            Ladang Pahala
          </span>
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
            Investasi Abadi untuk <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Masa Depan Umat</span>
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Mari bersama-sama membangun peradaban dengan mendukung pendidikan santri yatim dan dhuafa. Harta yang Anda infaqkan tidak akan berkurang, melainkan bertambah keberkahannya.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-full px-8 shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform" asChild>
              <Link to="/donasi">Salurkan Infaq</Link>
            </Button>
          </div>
        </div>
      </section>

      <AnnouncementsSection />
      <TestimonialsSection />
      <GallerySection />
      <ContactSection />

      {/* JSON-LD Structured Data for Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "Pesantren An-Nur",
          "description": "Pondok pesantren modern yang mengintegrasikan pendidikan Islam tradisional dengan kurikulum akademik kontemporer.",
          "@id": typeof window !== 'undefined' ? window.location.origin : '',
          "url": typeof window !== 'undefined' ? window.location.origin : ''
        })}
      </script>
    </MainLayout>
  );
};

export default Index;
