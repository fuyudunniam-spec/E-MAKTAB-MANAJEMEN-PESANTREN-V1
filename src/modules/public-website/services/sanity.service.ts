import { client } from '@/lib/sanity/client'
import { LANDING_PAGE_QUERY, NEWS_QUERY, ABOUT_PAGE_QUERY, DONATION_PAGE_QUERY, PSB_PAGE_QUERY, SITE_SETTINGS_QUERY } from '@/lib/sanity/queries'
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

    getNewsDetail: async (slug: string) => {
        const query = `*[_type == "news" && slug.current == $slug][0]{
            title,
            mainImage,
            publishedAt,
            excerpt,
            "author": author->{
                name, 
                role, 
                photo, 
                description,
                socialLinks
            },
            "category": category->title,
            "content": body,
            "readingTime": round(length(pt::text(body)) / 5 / 180 + 1) + " Menit Baca",
            metaKeywords,
            ogImage,
            "relatedPosts": *[_type == "news" && slug.current != $slug] | order(publishedAt desc)[0...3]{
                title,
                publishedAt,
                "slug": slug.current,
                mainImage,
                "category": category->title
            }
        }`;
        return await client.fetch(query, { slug })
    },

    getAboutPageData: async () => {
        return await client.fetch(ABOUT_PAGE_QUERY)
    },

    getDonationPageData: async () => {
        return await client.fetch(DONATION_PAGE_QUERY)
    },

    getPsbPageData: async () => {
        return await client.fetch(PSB_PAGE_QUERY)
    },

    getSiteSettings: async () => {
        return await client.fetch(SITE_SETTINGS_QUERY)
    },

    imageUrl: (source: SanityImage) => {
        return urlFor(source).url()
    }
}
