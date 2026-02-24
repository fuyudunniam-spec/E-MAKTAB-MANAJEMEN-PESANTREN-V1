import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'news',
    title: 'News / Article',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96,
            },
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'publishedAt',
            title: 'Published at',
            type: 'datetime',
            initialValue: (new Date()).toISOString(),
        }),
        defineField({
            name: 'excerpt',
            title: 'Excerpt',
            type: 'text',
            rows: 3,
        }),
        defineField({
            name: 'mainImage',
            title: 'Main image',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'body',
            title: 'Body',
            type: 'array',
            of: [{ type: 'block' }, { type: 'image' }],
        }),
        defineField({
            name: 'justify',
            title: 'Justify Text',
            type: 'boolean',
            description: 'Align article text to justify',
            initialValue: true,
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'reference',
            to: [{ type: 'category' }],
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'author',
            title: 'Author',
            type: 'reference',
            to: [{ type: 'teamMember' }],
            validation: (rule) => rule.required(),
        }),
        // SEO Fields
        defineField({
            name: 'metaDescription',
            title: 'Meta Description',
            type: 'text',
            rows: 3,
            description: 'SEO meta description (optimal: 150-160 characters)',
            validation: (rule) => rule.max(160).warning('Meta description should be under 160 characters')
        }),
        defineField({
            name: 'metaKeywords',
            title: 'Meta Keywords',
            type: 'array',
            of: [{ type: 'string' }],
            description: 'SEO keywords for this article',
            options: {
                layout: 'tags'
            }
        }),
        defineField({
            name: 'ogImage',
            title: 'Open Graph Image',
            type: 'image',
            description: 'Optional custom image for social media sharing (if different from main image)',
            options: {
                hotspot: true
            }
        })

    ],
})
