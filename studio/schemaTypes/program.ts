import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'donationProgram',
    title: 'Donation Program',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Program Title',
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
        }),
        defineField({
            name: 'description',
            title: 'Description',
            type: 'text',
        }),
        defineField({
            name: 'image',
            title: 'Program Image',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'iconName',
            title: 'Icon Name (Lucide React)',
            type: 'string',
            description: 'e.g., GraduationCap, BookOpen, Building2'
        }),
        defineField({
            name: 'targetAmount',
            title: 'Target Amount (Text/Number)',
            type: 'string',
            description: 'e.g. "Rp 5 M" or "200 Santri"'
        }),
        defineField({
            name: 'currentAmount',
            title: 'Current Amount (Text/Number)',
            type: 'string',
            description: 'e.g. "Rp 1.5 M" or "150 Santri"'
        }),
        defineField({
            name: 'progressPercentage',
            title: 'Progress Percentage',
            type: 'number',
            validation: (rule) => rule.min(0).max(100),
        }),
    ],
})
