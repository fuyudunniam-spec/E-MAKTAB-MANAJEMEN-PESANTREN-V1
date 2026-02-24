
import { createClient } from '@sanity/client'
import path from 'path'
import fs from 'fs'

const config = {
    projectId: 'ala8kqp0',
    dataset: 'production',
    token: 'sklDcxpfPMxkjgGPglmL2vB7BUFhhVQw1iZ9PTgbjGny0vXHq1q6EhUO9zA96Wg75U2UCixpij0s6DCtDDLpUDnxcEQXcaTTcwxbq5FYKlO1Ie2taRK1Rc1n2sU9A8mTcNGb1cU3gwWyt8OmYq68zNgxztJTS4NArH8EXm6fh9SuK8jZ1h7y',
    useCdn: false,
    apiVersion: '2023-05-03',
}

const client = createClient(config)

const heroSlides = [
    {
        _id: 'hero1',
        _type: 'landingHero',
        title: 'Memuliakan',
        titleItalic: 'Harkat Kemanusiaan.',
        subtitle: 'Ikhtiar tulus untuk mengangkat derajat sesama melalui pendidikan dan kasih sayang, memastikan setiap jiwa mendapatkan kesempatan yang setara.',
        badge: 'Binaan Pesantren Mahasiswa An-Nur',
        ctaText: 'Tentang Kami',
        ctaLink: '/tentang-kami',
        quote: 'Barangsiapa memelihara seorang anak yatim, ia bersamaku di surga.',
        quoteAuthor: 'Nabi Muhammad ﷺ',
        order: 1,
        externalImageUrl: "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?q=80&w=2000",
        // Supporting slots for images in the grid
        image2: null,
        image3: null,
    },
    {
        _id: 'hero2',
        _type: 'landingHero',
        title: 'Dikelola dengan',
        titleItalic: 'Amanah Profesional.',
        subtitle: 'Kolaborasi manajemen kelembagaan bersama Pesantren Mahasiswa An-Nur memastikan setiap amanah publik terlaporkan dengan jujur dan akuntabel.',
        subBadge: 'Sinergi & Transparansi',
        ctaText: 'Laporan Transparansi',
        ctaLink: '/transparansi',
        quote: 'Sesungguhnya Allah mencintai orang yang jika bekerja, ia lakukan dengan itqan (profesional).',
        quoteAuthor: 'HR. Al-Baihaqi',
        order: 2,
        externalImageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2000",
    },
    {
        _id: 'hero3',
        _type: 'landingHero',
        title: 'Mencetak Generasi',
        titleItalic: 'Berhati Mulia.',
        subtitle: 'Kurikulum yang menyeimbangkan kecerdasan intelektual dan kematangan spiritual. Membekali santri yatim agar mandiri dan berdaya saing.',
        subBadge: 'Pendidikan Holistik',
        ctaText: 'Lihat Program',
        ctaLink: '/program',
        quote: 'Ilmu tanpa adab bagaikan api tanpa cahaya.',
        quoteAuthor: 'Hikmah Salaf',
        order: 3,
        externalImageUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2000",
    }
]

// ... (services and impactPillars remain similar, omitting for brevity in thought but including in full file update)
const services = [
    { _id: 'svc1', _type: 'service', title: 'Pendidikan Formal', description: 'SD, SMP, SMA Islam Terpadu & Madrasah Diniyah.', icon: 'GraduationCap', order: 1 },
    { _id: 'svc2', _type: 'service', title: 'Pendidikan Pesantren', description: 'Mahad Aly, Tahfidz Al-Quran & Kajian Kitab Kuning.', icon: 'BookOpen', order: 2 },
    { _id: 'svc3', _type: 'service', title: 'Asrama & Fasilitas', description: 'Asrama representatif dengan lingkungan kondusif.', icon: 'Home', order: 3 },
    { _id: 'svc4', _type: 'service', title: 'Manajemen Profesional', description: 'Pengelolaan transparan, akuntabel & modern.', icon: 'Briefcase', order: 4 }
]

