
import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'impactPillar',
    title: 'Pilar Impact',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Judul Pilar',
            type: 'string',
        }),
        defineField({
            name: 'description',
            title: 'Deskripsi',
            type: 'text',
        }),
        defineField({
            name: 'aliases',
            title: 'Aliases for Matching (Financial Data)',
            type: 'array',
            of: [{ type: 'string' }]
        }),
        defineField({
            name: 'icon',
            title: 'Icon Name (Lucide)',
            type: 'string',
        }),
        defineField({
            name: 'statValue',
            title: 'Nilai Statistik (Text)',
            type: 'string',
        }),
        defineField({
            name: 'order',
            title: 'Urutan',
            type: 'number',
        })
    ],
})
