
import { createClient } from '@sanity/client';
import { projectId, dataset, apiVersion } from '../src/lib/sanity/client';

// Load environment variables (if running with tsx/dotenv preloaded, otherwise we rely on process.env)
const token = process.env.SANITY_API_TOKEN;

if (!token) {
    console.error('Error: SANITY_API_TOKEN is missing from environment variables.');
    console.error('Please run with: SANITY_API_TOKEN=your_token npx tsx scripts/seed-sanity.ts');
    process.exit(1);
}

const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
});

// --- STATIC DATA ---

const HERO_SLIDES = [
    {
        title: "Memuliakan",
        titleItalic: "Harkat Kemanusiaan.",
        subtitle: "Ikhtiar tulus untuk mengangkat derajat sesama melalui pendidikan dan kasih sayang, memastikan setiap jiwa mendapatkan kesempatan yang setara.",
        image: "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=2000",
        ctaText: "Tentang Kami",
        ctaLink: "/tentang-kami"
    },
    {
        title: "Dikelola dengan",
        titleItalic: "Amanah Profesional.",
        subtitle: "Kolaborasi manajemen kelembagaan bersama Pesantren Mahasiswa An-Nur serta pengelolaan transparansi informasi memastikan setiap amanah publik terlaporkan dengan jujur dan akuntabel.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2000",
        ctaText: "Laporan Transparansi",
        ctaLink: "/transparansi"
    },
    {
        title: "Mencetak Generasi",
        titleItalic: "Berhati Mulia.",
        subtitle: "Kurikulum yang menyeimbangkan kecerdasan intelektual dan kematangan spiritual. Membekali santri yatim agar mandiri dan berdaya saing.",
        image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2000",
        ctaText: "Lihat Program",
        ctaLink: "/akademik"
    }
];

