import { createClient } from '@sanity/client'

export const projectId = 'ala8kqp0'
export const dataset = 'production'
export const apiVersion = '2024-03-13'

export const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false, // Set to false to bypass CDN caching and get fresh data immediately
})
