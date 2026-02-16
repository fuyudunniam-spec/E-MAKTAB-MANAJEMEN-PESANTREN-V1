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
            title: 'Background Image',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'externalImageUrl',
            title: 'External Image URL (Unsplash)',
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
            name: 'ctaStyle',
            title: 'Button Style',
            type: 'string',
            options: {
                list: [
                    { title: 'White (Outline/Solid)', value: 'bg-white text-navy-950' },
                    { title: 'Gold (Solid)', value: 'bg-accent-gold text-navy-950' },
                ]
            }
        }),
        defineField({
            name: 'order',
            title: 'Order',
            type: 'number',
        })
    ],
})
