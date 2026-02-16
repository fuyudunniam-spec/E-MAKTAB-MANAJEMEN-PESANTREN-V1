
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
        _type: 'landingHero',
        title: 'Memuliakan',
        titleItalic: 'Harkat Kemanusiaan.',
        subtitle: 'Ikhtiar tulus untuk mengangkat derajat sesama melalui pendidikan dan kasih sayang, memastikan setiap jiwa mendapatkan kesempatan yang setara.',
        badge: 'Binaan Pesantren Mahasiswa An-Nur',
        ctaText: 'Tentang Kami',
        ctaLink: '/tentang-kami',
        ctaStyle: 'bg-white text-navy-950',
        order: 1,
        externalImageUrl: "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=2000",
    },
    {
        _type: 'landingHero',
        title: 'Dikelola dengan',
        titleItalic: 'Amanah Profesional.',
        subtitle: 'Kolaborasi manajemen kelembagaan bersama Pesantren Mahasiswa An-Nur serta pengelolaan transparansi informasi memastikan setiap amanah publik terlaporkan dengan jujur dan akuntabel.',
        subBadge: 'Sinergi & Transparansi',
        ctaText: 'Laporan Transparansi',
        ctaLink: '/transparansi',
        ctaStyle: 'bg-white text-navy-950',
        order: 2,
        externalImageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2000",
    },
    {
        _type: 'landingHero',
        title: 'Mencetak Generasi',
        titleItalic: 'Berhati Mulia.',
        subtitle: 'Kurikulum yang menyeimbangkan kecerdasan intelektual dan kematangan spiritual. Membekali santri yatim agar mandiri dan berdaya saing.',
        subBadge: 'Pendidikan Holistik',
        ctaText: 'Lihat Program',
        ctaLink: '/#program', // Updated link
        ctaStyle: 'bg-accent-gold text-navy-950',
        order: 3,
        externalImageUrl: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2000",
    }
]

const services = [
    {
        _type: 'service',
        title: 'Pendidikan Formal',
        description: 'SD, SMP, SMA Islam Terpadu & Madrasah Diniyah.',
        icon: 'GraduationCap',
        order: 1
    },
    {
        _type: 'service',
        title: 'Pendidikan Pesantren',
        description: 'Mahad Aly, Tahfidz Al-Quran & Kajian Kitab Kuning.',
        icon: 'BookOpen',
        order: 2
    },
    {
        _type: 'service',
        title: 'Asrama & Fasilitas',
        description: 'Asrama representatif dengan lingkungan kondusif.',
        icon: 'Home',
        order: 3
    },
    {
        _type: 'service',
        title: 'Manajemen Profesional',
        description: 'Pengelolaan transparan, akuntabel & modern.',
        icon: 'Briefcase',
        order: 4
    }
]

const impactPillars = [
    {
        _type: 'impactPillar',
        title: 'Pendidikan Formal',
        description: 'Beasiswa penuh bagi santri yatim dan dhuafa',
        aliases: ['Bantuan Langsung Yayasan', 'Pendidikan Formal', 'Beasiswa'],
        icon: 'GraduationCap', // Mapping valid Lucide icon
        order: 1
    },
    {
        _type: 'impactPillar',
        title: 'Pendidikan Pesantren',
        description: 'Kurikulum Diniyah & Tahfidz Al-Quran',
        aliases: ['Pendidikan Pesantren', 'Pendidikan', 'Kitab Kuning'],
        icon: 'BookOpen',
        order: 2
    },
    {
        _type: 'impactPillar',
        title: 'Asrama & Konsumsi',
        description: 'Layanan tempat tinggal dan gizi santri',
        aliases: ['Asrama dan Konsumsi Santri', 'Konsumsi', 'Asrama'],
        icon: 'Utensils', // Mapping valid Lucide icon
        order: 3
    },
    {
        _type: 'impactPillar',
        title: 'Operasional Yayasan',
        description: 'Dukungan manajemen dan operasional',
        aliases: ['Operasional Yayasan', 'Gaji', 'Listrik'],
        icon: 'Zap', // Mapping valid Lucide icon
        order: 4
    }
]

async function seed() {
    try {
        console.log('Seeding Homepage Content...')

        // Clear existing? Maybe not, just create. 
        // For idempotency, we could delete existing of these types first if we want "plek ketiplek" reset.
        const deleteQuery = '*[_type in ["landingHero", "service", "impactPillar"]]'
        await client.delete({ query: deleteQuery })
        console.log('Cleared existing homepage content.')

        // Create Heroes
        for (const hero of heroSlides) {
            await client.create(hero)
        }
        console.log('Seeded Hero Slides')

        // Create Services
        for (const svc of services) {
            await client.create(svc)
        }
        console.log('Seeded Services')

        // Create Impact Pillars
        for (const pillar of impactPillars) {
            await client.create(pillar)
        }
        console.log('Seeded Impact Pillars')

        console.log('Done!')
    } catch (err) {
        console.error('Error seeding homepage:', err)
    }
}

seed()