const TEAM = [
    { name: 'KH. Ahmad Bisri, Lc. MA', role: 'Pengasuh Pesantren', description: 'Alumni Universitas Al-Azhar Kairo dengan spesialisasi Fiqih Muamalah.', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=400&auto=format&fit=crop', order: 1 },
    { name: 'Dr. H. Muhammad Ilham', role: 'Direktur Pendidikan', description: 'Doktor Manajemen Pendidikan Islam, fokus pada pengembangan kurikulum riset.', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=400&auto=format&fit=crop', order: 2 },
    { name: 'H. Yusuf Mansur, SE', role: 'Ketua Yayasan', description: 'Profesional di bidang keuangan syariah dan pengembangan wakaf produktif.', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop', order: 3 },
];

const FACILITIES = [
    { name: 'Asrama Putra/Putri', description: 'Kapasitas 500 Santri', img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600&auto=format&fit=crop' },
    { name: 'Perpustakaan Digital', description: 'Akses Kitab & Jurnal', img: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=600&auto=format&fit=crop' },
    { name: 'Lab Komputer', description: 'Pusat Riset & Multimedia', img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop' },
    { name: 'Greenhouse Wakaf', description: 'Laboratorium Alam', img: 'https://images.unsplash.com/photo-1625246333195-58197bd47d26?q=80&w=600&auto=format&fit=crop' },
];

const MILESTONES = [
    { year: '1998', title: 'Perintisan', description: 'Pendirian Panti Asuhan & Pesantren Yatim pertama.' },
    { year: '2010', title: 'Legalitas Madin', description: 'Izin operasional resmi Madrasah Diniyah & Program Asrama.' },
    { year: '2024', title: 'Ekosistem Baru', description: 'Peluncuran unit usaha mandiri & Pesantren Mahasiswa.' },
    { year: '2026', title: 'Kemandirian', description: 'Target operasional mandiri penuh & Universitas.' },
];

const PROGRAMS = [
    { title: "Pendidikan Formal", description: "Memfasilitasi akses pendidikan formal (SD - SMA) melalui beasiswa penuh bagi santri yatim dan dhuafa.", iconName: "GraduationCap" },
    { title: "Pendidikan Pesantren", description: "Kurikulum Diniyah, Tahfidz Al-Qur'an, dan kajian Kitab Kuning (Turats) bersanad.", iconName: "BookOpen" },
    { title: "Asrama & Konsumsi", description: "Menjamin tempat tinggal layak, makan bergizi, dan kesejahteraan harian santri.", iconName: "Home" },
    { title: "Operasional Yayasan", description: "Dukungan manajemen profesional untuk keberlanjutan takmir dan layanan umat.", iconName: "Briefcase" }
];

const PARTNERS = [
    { name: "KEMENAG" },
    { name: "BAZNAS" },
    { name: "BANK BSI" },
    { name: "UNIV. AL-AZHAR" },
    { name: "DOMPET DHUAFA" },
];

const TESTIMONIALS = [
    {
        quote: "Alhamdulillah, melihat perkembangan anak-anak di sini sangat mengharukan. Mereka tidak hanya hafal Qur'an, tapi juga punya adab yang sangat santun.",
        name: "Hj. Fatimah",
        role: "Donatur Tetap",
    },
    {
        quote: "Transparansi laporan keuangan Al-Bisri membuat saya percaya. Setiap rupiah benar-benar terlihat dampaknya untuk pendidikan adik-adik yatim.",
        name: "Bpk. Hendarman",
        role: "Wali Santri",
    }
];

// --- HELPERS ---

async function uploadImage(url: string) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
        const buffer = await response.arrayBuffer();
        const asset = await client.assets.upload('image', Buffer.from(buffer), {
            filename: url.split('/').pop()?.split('?')[0] || 'image.jpg'
        });
        return asset;
    } catch (error) {
        console.error(`Failed to upload image ${url}:`, error);
        return null;
    }
}

// --- SEEDING FUNCTIONS ---

async function seedHero() {
    console.log('Seeding Hero...');
    for (const slide of HERO_SLIDES) {
        let imageAsset = null;
        if (slide.image) {
            imageAsset = await uploadImage(slide.image);
        }

        const doc = {
            _type: 'landingHero',
            title: `${slide.title} ${slide.titleItalic}`,
            subtitle: slide.subtitle,
            ctaText: slide.ctaText,
            ctaLink: slide.ctaLink,
            backgroundImage: imageAsset ? {
                _type: 'image',
                asset: { _type: 'reference', _ref: imageAsset._id }
            } : undefined
        };

        await client.create(doc);
        console.log(`Created Hero: ${doc.title}`);
    }
}

async function seedTeam() {
    console.log('Seeding Team...');
    for (const member of TEAM) {
        let imageAsset = null;
        if (member.img) {
            imageAsset = await uploadImage(member.img);
        }

        const doc = {
            _type: 'teamMember',
            name: member.name,
            role: member.role,
            description: member.description,
            order: member.order,
            photo: imageAsset ? {
                _type: 'image',
                asset: { _type: 'reference', _ref: imageAsset._id }
            } : undefined
        };

        await client.create(doc);
        console.log(`Created Team Member: ${doc.name}`);
    }
}

async function seedFacilities() {
    console.log('Seeding Facilities...');
    for (const facility of FACILITIES) {
        let imageAsset = null;
        if (facility.img) {
            imageAsset = await uploadImage(facility.img);
        }

        const doc = {
            _type: 'facility',
            name: facility.name,
            description: facility.description,
            image: imageAsset ? {
                _type: 'image',
                asset: { _type: 'reference', _ref: imageAsset._id }
            } : undefined
        };

        await client.create(doc);
        console.log(`Created Facility: ${doc.name}`);
    }
}

async function seedMilestones() {
    console.log('Seeding Milestones...');
    for (const m of MILESTONES) {
        const doc = {
            _type: 'milestone',
            year: m.year,
            title: m.title,
            description: m.description,
        };
        await client.create(doc);
        console.log(`Created Milestone: ${m.year}`);
    }
}

async function seedPrograms() {
    console.log('Seeding Programs...');
    for (const p of PROGRAMS) {
        const doc = {
            _type: 'donationProgram',
            title: p.title,
            description: p.description,
            iconName: p.iconName,
            slug: { _type: 'slug', current: p.title.toLowerCase().replace(/\s+/g, '-') }
        };
        await client.create(doc);
        console.log(`Created Program: ${p.title}`);
    }
}

async function seedPartners() {
    console.log('Seeding Partners...');
    for (const p of PARTNERS) {
        const doc = {
            _type: 'partner',
            name: p.name,
        };
        await client.create(doc);
        console.log(`Created Partner: ${p.name}`);
    }
}

async function seedTestimonials() {
    console.log('Seeding Testimonials...');
    for (const t of TESTIMONIALS) {
        const doc = {
            _type: 'testimonial',
            name: t.name,
            role: t.role,
            message: t.quote,

        };
        await client.create(doc);
        console.log(`Created Testimonial: ${t.name}`);
    }
}

// --- MAIN ---

async function main() {
    try {
        await seedHero();
        await seedTeam();
        await seedFacilities();
        await seedMilestones();
        await seedPrograms();
        await seedPartners();
        await seedTestimonials();
        console.log('Seeding completed successfully!');
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

main();
