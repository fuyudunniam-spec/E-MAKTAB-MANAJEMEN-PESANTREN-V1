
import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'service',
    title: 'Layanan',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Judul Layanan',
            type: 'string',
        }),
        defineField({
            name: 'description',
            title: 'Deskripsi',
            type: 'text',
        }),
        defineField({
            name: 'icon',
            title: 'Icon Name (Lucide)',
            type: 'string',
            description: 'Nama icon dari Lucide React (e.g. GraduationCap, Home, etc.)'
        }),
        defineField({
            name: 'impactText',
            title: 'Impact Text (Pill)',
            type: 'string',
        }),
        defineField({
            name: 'order',
            title: 'Urutan',
            type: 'number',
        })
    ],
})
