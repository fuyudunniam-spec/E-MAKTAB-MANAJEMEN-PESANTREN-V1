import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'teamMember',
    title: 'Team Member / Pimpinan',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'role',
            title: 'Role / Position',
            type: 'string',
        }),
        defineField({
            name: 'description',
            title: 'Short Bio',
            type: 'text',
            rows: 3
        }),
        defineField({
            name: 'photo',
            title: 'Photo',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'order',
            title: 'Order',
            type: 'number',
            initialValue: 0
        }),
        defineField({
            name: 'socialLinks',
            title: 'Social Media Links',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'platform', title: 'Platform', type: 'string' },
                        { name: 'url', title: 'URL', type: 'url' }
                    ]
                }
            ]
        }),
        defineField({
            name: 'googleScholarUrl',
            title: 'Google Scholar URL',
            type: 'url'
        }),
        defineField({
            name: 'scopusId',
            title: 'Scopus ID',
            type: 'string'
        })

    ],
    orderings: [
        {
            title: 'Order',
            name: 'orderAsc',
            by: [
                { field: 'order', direction: 'asc' }
            ]
        }
    ]
})
