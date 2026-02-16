
import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'aboutPage',
    title: 'Halaman Tentang Kami',
    type: 'document',
    fields: [
        defineField({
            name: 'hero',
            title: 'Hero Section',
            type: 'object',
            fields: [
                defineField({ name: 'title', title: 'Judul Utama', type: 'string' }),
                defineField({ name: 'titleItalic', title: 'Judul Italic (Emas)', type: 'string' }),
                defineField({ name: 'subtitle', title: 'Sub Judul / Deskripsi', type: 'text' }),
            ]
        }),
        defineField({
            name: 'history',
            title: 'Sejarah Section',
            type: 'object',
            fields: [
                defineField({ name: 'badge', title: 'Badge Kecil', type: 'string' }),
                defineField({ name: 'title', title: 'Judul Utama', type: 'string' }),
                defineField({ name: 'subtitle', title: 'Sub Judul (Italic)', type: 'string' }),
                defineField({ name: 'description', title: 'Deskripsi Sejarah', type: 'array', of: [{ type: 'block' }] }),
                defineField({ name: 'image', title: 'Gambar Sejarah', type: 'image' }),
                defineField({ name: 'foundedYear', title: 'Tahun Pendirian', type: 'string' }),
                defineField({
                    name: 'stats',
                    title: 'Statistik Kecil',
                    type: 'array',
                    of: [{
                        type: 'object',
                        fields: [
                            { name: 'value', type: 'string', title: 'Angka (1.2k+)' },
                            { name: 'label', type: 'string', title: 'Label (Alumni Tersebar)' }
                        ]
                    }]
                }),
                defineField({ name: 'quote', title: 'Kutipan Pimpinan', type: 'text' }),
            ]
        }),
        defineField({
            name: 'vision',
            title: 'Visi Section',
            type: 'object',
            fields: [
                defineField({ name: 'mainVision', title: 'Visi Utama', type: 'text' }),
            ]
        }),
        defineField({
            name: 'mission',
            title: 'Misi Section',
            type: 'object',
            fields: [
                defineField({ name: 'points', title: 'Poin Misi', type: 'array', of: [{ type: 'string' }] }),
            ]
        }),
    ],
})
