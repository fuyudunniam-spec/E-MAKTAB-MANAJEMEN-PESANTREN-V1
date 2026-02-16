
import { createClient } from '@sanity/client'

const config = {
    projectId: 'ala8kqp0',
    dataset: 'production',
    token: 'sklDcxpfPMxkjgGPglmL2vB7BUFhhVQw1iZ9PTgbjGny0vXHq1q6EhUO9zA96Wg75U2UCixpij0s6DCtDDLpUDnxcEQXcaTTcwxbq5FYKlO1Ie2taRK1Rc1n2sU9A8mTcNGb1cU3gwWyt8OmYq68zNgxztJTS4NArH8EXm6fh9SuK8jZ1h7y',
    useCdn: false,
    apiVersion: '2023-05-03',
}

const client = createClient(config)

const psbPageData = {
    _id: 'psbPage',
    _type: 'psbPage',
    hero: {
        title: 'Rumah Kedua Bagi Generasi Penerus',
        subtitle: 'Kami menyediakan lingkungan asrama yang aman dan pendidikan diniyah berkualitas. Bermitra dengan sekolah formal terpilih, kami memastikan keseimbangan ilmu umum dan agama.',
        ctaText: 'Daftar Pengasuhan',
        secondaryCtaText: 'Info Asrama'
    },
    stats: [
        { label: "Mahasantri Aktif", value: "200+", iconName: "GraduationCap" },
        { label: "Sekolah Mitra", value: "5+", iconName: "School" },
        { label: "Penerima Beasiswa", value: "150", iconName: "HeartHandshake" },
    ],
    advantages: [
        {
            _key: 'adv1',
            title: "Tahsin & Tahfidz Al-Qur'an",
            description: "Fokus utama pada perbaikan kualitas bacaan (tajwid & makhraj) serta program hafalan yang fleksibel dan terjaga sanadnya.",
            iconName: "BookOpen",
            colorClass: "bg-royal-50 text-royal-700"
        },
        {
            _key: 'adv2',
            title: "Kajian Kitab Turats",
            description: "Melestarikan tradisi ngaji kitab kuning (Fiqh, Aqidah, Tasawuf) warisan ulama salaf sebagai fondasi pemahaman agama.",
            iconName: "Scroll",
            colorClass: "bg-gold-50 text-gold-600"
        },
        {
            _key: 'adv3',
            title: "Bahasa & Literasi",
            description: "Pengembangan skill Bahasa Arab & Inggris aktif, serta budaya literasi (membaca & menulis) untuk wawasan global.",
            iconName: "Globe",
            colorClass: "bg-stone-100 text-stone-600"
        },
        {
            _key: 'adv4',
            title: "Studi & Akademik",
            description: "Lingkungan asrama yang kondusif untuk belajar, mendukung santri/mahasiswa berprestasi di sekolah formal & kampus.",
            iconName: "GraduationCap",
            colorClass: "bg-royal-900 text-gold-400"
        }
    ],
    programs: [
        {
            _key: 'prog1',
            title: "Santri Reguler",
            slug: { _type: 'slug', current: 'santri-reguler' },
            description: "Program asrama & diniyah untuk siswa sekolah formal. Fokus pembinaan karakter dan kemandirian.",
            iconName: "School",
            price: "Rp 850rb",
            paymentPeriod: "/bln",
            features: [
                "Asrama & Makan 3x Sehari",
                "Antar-Jemput Sekolah Mitra",
                "Madrasah Diniyah Sore",
                "Laundry & Kesehatan"
            ],
            isPopular: false
        },
        {
            _key: 'prog2',
            title: "Pesantren Mahasiswa",
            slug: { _type: 'slug', current: 'pesantren-mahasiswa' },
            description: "Hunian strategis & edukatif khusus mahasantri. Kajian Turats mendalam, fasilitas co-working, dan networking.",
            iconName: "GraduationCap",
            price: "Rp 650rb",
            paymentPeriod: "/bln",
            features: [
                "Kajian Kitab Kuning & Kontemporer",
                "Kamar AC & WiFi High Speed",
                "Mentoring Riset & Akademik",
                "Program Tahfidz Fleksibel"
            ],
            isPopular: true
        },
        {
            _key: 'prog3',
            title: "Beasiswa Kader",
            slug: { _type: 'slug', current: 'beasiswa-kader' },
            description: "Program khusus Yatim & Dhuafa berprestasi. Seleksi ketat untuk mencetak kader ulama masa depan.",
            iconName: "HeartHandshake",
            price: "Gratis 100%",
            paymentPeriod: "",
            features: [
                "Asrama & Makan Gratis",
                "Biaya Sekolah Formal Ditanggung",
                "Pembinaan Intensif 24 Jam",
                "Wajib Pengabdian (Khidmah)"
            ],
            isPopular: false
        }
    ],
    faqs: [
        {
            _key: 'faq1',
            question: "Apakah Al-Bisri memiliki sekolah formal sendiri?",
            answer: "Saat ini, Al-Bisri fokus pada Madrasah Diniyah (Kepesantrenan) dan Asrama. Untuk sekolah formal (SD-SMA/SMK), kami bermitra dengan lembaga pendidikan formal terpercaya di sekitar Gunung Anyar. Santri akan diantar-jemput ke sekolah mitra tersebut."
        },
        {
            _key: 'faq2',
            question: "Apakah kegiatan pesantren mengganggu sekolah atau kuliah?",
            answer: "Tidak. Jadwal kegiatan pesantren disusun agar tidak mengganggu jam akademik formal. Kegiatan Madrasah Diniyah (Madin) memiliki jadwal fleksibel (Sore atau Malam), dan kajian kitab dilaksanakan di luar jam sekolah/kuliah, sehingga santri tetap bisa fokus mengejar prestasi akademik."
        },
        {
            _key: 'faq3',
            question: "Apakah lokasi pesantren strategis untuk Mahasiswa?",
            answer: "Sangat strategis. Pesantren Mahasiswa Al-Bisri berlokasi di Perum IKIP C-92, Gunung Anyar, yang sangat dekat dengan kampus UINSA Kampus 2 dan UPN Veteran Jatim, menjadikannya hunian ideal bagi mahasiswa."
        },
        {
            _key: 'faq4',
            question: "Bagaimana pembagian antara Santri Yatim dan Reguler?",
            answer: "Kami mengintegrasikan mereka dalam satu lingkungan yang saling asah-asih-asuh. Santri Yatim (Full Beasiswa) dan Santri Reguler/Mahasiswa (Berbayar) mendapatkan fasilitas pendidikan dan kurikulum diniyah yang setara."
        }
    ],
    ctaSection: {
        title: "Siap Menjadi Bagian Keluarga Al-Bisri?",
        subtitle: "Segera daftarkan putra-putri Anda sebelum kuota terpenuhi. Masa depan gemilang dimulai dari pendidikan yang tepat.",
        buttonText: "Daftar Sekarang"
    }
}

async function seed() {
    try {
        console.log('Seeding PSB Page Content...')
        // Create or replace the singleton
        await client.createOrReplace(psbPageData)
        console.log('Seeded PSB Page Singleton')
    } catch (err) {
        console.error('Error seeding PSB page:', err)
    }
}

seed()
