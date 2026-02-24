import { createClient } from '@sanity/client'
import path from 'path'
import fs from 'fs'

// Hardcoded config to avoid dotenv issues in Sanity CLI context
const config = {
    projectId: 'ala8kqp0',
    dataset: 'production',
    token: 'sklDcxpfPMxkjgGPglmL2vB7BUFhhVQw1iZ9PTgbjGny0vXHq1q6EhUO9zA96Wg75U2UCixpij0s6DCtDDLpUDnxcEQXcaTTcwxbq5FYKlO1Ie2taRK1Rc1n2sU9A8mTcNGb1cU3gwWyt8OmYq68zNgxztJTS4NArH8EXm6fh9SuK8jZ1h7y',
    useCdn: false,
    apiVersion: '2023-05-03',
}

const client = createClient(config)

async function uploadImage(filePath) {
    try {
        console.log(`Uploading image from ${filePath}...`)
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`)
            return null
        }
        const buffer = fs.readFileSync(filePath)
        const asset = await client.assets.upload('image', buffer, {
            filename: path.basename(filePath)
        })
        console.log(`Image uploaded: ${asset._id}`)
        return asset._id
    } catch (err) {
        console.error(`Failed to upload image ${filePath}:`, err)
        return null
    }
}

const siteSettingsData = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    title: 'Pesantren Al-Bisri',
    description: 'Pusat pendidikan terpadu yang memadukan khazanah keilmuan Islam klasik dengan wawasan modern, mencetak santri yatim yang mandiri, berkarakter, dan berdaya saing.',
    brand: {
        title: 'Al-Bisri.',
        subtitle: 'Yayasan Pesantren Yatim',
        description: 'Berdedikasi untuk melahirkan generasi muslim yang mandiri, beradab, dan berwawasan global melalui sinergi pendidikan salaf dan kurikulum modern.'
    },
    supervision: {
        label: 'Di bawah Pembinaan',
        value: 'Pesantren Mahasiswa An-Nur'
    },
    headerMenu: [
        { _key: 'menu1', title: 'Profil', link: '/tentang-kami' },
        { _key: 'menu2', title: 'Program', link: '/program' },
        { _key: 'menu3', title: 'Transparansi', link: '/transparansi' },
        { _key: 'menu4', title: 'PSB', link: '/psb' },
        { _key: 'menu5', title: 'Login', link: '/emaktab' },
        { _key: 'menu6', title: 'Donasi', link: '/donasi' },
    ],
    footerMenu: [
        { _key: 'fmenu1', title: 'Beranda', link: '/' },
        { _key: 'fmenu2', title: 'Profil Lembaga', link: '/tentang-kami' },
        { _key: 'fmenu3', title: 'Program Pendidikan', link: '/program' },
        { _key: 'fmenu4', title: 'Berita & Pemikiran', link: '/berita' },
        { _key: 'fmenu5', title: 'Transparansi Keuangan', link: '/transparansi' },
    ],
    admisiMenu: [
        { _key: 'amenu1', title: 'Santri Yatim (Beasiswa)', link: '/psb?jalur=yatim' },
        { _key: 'amenu2', title: 'Pesantren Mahasiswa', link: '/psb?jalur=mahasiswa' },
        { _key: 'amenu3', title: 'Program TPQ', link: '/psb?jalur=tpq' },
        { _key: 'amenu4', title: 'Donasi & Wakaf', link: '/donasi' },
        { _key: 'amenu5', title: 'Login E-Maktab', link: '/emaktab' },
    ],
    location: {
        title: 'Lokasi Kami',
        mapUrl: 'https://maps.google.com',
        mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.999789332214!2d110.3695!3d-7.7956!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zN8KwNDcnNDQuMiJTIDExMMKwMjInMTAuMiJF!5e0!3m2!1sen!2sid!4v1625634589000!5m2!1sen!2sid',
        address: 'Perum IKIP C-92, Gunung Anyar\nSurabaya, Jawa Timur 60294'
    },
    socialMedia: [
        { _key: 'soc1', platform: 'Instagram', url: '#' },
        { _key: 'soc2', platform: 'Youtube', url: '#' },
        { _key: 'soc3', platform: 'Email', url: 'mailto:info@albisri.id' },
    ],
    contactInfo: {
        phone: '+62 812-XXXX-XXXX',
        email: 'info@albisri.id'
    }
}

async function seed() {
    try {
        console.log('Seeding Site Settings...')

        // Try to upload logo if exists in public folder
        // Note: When running via sanity exec in studio/, __dirname logic might vary.
        // We assume running from studio root.
        const logoPath = path.resolve(process.cwd(), '../public/kop-albisri.png')

        const logoAssetId = await uploadImage(logoPath)
        if (logoAssetId) {
            siteSettingsData.logo = {
                _type: 'image',
                asset: { _ref: logoAssetId, _type: 'reference' }
            }
        }

        const result = await client.createOrReplace(siteSettingsData)
        console.log('Success:', result)
    } catch (err) {
        console.error('Error seeding site settings:', err)
    }
}

seed()
