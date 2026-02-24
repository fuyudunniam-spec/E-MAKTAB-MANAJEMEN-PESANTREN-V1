import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'landingHero',
    title: 'Landing Page Hero',
    type: 'document',
    fields: [
        defineField({
            name: 'badge',
            title: 'Badge (Pill)',
            type: 'string',
        }),
        defineField({
            name: 'subBadge',
            title: 'Sub Badge (Text)',
            type: 'string',
        }),
        defineField({
            name: 'title',
            title: 'Hero Title (Main)',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'titleItalic',
            title: 'Hero Title (Italic/Gold)',
            type: 'string',
        }),
        defineField({
            name: 'subtitle',
            title: 'Description',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'backgroundImage',
            title: 'Background Image 1 (Large)',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'image2',
            title: 'Background Image 2 (Small Top)',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'image3',
            title: 'Background Image 3 (Small Bottom)',
            type: 'image',
            options: { hotspot: true },
        }),
        defineField({
            name: 'externalImageUrl',
            title: 'External Image URL (Fallback 1)',
            type: 'url',
        }),
        defineField({
            name: 'quote',
            title: 'Quote / Hadith',
            type: 'text',
            rows: 2,
        }),
        defineField({
            name: 'quoteAuthor',
            title: 'Quote Author',
            type: 'string',
        }),
        defineField({
            name: 'ctaText',
            title: 'Button Text',
            type: 'string',
        }),
        defineField({
            name: 'ctaLink',
            title: 'Button Link',
            type: 'string',
        }),
        defineField({
            name: 'order',
            title: 'Order',
            type: 'number',
        })
    ],
})
