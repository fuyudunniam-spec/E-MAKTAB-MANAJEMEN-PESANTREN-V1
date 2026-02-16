import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'siteSettings',
    title: 'Pengaturan Situs',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Judul Situs',
            type: 'string',
        }),
        defineField({
            name: 'description',
            title: 'Deskripsi Situs (SEO)',
            type: 'text',
        }),
        defineField({
            name: 'logo',
            title: 'Logo Situs',
            type: 'image',
            options: {
                hotspot: true,
            },
        }),
        defineField({
            name: 'brand',
            title: 'Brand Info (Footer)',
            type: 'object',
            fields: [
                { name: 'title', type: 'string', title: 'Brand Title (e.g. Al-Bisri)' },
                { name: 'subtitle', type: 'string', title: 'Brand Subtitle (e.g. Foundation)' },
                { name: 'description', type: 'text', title: 'Brand Description' },
            ]
        }),
        defineField({
            name: 'supervision',
            title: 'Supervisi (Footer)',
            type: 'object',
            fields: [
                { name: 'label', type: 'string', title: 'Label (e.g. Supervisi)' },
                { name: 'value', type: 'string', title: 'Value (e.g. Pesantren Mahasiswa An-Nur)' },
            ]
        }),
        defineField({
            name: 'headerMenu',
            title: 'Menu Header',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'menuItem',
                    title: 'Menu Item',
                    fields: [
                        { name: 'title', type: 'string', title: 'Judul' },
                        { name: 'link', type: 'string', title: 'Link / URL' },
                    ],
                },
            ],
        }),
        defineField({
            name: 'footerMenu',
            title: 'Menu Footer (Menu Utama)',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'menuItem',
                    title: 'Menu Item',
                    fields: [
                        { name: 'title', type: 'string', title: 'Judul' },
                        { name: 'link', type: 'string', title: 'Link / URL' },
                    ],
                },
            ],
        }),
        defineField({
            name: 'location',
            title: 'Lokasi (Footer)',
            type: 'object',
            fields: [
                { name: 'title', type: 'string', title: 'Judul (e.g. Lokasi Kami)' },
                { name: 'mapUrl', type: 'url', title: 'Link Google Maps' },
                { name: 'mapEmbedUrl', type: 'url', title: 'Link Embed Google Maps' },
                { name: 'address', type: 'text', title: 'Alamat Lengkap' },
            ]
        }),
        defineField({
            name: 'socialMedia',
            title: 'Social Media',
            type: 'array',
            of: [
                {
                    type: 'object',
                    name: 'socialLink',
                    title: 'Social Link',
                    fields: [
                        { name: 'platform', type: 'string', title: 'Platform' },
                        { name: 'url', type: 'url', title: 'URL' },
                    ],
                },
            ],
        }),
        defineField({
            name: 'contactInfo',
            title: 'Informasi Kontak',
            type: 'object',
            fields: [
                { name: 'phone', type: 'string', title: 'Telepon' },
                { name: 'email', type: 'string', title: 'Email' },
            ]
        })
    ],
})
