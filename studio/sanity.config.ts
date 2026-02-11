import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

// TODO: better to use environment variables, but for simplicity we HARDCODE the project ID here
// since this file is client-side configuration anyway.
const projectId = 'ala8kqp0'
const dataset = 'production'

export default defineConfig({
    name: 'default',
    title: 'E-Maktab Website',

    projectId,
    dataset,

    plugins: [
        structureTool(),
        visionTool(),
    ],

    schema: {
        types: schemaTypes,
    },
})
