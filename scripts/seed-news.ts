
import { createClient } from '@sanity/client';
import { projectId, dataset, apiVersion } from '../src/lib/sanity/client';

// Load environment variables (if running with tsx/dotenv preloaded, otherwise we rely on process.env)
const token = process.env.SANITY_API_TOKEN;

if (!token) {
    console.error('Error: SANITY_API_TOKEN is missing from environment variables.');
    console.error('Please run with: SANITY_API_TOKEN=your_token npx tsx scripts/seed-news.ts');
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

const POSTS = [
    {
        date: "2024-10-20T10:00:00Z", // Converted from "20 Okt 2024"
        category: "Prestasi",
        mappedCategory: "berita",
        title: "Santri Al-Bisri Raih Juara 1 MHQ Nasional 2024",
        excerpt: "Ananda Fatih berhasil menyisihkan 300 peserta dari seluruh Indonesia dalam kategori Hafalan 30 Juz Beserta Tafsir.",
        image: "https://images.unsplash.com/photo-1585036156171-384164a8c675?q=80&w=800&auto=format&fit=crop",
        slug: "santri-al-bisri-juara-nasional"
    },
    {
        date: "2024-10-18T10:00:00Z",
        category: "Laporan Wakaf",
        mappedCategory: "pengumuman",
        title: "Panen Raya Padi Organik: Bukti Kemandirian Pangan",
        excerpt: "Hasil panen dari sawah wakaf meningkat 20% berkat penerapan teknologi irigasi tetes yang dikembangkan santri.",
        image: "https://images.unsplash.com/photo-1625246333195-58197bd47d26?q=80&w=800&auto=format&fit=crop",
        slug: "panen-raya-padi-organik"
    },
    {
        date: "2024-10-15T10:00:00Z",
        category: "Opini",
        mappedCategory: "artikel",
        title: "Urgensi Fiqih Muamalah di Era Digital",
        excerpt: "Bagaimana hukum transaksi crypto dan e-wallet? Simak kajian mendalam dari tim riset Pesantren Al-Bisri.",
        image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop",
        slug: "urgensi-fiqih-muamalah"
    },
    {
        date: "2024-10-10T10:00:00Z",
        category: "Program",
        mappedCategory: "kegiatan",
        title: "Soft Launching Digital Library",
        excerpt: "Akses ribuan kitab kuning digital kini tersedia untuk publik. Wujud nyata digitalisasi turats pesantren.",
        image: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=800&auto=format&fit=crop",
        slug: "soft-launching-digital-library"
    },
    {
        date: "2024-10-05T10:00:00Z",
        category: "Kunjungan",
        mappedCategory: "kegiatan",
        title: "Studi Banding Kemenag Jawa Timur",
        excerpt: "Kunjungan untuk meninjau kurikulum kewirausahaan santri yang menjadi percontohan nasional.",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=800&auto=format&fit=crop",
        slug: "studi-banding-kemenag"
    },
    {
        date: "2024-10-01T10:00:00Z",
        category: "Video",
        mappedCategory: "berita",
        title: "Dokumenter: Sehari di Asrama Al-Bisri",
        excerpt: "Mengintip keseharian santri mulai dari shalat tahajud, kajian kitab, hingga kegiatan ekstrakurikuler.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
        slug: "dokumenter-sehari-di-asrama"
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

async function seedNews() {
    console.log('Seeding News...');
    for (const post of POSTS) {
        let imageAsset = null;
        if (post.image) {
            imageAsset = await uploadImage(post.image);
        }

        const doc = {
            _type: 'news',
            title: post.title,
            slug: { _type: 'slug', current: post.slug },
            publishedAt: post.date,
            excerpt: post.excerpt,
            category: post.mappedCategory,
            mainImage: imageAsset ? {
                _type: 'image',
                asset: { _type: 'reference', _ref: imageAsset._id }
            } : undefined,
            body: [
                {
                    _type: 'block',
                    children: [
                        {
                            _type: 'span',
                            text: post.excerpt + " (Konten lengkap akan segera tersedia)."
                        }
                    ],
                    style: 'normal'
                }
            ]
        };

        await client.create(doc);
        console.log(`Created News Post: ${doc.title}`);
    }
}

// --- MAIN ---

async function main() {
    try {
        await seedNews();
        console.log('News seeding completed successfully!');
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

main();
