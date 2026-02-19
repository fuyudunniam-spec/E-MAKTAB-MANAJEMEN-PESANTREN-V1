import React from 'react';
import { Helmet } from 'react-helmet';
import { useQuery } from '@tanstack/react-query';
import { SanityService } from '@/modules/public-website/services/sanity.service';

const MetaSEO = () => {
    const { data: siteSettings } = useQuery({
        queryKey: ['siteSettings'],
        queryFn: SanityService.getSiteSettings,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    if (!siteSettings) return null;

    const logoUrl = siteSettings.logo ? SanityService.imageUrl(siteSettings.logo) : null;

    return (
        <Helmet>
            {siteSettings.title && <title>{siteSettings.title}</title>}
            {siteSettings.description && <meta name="description" content={siteSettings.description} />}
            {siteSettings.description && <meta property="og:description" content={siteSettings.description} />}
            {/* Fallback author if needed, though often static */}
            <meta name="author" content={siteSettings.brand?.title || "Pesantren Al-Bisri"} />

            {/* Dynamic Logo / Favicon */}
            {logoUrl && <link rel="icon" href={logoUrl} />}
            {logoUrl && <link rel="apple-touch-icon" href={logoUrl} />}
            {logoUrl && <meta property="og:image" content={logoUrl} />}
            {logoUrl && <meta name="twitter:image" content={logoUrl} />}
        </Helmet>
    );
};

export default MetaSEO;
