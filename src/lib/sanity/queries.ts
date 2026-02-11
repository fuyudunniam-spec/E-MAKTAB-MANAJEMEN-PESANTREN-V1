import groq from 'groq'

// Landing Page Queries
export const LANDING_PAGE_QUERY = groq`{
  "hero": *[_type == "landingHero"][0],
  "partners": *[_type == "partner"],
  "milestones": *[_type == "milestone"] | order(year desc),
  "testimonials": *[_type == "testimonial"]
}`

export const NEWS_QUERY = groq`*[_type == "news"] | order(publishedAt desc) [0...3] {
  title,
  slug,
  publishedAt,
  excerpt,
  mainImage,
  category
}`

// About Us Page Queries
export const ABOUT_PAGE_QUERY = groq`{
  "team": *[_type == "teamMember"] | order(order asc),
  "facilities": *[_type == "facility"],
  "milestones": *[_type == "milestone"] | order(year desc)
}`

// Donation Page Queries
export const DONATION_PAGE_QUERY = groq`{
  "programs": *[_type == "donationProgram"],
  "donors": [] // Placeholder if we want to fetch donors from Sanity later, currently hardcoded or empty
}`
