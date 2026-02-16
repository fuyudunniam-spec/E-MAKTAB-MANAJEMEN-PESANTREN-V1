
import { createClient } from '@sanity/client'

const config = {
    projectId: 'ala8kqp0',
    dataset: 'production',
    token: 'sklDcxpfPMxkjgGPglmL2vB7BUFhhVQw1iZ9PTgbjGny0vXHq1q6EhUO9zA96Wg75U2UCixpij0s6DCtDDLpUDnxcEQXcaTTcwxbq5FYKlO1Ie2taRK1Rc1n2sU9A8mTcNGb1cU3gwWyt8OmYq68zNgxztJTS4NArH8EXm6fh9SuK8jZ1h7y',
    useCdn: false,
    apiVersion: '2023-05-03',
}

const client = createClient(config)

const aboutPageData = {
    _id: 'aboutPage',
    _type: 'aboutPage',
    hero: {
        title: 'Penjaga Tradisi,',
        titleItalic: 'Pembangun Peradaban',
        subtitle: 'Al-Bisri adalah perwujudan dari cita-cita luhur untuk mengangkat derajat umat melalui pendidikan yang berkarakter, mandiri, dan berwawasan global.'
    },
    history: {
        badge: 'Akar Sejarah',
        title: 'Transformasi dari',
        subtitle: 'Majelis ke Institut',
        // Description as blocks
        description: [
            {
                _type: 'block',
                children: [{ _type: 'span', text: 'Bermula dari sebuah rumah wakaf sederhana di pinggiran kota, KH. Bisri Mustofa (Alm) memulai majelis taklim kecil dengan lima orang santri yatim. Niat beliau sederhana: memberikan hak pendidikan bagi mereka yang kurang beruntung.' }]
            },
            {
                _type: 'block',
                children: [{ _type: 'span', text: 'Seiring berjalannya waktu, amanah umat semakin besar. Pada tahun 2010, Yayasan Al-Bisri resmi bertransformasi menjadi lembaga pendidikan terpadu yang memadukan kurikulum salaf (kitab kuning) dengan sistem sekolah formal modern.' }]
            }
        ],
        // Image to be uploaded manually or using external URL if schema supported it. 
        // Current schema uses 'image' type. For simplicity in seed, we skip actual image upload unless we have assets.
        // We will assume user uploads image in studio.
        foundedYear: '1998',
        stats: [
            { value: '1.2k+', label: 'Alumni Tersebar' },
            { value: '100%', label: 'Lulusan Kompeten' }
        ],
        quote: 'Setiap anak yatim yang kami asuh adalah aset umat. Kemandirian lembaga adalah kunci untuk menjaga martabat dan keberlanjutan masa depan mereka.'
    },
    vision: {
        mainVision: 'Menjadi pusat kaderisasi ulama dan intelektual muslim yang mandiri, berakhlak mulia, dan berwawasan global.'
    },
    mission: {
        points: [
            'Integrasi tradisi klasik & sains modern.',
            'Kemandirian ekonomi pesantren.',
            'Skill teknokrat & kepemimpinan.'
        ]
    }
}

async function seed() {
    try {
        console.log('Seeding About Page Content...')
        // Create or replace the singleton
        await client.createOrReplace(aboutPageData)
        console.log('Seeded About Page Singleton')
    } catch (err) {
        console.error('Error seeding about page:', err)
    }
}

seed()
