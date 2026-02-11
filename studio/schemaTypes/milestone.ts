import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'milestone',
    title: 'Milestone',
    type: 'document',
    fields: [
        defineField({
            name: 'year',
            title: 'Year/Number',
            type: 'string',
            description: 'e.g. "2010" or "1.2k+"'
        }),
        defineField({
            name: 'title',
            title: 'Title/Label',
            type: 'string',
            description: 'e.g. "Berdirinya Al-Bisri" or "Alumni Tersebar"'
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
        }),
        defineField({
            name: 'iconName',
            title: 'Icon Name (if applicable)',
            type: 'string'
        })
    ],
})
