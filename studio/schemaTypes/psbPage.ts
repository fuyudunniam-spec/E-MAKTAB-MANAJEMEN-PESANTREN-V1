import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'psbPage',
    title: 'Halaman PSB',
    type: 'document',
    fields: [
        defineField({
            name: 'hero',
            title: 'Hero Section',
            type: 'object',
            fields: [
                { name: 'title', type: 'string', title: 'Judul Utama' },
                { name: 'subtitle', type: 'text', title: 'Sub Judul' },
                { name: 'ctaText', type: 'string', title: 'Teks Tombol Daftar' },
                { name: 'secondaryCtaText', type: 'string', title: 'Teks Tombol Info' },
            ]
        }),
        defineField({
            name: 'stats',
            title: 'Statistik',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'label', type: 'string', title: 'Label' },
                        { name: 'value', type: 'string', title: 'Nilai' },
                        { name: 'iconName', type: 'string', title: 'Nama Icon (Lucide)' },
                    ]
                }
            ]
        }),
        defineField({
            name: 'advantages',
            title: 'Keunggulan / Pilar',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'title', type: 'string', title: 'Judul' },
                        { name: 'description', type: 'text', title: 'Deskripsi' },
                        { name: 'iconName', type: 'string', title: 'Nama Icon (Lucide)' },
                        { name: 'colorClass', type: 'string', title: 'Color Class (Tailwind)' } // Optional: to keep the design flexible
                    ]
                }
            ]
        }),
        defineField({
            name: 'programs',
            title: 'Pilihan Program',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'title', type: 'string', title: 'Nama Program' },
                        { name: 'slug', type: 'slug', title: 'Slug', options: { source: 'title' } },
                        { name: 'description', type: 'text', title: 'Deskripsi Singkat' },
                        { name: 'iconName', type: 'string', title: 'Nama Icon' },
                        { name: 'price', type: 'string', title: 'Biaya' },
                        { name: 'paymentPeriod', type: 'string', title: 'Periode Pembayaran (e.g., /bln)' },
                        { name: 'features', type: 'array', of: [{ type: 'string' }], title: 'Fitur / Fasilitas' },
                        { name: 'isPopular', type: 'boolean', title: 'Tampilkan sebagai Terpopuler?' },
                    ]
                }
            ]
        }),
        defineField({
            name: 'faqs',
            title: 'FAQ',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'question', type: 'string', title: 'Pertanyaan' },
                        { name: 'answer', type: 'text', title: 'Jawaban' },
                    ]
                }
            ]
        }),
        defineField({
            name: 'ctaSection',
            title: 'Bottom CTA Section',
            type: 'object',
            fields: [
                { name: 'title', type: 'string', title: 'Judul' },
                { name: 'subtitle', type: 'text', title: 'Sub Judul' },
                { name: 'buttonText', type: 'string', title: 'Teks Tombol' },
            ]
        })
    ],
    preview: {
        select: {
            title: 'hero.title',
        },
        prepare() {
            return {
                title: 'Konten Halaman PSB'
            }
        }
    }
})
