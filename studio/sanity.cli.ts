import { defineCliConfig } from 'sanity/cli'

const projectId = 'ala8kqp0'
const dataset = 'production'

export default defineCliConfig({
    api: {
        projectId,
        dataset,
    },
    studioHost: 'emaktab-website', // Optional: for deployment
    deployment: {
        autoUpdates: true,
    },
})
