import groq from 'groq'

// Landing Page Queries
export const LANDING_PAGE_QUERY = groq`{
  "hero": *[_type == "landingHero"] | order(order asc),
  "services": *[_type == "service"] | order(order asc),
  "impactPillars": *[_type == "impactPillar"] | order(order asc),
  "history": *[_type == "aboutPage"][0].history,
  "partners": *[_type == "partner"],

  "testimonials": *[_type == "testimonial"]
}`

export const NEWS_QUERY = groq`*[_type == "news"] | order(publishedAt desc)[0...6] {
  _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage,
    "category": category->title,
    "author": author->{
      name,
      role,
      photo
    }
}`

// About Us Page Queries
export const ABOUT_PAGE_QUERY = groq`{
  "aboutPage": *[_type == "aboutPage"][0],
  "team": *[_type == "teamMember" && showInAboutPage == true] | order(order asc) {
    name,

      role,
      description,
      photo,
      order,
      socialLinks,
      googleScholarUrl,
      scopusId
  },
  "facilities": *[_type == "facility"],

}`

// Donation Page Queries
export const DONATION_PAGE_QUERY = groq`{
  "programs": * [_type == "donationProgram"],
    "donors": [] // Placeholder if we want to fetch donors from Sanity later, currently hardcoded or empty
} `

// PSB Page Queries
export const PSB_PAGE_QUERY = groq`* [_type == "psbPage"][0]`

// Site Settings Query
export const SITE_SETTINGS_QUERY = groq`* [_type == "siteSettings"][0]`
