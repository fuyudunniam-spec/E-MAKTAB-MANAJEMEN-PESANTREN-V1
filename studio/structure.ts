import type { StructureBuilder } from 'sanity/structure'
import { Home, Settings, FileText, Users, MapPin, Layers, Layout, MessageSquare, Handshake } from 'lucide-react'

export const structure = (S: StructureBuilder) =>
    S.list()
        .title('Konten Website')
        .items([
            // 1. PUSAT KENDALI (LANDING PAGE)
            S.listItem()
                .title('Landing Page (Pusat Kendali)')
                .icon(Home)
                .child(
                    S.document()
                        .schemaType('homePage')
                        .documentId('homePage')
                        .title('Pengaturan Halaman Utama')
                ),

            S.divider(),

            // 2. BERITA & ARTIKEL
            S.listItem()
                .title('Pusat Berita & Artikel')
                .icon(FileText)
                .child(
                    S.list()
                        .title('Manajemen Konten')
                        .items([
                            S.documentTypeListItem('news').title('Semua Artikel').icon(FileText),
                            S.documentTypeListItem('category').title('Kategori Berita').icon(Layers),
                            S.documentTypeListItem('teamMember').title('Penulis & Pengurus').icon(Users),
                        ])
                ),

            // 3. PENGATURAN GLOBAL & HALAMAN STATIS
            S.listItem()
                .title('Halaman & Pengaturan Global')
                .icon(Settings)
                .child(
                    S.list()
                        .title('Halaman Statis & Global')
                        .items([
                            S.listItem()
                                .title('Info Yayasan (Site Settings)')
                                .icon(Settings)
                                .child(
                                    S.document()
                                        .schemaType('siteSettings')
                                        .documentId('siteSettings')
                                        .title('Informasi Dasar Website')
                                ),
                            S.divider(),
                            S.listItem()
                                .title('Halaman Tentang Kami')
                                .icon(Users)
                                .child(
                                    S.document()
                                        .schemaType('aboutPage')
                                        .documentId('aboutPage')
                                        .title('Konten Tentang Kami')
                                ),
                            S.listItem()
                                .title('Halaman PSB')
                                .icon(FileText)
                                .child(
                                    S.document()
                                        .schemaType('psbPage')
                                        .documentId('psbPage')
                                        .title('Konten Pendaftaran')
                                ),
                            S.divider(),
                            S.documentTypeListItem('facility').title('Fasilitas Yayasan').icon(MapPin),
                        ])
                ),

            S.divider(),

            // HIDE ALL INDIVIDUAL COMPONENTS
            // These are now managed inside homePage or are secondary
            ...S.documentTypeListItems().filter(
                (listItem) =>
                    ![
                        'homePage',
                        'siteSettings',
                        'aboutPage',
                        'psbPage',
                        'news',
                        'category',
                        'teamMember',
                        'facility',
                        // Hide these from root:
                        'landingHero',
                        'service',
                        'impactPillar',
                        'partner',
                        'testimonial',
                        'donationProgram',
                        'media.tag',
                    ].includes(listItem.getId() || '')
            ),
        ])
