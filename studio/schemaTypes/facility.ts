import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'facility',
    title: 'Facility',
    type: 'document',
    fields: [
        defineField({
            name: 'name',
            title: 'Facility Name',
            type: 'string',
            validation: (rule) => rule.required(),
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'string',
        }),
        defineField({
            name: 'image',
            title: 'Image',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
    ],
})
