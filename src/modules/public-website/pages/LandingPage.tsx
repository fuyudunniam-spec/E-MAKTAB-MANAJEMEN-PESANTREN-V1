import React, { useEffect } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import PublicHero from '../components/PublicHero';
import PublicPartners from '../components/PublicPartners';
import PublicHistory from '../components/PublicHistory';
import PublicServices from '../components/PublicServices';
import PublicTestimonials from '../components/PublicTestimonials';
import PublicNews from '../components/PublicNews';
import PublicZakatCalc from '../components/PublicZakatCalc';
import PublicFooter from '../components/PublicFooter';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '../services/sanity.service';

const LandingPage: React.FC = () => {
  const { data: sanityData, isLoading } = useQuery({
    queryKey: ['landingPage'],
    queryFn: SanityService.getLandingPageData
  });

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const heroData = sanityData?.hero;

  return (
    <div className="min-h-screen bg-paper royal-pattern font-body selection:bg-gold-200 selection:text-royal-950">
      <PublicNavbar />

      <main>
        <PublicHero data={heroData} />
        <PublicPartners />
        <PublicHistory data={sanityData?.history} />
        <PublicServices data={sanityData?.services} />
        <PublicTestimonials />
        <PublicNews />
        <PublicZakatCalc />
      </main>

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
