/**
 * Generate OG image URL for a project
 */
export function getOgImageUrl(project: {
  title: string
  shortDescription?: string
  authorName?: string
  platform?: string
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

  const params = new URLSearchParams({
    title: project.title,
    description: project.shortDescription || '',
    author: project.authorName || '',
    platform: project.platform || 'WEB',
  })

  return `${baseUrl}/api/og?${params.toString()}`
}

/**
 * Get project thumbnail URL with OG fallback
 * Returns OG image URL if imageUrl is empty or a placeholder
 */
export function getProjectThumbnail(project: {
  imageUrl?: string
  title: string
  shortDescription?: string
  authorName?: string
  platform?: string
}): string {
  // Check if imageUrl exists and is not a placeholder
  if (project.imageUrl &&
      !project.imageUrl.includes('picsum.photos') &&
      !project.imageUrl.includes('placeholder')) {
    return project.imageUrl
  }

  // Fallback to OG image
  return getOgImageUrl(project)
}
