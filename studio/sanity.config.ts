import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'
import { structure } from './structure'

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
        structureTool({
            structure,
        }),
        visionTool(),
    ],

    schema: {
        types: schemaTypes,
    },
})