const testimonials = [
    { _id: 'testi1', _type: 'testimonial', name: 'Hj. Fatimah', role: 'Donatur Tetap', content: "Alhamdulillah, melihat perkembangan anak-anak di sini sangat mengharukan. Mereka tidak hanya hafal Qur'an, tapi juga punya adab yang sangat santun." },
    { _id: 'testi2', _type: 'testimonial', name: 'Bpk. Hendarman', role: 'Wali Santri', content: "Transparansi laporan keuangan Al-Bisri membuat saya percaya. Setiap rupiah benar-benar terlihat dampaknya untuk pendidikan adik-adik yatim." },
    { _id: 'testi3', _type: 'testimonial', name: 'Ahmad Fauzi', role: 'Mahasantri', content: "Lingkungan pesantren yang kondusif membuat kuliah saya tidak terganggu. Justru kajian kitab di sini menambah wawasan yang tidak saya dapatkan di kampus." }
]

async function seed() {
    try {
        console.log('Seeding Homepage Content (Full Consolidation)...')

        // Create Heroes
        const heroRefs = []
        for (const hero of heroSlides) {
            const result = await client.createOrReplace(hero)
            heroRefs.push({ _type: 'reference', _ref: result._id, _key: result._id })
        }
        console.log('Seeded Hero Slides')

        // Create Testimonials
        const testiRefs = []
        for (const testi of testimonials) {
            const result = await client.createOrReplace(testi)
            testiRefs.push({ _type: 'reference', _ref: result._id, _key: result._id })
        }
        console.log('Seeded Testimonial Docs')

        // Create Services
        const serviceRefs = []
        for (const svc of services) {
            const result = await client.createOrReplace(svc)
            serviceRefs.push({ _type: 'reference', _ref: result._id, _key: result._id })
        }
        console.log('Seeded Services')

        const homePage = {
            _id: 'homePage',
            _type: 'homePage',
            title: 'Pesantren Al-Bisri | Memuliakan Yatim, Mencetak Generasi Mandiri',
            hero: heroRefs,
            services: serviceRefs,
            testimonials: testiRefs,
            heroImpact: {
                value: '50+',
                label: 'Santri Binaan'
            },
            partners: [
                { _key: 'p1', name: 'Pesantren An-Nur', description: 'Mitra Utama Pengembangan Akademik' },
                { _key: 'p2', name: 'BAZNAS', description: 'Lembaga Amil Zakat Nasional' },
                { _key: 'p3', name: 'Bank Syariah Indonesia', description: 'Mitra Transaksi Perbankan Syariah' },
                { _key: 'p4', name: 'Dompet Dhuafa', description: 'Sinergi Penyaluran Donasi' },
                { _key: 'p5', name: 'KEMENAG RI', description: 'Instansi Pembina Keagamaan' }
            ],
            aboutSummary: {
                badge: 'Ikhtiar dan Amanah',
                title: 'Yayasan Pesantren Anak Yatim Al-Bisri',
                subtitle: 'Membangun Peradaban dari Rahim Kepedulian.',
                description: 'Pesantren Anak Yatim Al-Bisri adalah lembaga pendidikan Islam yang berkomitmen mencetak generasi berakhlak mulia, mandiri, dan berdaya saing. Kami hadir untuk memberikan hak pendidikan dan kasih sayang kepada anak-anak yatim, agar mereka tumbuh menjadi pribadi yang bermanfaat bagi agama, bangsa, dan negara.',
                ctaText: 'Selami Sejarah Kami',
                ctaLink: '/tentang-kami',
                stats: [
                    { _key: 's1', value: '2010', label: 'Tahun Berdiri' },
                    { _key: 's2', value: '200+', label: 'Santri Aktif' },
                    { _key: 's3', value: '100%', label: 'Beasiswa Penuh' },
                    { _key: 's4', value: '1.2k+', label: 'Alumni Tersebar' }
                ]
            }
        }
        await client.createOrReplace(homePage)
        console.log('Seeded HomePage Singleton')

        console.log('Done!')
    } catch (err) {
        console.error('Error seeding homepage:', err)
    }
}

seed()

seed()
