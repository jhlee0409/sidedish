import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Allowed image types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Compress and optimize image
async function optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  const sharpInstance = sharp(buffer)

  // Get image metadata
  const metadata = await sharpInstance.metadata()

  // Resize if image is too large (max 1200px width)
  const maxWidth = 1200
  const shouldResize = metadata.width && metadata.width > maxWidth

  let processedImage = sharpInstance

  if (shouldResize) {
    processedImage = processedImage.resize(maxWidth, null, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // Convert to webp for better compression, or optimize original format
  if (mimeType === 'image/gif') {
    // Keep GIF as is (for animated GIFs)
    return processedImage.gif({ effort: 7 }).toBuffer()
  }

  // Convert to WebP for better compression
  return processedImage
    .webp({
      quality: 80,
      effort: 4,
    })
    .toBuffer()
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: '파일이 제공되지 않았습니다.' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다. JPG, PNG, WebP, GIF만 가능합니다.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Optimize image
    const optimizedBuffer = await optimizeImage(buffer, file.type)

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const extension = file.type === 'image/gif' ? 'gif' : 'webp'
    const filename = `sidedish/${timestamp}-${randomString}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, optimizedBuffer, {
      access: 'public',
      contentType: file.type === 'image/gif' ? 'image/gif' : 'image/webp',
    })

    return NextResponse.json({
      url: blob.url,
      size: optimizedBuffer.length,
      originalSize: file.size,
      compressionRatio: ((1 - optimizedBuffer.length / file.size) * 100).toFixed(1) + '%',
    })
  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
