import { MetadataRoute } from 'next'
import { SEO_CONFIG } from '@/lib/seo-config'
import { getAdminDb } from '@/lib/firebase-admin'

/**
 * Dynamic Sitemap Generation for SEO
 * Includes static pages and dynamically fetches all published projects
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SEO_CONFIG.siteUrl

  // Static pages with priorities and change frequencies
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Fetch all projects for dynamic pages
  let projectPages: MetadataRoute.Sitemap = []
  let userPages: MetadataRoute.Sitemap = []

  try {
    const db = getAdminDb()

    // Fetch projects
    const projectsSnapshot = await db
      .collection('projects')
      .orderBy('createdAt', 'desc')
      .limit(1000) // Limit for performance
      .get()

    projectPages = projectsSnapshot.docs.map((doc) => {
      const data = doc.data()
      const updatedAt = data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date()

      return {
        url: `${baseUrl}/menu/${doc.id}`,
        lastModified: updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }
    })

    // Fetch active users for profile pages
    const usersSnapshot = await db
      .collection('users')
      .where('isWithdrawn', '==', false)
      .where('isProfileComplete', '==', true)
      .limit(500)
      .get()

    userPages = usersSnapshot.docs.map((doc) => {
      const data = doc.data()
      const updatedAt = data.updatedAt?.toDate() || new Date()

      return {
        url: `${baseUrl}/profile/${doc.id}`,
        lastModified: updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Continue with static pages only if database fetch fails
  }

  return [...staticPages, ...projectPages, ...userPages]
}
