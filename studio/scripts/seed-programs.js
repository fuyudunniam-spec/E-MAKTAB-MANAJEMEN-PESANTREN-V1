
import { createClient } from '@sanity/client'

const config = {
    projectId: 'ala8kqp0',
    dataset: 'production',
    token: 'sklDcxpfPMxkjgGPglmL2vB7BUFhhVQw1iZ9PTgbjGny0vXHq1q6EhUO9zA96Wg75U2UCixpij0s6DCtDDLpUDnxcEQXcaTTcwxbq5FYKlO1Ie2taRK1Rc1n2sU9A8mTcNGb1cU3gwWyt8OmYq68zNgxztJTS4NArH8EXm6fh9SuK8jZ1h7y',
    useCdn: false,
    apiVersion: '2023-05-03',
}

const client = createClient(config)

const programs = [
    {
        _id: 'program-pembangunan-asrama',
        _type: 'donationProgram',
        title: 'Pembangunan Asrama Baru',
        slug: { _type: 'slug', current: 'pembangunan-asrama-baru' },
        description: 'Bantu kami mewujudkan asrama yang layak dan nyaman bagi santri penghafal Quran. Setiap batu bata adalah amal jariyah.',
        // image: ... (skip actual image upload, use existing asset if known or leave empty)
        iconName: 'Building2',
        targetAmount: 'Rp 2.5 M',
        currentAmount: 'Rp 450 Jt',
        progressPercentage: 18
    },
    {
        _id: 'program-beasiswa-yatim',
        _type: 'donationProgram',
        title: 'Beasiswa Santri Yatim',
        slug: { _type: 'slug', current: 'beasiswa-santri-yatim' },
        description: 'Dukung pendidikan 100+ santri yatim dan dhuafa agar mereka bisa terus belajar tanpa memikirkan biaya.',
        iconName: 'GraduationCap',
        targetAmount: '200 Santri',
        currentAmount: '85 Santri',
        progressPercentage: 42
    },
    {
        _id: 'program-wakaf-quran',
        _type: 'donationProgram',
        title: 'Wakaf Al-Quran & Kitab',
        slug: { _type: 'slug', current: 'wakaf-quran-kitab' },
        description: 'Alirkan pahala yag tiada putus dengan memfasilitasi mushaf dan kitab kuning bagi para penuntut ilmu.',
        iconName: 'BookOpen',
        targetAmount: '1000 Paket',
        currentAmount: '320 Paket',
        progressPercentage: 32
    }
]

async function seed() {
    try {
        console.log('Seeding Donation Programs...')
        const transaction = client.transaction()
        programs.forEach(doc => {
            transaction.createOrReplace(doc)
        })
        await transaction.commit()
        console.log('Seeded Donation Programs')
    } catch (err) {
        console.error('Error seeding programs:', err)
    }
}

seed()
