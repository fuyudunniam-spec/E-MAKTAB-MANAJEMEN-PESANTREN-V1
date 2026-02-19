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

    return (
        <Helmet>
            {siteSettings.title && <title>{siteSettings.title}</title>}
            {siteSettings.description && <meta name="description" content={siteSettings.description} />}
            {siteSettings.description && <meta property="og:description" content={siteSettings.description} />}
            {/* Fallback author if needed, though often static */}
            <meta name="author" content={siteSettings.brand?.title || "Pesantren Al-Bisri"} />
        </Helmet>
    );
};

export default MetaSEO;
