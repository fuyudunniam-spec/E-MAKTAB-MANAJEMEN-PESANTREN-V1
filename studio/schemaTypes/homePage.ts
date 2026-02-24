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
            name: 'aboutSummary',
            title: 'Ringkasan Tentang Kami',
            type: 'object',
            fields: [
                { name: 'badge', type: 'string', title: 'Badge' },
                { name: 'title', type: 'string', title: 'Title' },
                { name: 'subtitle', type: 'string', title: 'Subtitle' },
                { name: 'description', type: 'text', title: 'Description' },
                { name: 'ctaText', type: 'string', title: 'CTA Button Text', description: 'e.g. Selami Sejarah Kami' },
                { name: 'ctaLink', type: 'string', title: 'CTA Button Link', description: 'e.g. /tentang-kami' },
                {
                    name: 'stats',
                    title: 'Stats (4 Boxes)',
                    type: 'array',
                    of: [
                        {
                            type: 'object',
                            fields: [
                                { name: 'value', type: 'string', title: 'Value (e.g. 50+)' },
                                { name: 'label', type: 'string', title: 'Label (e.g. Santri)' },
                            ]
                        }
                    ],
                    validation: (rule) => rule.max(4),
                }
            ]
        }),
        defineField({
            name: 'services',
            title: 'Our Services / Programs',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'service' }] }],
        }),
        defineField({
            name: 'partners',
            title: 'Partnerships & Supporters',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'name', type: 'string', title: 'Partner Name' },
                        { name: 'logo', type: 'image', title: 'Logo' },
                        { name: 'url', type: 'url', title: 'Website Link' },
                        { name: 'description', type: 'text', title: 'Description', rows: 2 },
                    ]
                }
            ]
        }),
        defineField({
            name: 'heroImpact',
            title: 'Hero Impact Box (Overlay)',
            type: 'object',
            fields: [
                { name: 'value', type: 'string', title: 'Value (e.g. 100+)' },
                { name: 'label', type: 'string', title: 'Label (e.g. Penerima Manfaat)' },
            ]
        }),
        defineField({
            name: 'testimonials',
            title: 'Testimonials',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'testimonial' }] }],
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
