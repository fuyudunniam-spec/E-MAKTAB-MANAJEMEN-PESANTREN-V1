import { defineField, defineType } from 'sanity'
import { Home } from 'lucide-react'

export default defineType({
    name: 'homePage',
    title: 'Landing Page (Pusat Kendali)',
    type: 'document',
    icon: Home as any,
    fields: [
        defineField({
            name: 'title',
            title: 'Page Title (SEO)',
            type: 'string',
        }),
        defineField({
            name: 'hero',
            title: 'Hero Slides',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'landingHero' }] }],
            description: 'Order of slides for the main hero section',
        }),
        defineField({
            name: 'services',
            title: 'Our Services / Programs',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'service' }] }],
        })
    ],
    preview: {
        prepare() {
            return {
                title: 'Landing Page Settings',
            }
        }
    }
})
