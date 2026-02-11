import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'landingHero',
    title: 'Landing Page Hero',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Hero Title',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'subtitle',
            title: 'Hero Subtitle',
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
            fields: [
                defineField({
                    name: 'alt',
                    type: 'string',
                    title: 'Alternative text',
                })
            ]
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
    ],
})
