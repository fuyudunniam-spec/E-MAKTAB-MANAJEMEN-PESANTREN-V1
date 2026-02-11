import { client } from '@/lib/sanity/client'
import { LANDING_PAGE_QUERY, NEWS_QUERY, ABOUT_PAGE_QUERY, DONATION_PAGE_QUERY } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'

export interface SanityImage {
    _type: 'image';
    asset: {
        _ref: string;
        _type: 'reference';
    };
}

export const SanityService = {
    getLandingPageData: async () => {
        return await client.fetch(LANDING_PAGE_QUERY)
    },

    getNews: async () => {
        return await client.fetch(NEWS_QUERY)
    },

    getAboutPageData: async () => {
        return await client.fetch(ABOUT_PAGE_QUERY)
    },

    getDonationPageData: async () => {
        return await client.fetch(DONATION_PAGE_QUERY)
    },

    imageUrl: (source: SanityImage) => {
        return urlFor(source).url()
    }
}
