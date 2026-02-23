import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '@/modules/public-website/services/sanity.service';

const MetaSEO = () => {
    const { data: siteSettings } = useQuery({
        queryKey: ['siteSettings'],
        queryFn: SanityService.getSiteSettings,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (!siteSettings) return null;

    const logoUrl = siteSettings.logo ? SanityService.imageUrl(siteSettings.logo) : null;
    const title = siteSettings.title || "Al-Bisri - Pusat Pendidikan & Kemandirian";
    const description = siteSettings.description || "Lembaga pendidikan Islam terpadu yang melahirkan generasi mandiri, berakhlak mulia, dan berwawasan luas.";

    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            {logoUrl && <meta property="og:image" content={logoUrl} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            {logoUrl && <meta name="twitter:image" content={logoUrl} />}

            <meta name="author" content={siteSettings.brand?.title || "Al-Bisri"} />

            {/* Dynamic Favicons */}
            {logoUrl && <link rel="icon" href={logoUrl} />}
            {logoUrl && <link rel="apple-touch-icon" href={logoUrl} />}
        </Helmet>
    );
};

export default MetaSEO;
