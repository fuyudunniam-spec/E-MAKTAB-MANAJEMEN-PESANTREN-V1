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
