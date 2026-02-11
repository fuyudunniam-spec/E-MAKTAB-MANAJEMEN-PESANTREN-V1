import { createClient } from '@sanity/client'

export const projectId = 'ala8kqp0'
export const dataset = 'production'
export const apiVersion = '2024-03-13'

export const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: true, // Set to false if statically generating pages, using ISR or tag-based revalidation
})
