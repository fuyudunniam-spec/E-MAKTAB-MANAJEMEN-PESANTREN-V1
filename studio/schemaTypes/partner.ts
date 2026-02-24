import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'partner',
    title: 'Partner / Client',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Partner Name',
            type: 'string',
        }),
        defineField({
            name: 'logo',
            title: 'Logo',
            type: 'image',
        }),
        defineField({
            name: 'url',
            title: 'Website URL',
            type: 'url',
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 2,
        }),
    ],
})
