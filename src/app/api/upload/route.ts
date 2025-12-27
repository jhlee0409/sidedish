import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import sharp from 'sharp'
import { Timestamp } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebase-admin'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMIT_CONFIGS,
  getClientIdentifier,
  createRateLimitKey,
} from '@/lib/rate-limiter'
import { validateMagicNumber } from '@/lib/file-validation'
import { handleApiError, badRequestResponse } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'
import type { UploadMetadataDoc } from '@/lib/db-types'

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

    // Rate limiting
    const clientIp = getClientIdentifier(request)
    const rateLimitKey = createRateLimitKey(user.uid, clientIp)
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.UPLOAD)

    if (!rateLimit.allowed) {
      return rateLimitResponse(
        rateLimit.remaining,
        rateLimit.resetMs,
        '업로드 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const type = formData.get('type') as string | null
    const entityId = formData.get('entityId') as string | null

    if (!file) {
      return badRequestResponse('파일이 제공되지 않았습니다.')
    }

    // Validate type parameter
    if (!type || !['profile', 'project'].includes(type)) {
      return badRequestResponse('올바른 업로드 타입을 지정해주세요. (profile 또는 project)')
    }

    // Validate entityId parameter
    if (!entityId || typeof entityId !== 'string' || entityId.trim().length === 0) {
      return badRequestResponse('유효한 엔티티 ID를 지정해주세요.')
    }

    // SECURITY: Verify user has permission to upload for this entity
    if (type === 'profile' && entityId !== user.uid) {
      return NextResponse.json(
        { error: '자신의 프로필 사진만 업로드할 수 있습니다.' },
        { status: 403 }
      )
    }

    // For projects, we'll verify ownership when the project is created/updated
    // (Upload happens before project creation, so we can't verify here)

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return badRequestResponse('지원하지 않는 파일 형식입니다. JPG, PNG, WebP, GIF만 가능합니다.')
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return badRequestResponse('파일 크기는 5MB 이하여야 합니다.')
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // SECURITY: Validate magic number to prevent malicious file uploads
    // This ensures the file content matches the claimed MIME type
    if (!validateMagicNumber(buffer, file.type)) {
      console.warn('[Security] Magic number mismatch detected', {
        claimedType: file.type,
        fileSize: file.size,
        timestamp: new Date().toISOString(),
      })
      return badRequestResponse('파일 형식이 올바르지 않습니다. 실제 이미지 파일을 업로드해주세요.')
    }

    // Optimize image
    const optimizedBuffer = await optimizeImage(buffer, file.type)

    // Generate structured filename
    const timestamp = Date.now()
    const extension = file.type === 'image/gif' ? 'gif' : 'webp'
    const filename = `sidedish/${type}s/${entityId}/${timestamp}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, optimizedBuffer, {
      access: 'public',
      contentType: file.type === 'image/gif' ? 'image/gif' : 'image/webp',
    })

    // Extract upload ID from blob URL pathname (e.g., "sidedish/projects/abc-123/1234567890.webp" -> "1234567890.webp")
    const uploadId = new URL(blob.url).pathname.split('/').pop() || `${timestamp}.${extension}`

    // Save upload metadata to Firestore for tracking and cleanup
    // NOTE: Firestore does not allow undefined values, so we conditionally add fields
    const uploadMetadata: UploadMetadataDoc = {
      id: uploadId,
      url: blob.url,
      userId: user.uid,
      type: type as 'profile' | 'project',
      uploadedAt: Timestamp.now(),
      status: 'pending', // Initial status, updated to 'active' after project creation
      fileSize: optimizedBuffer.length,
      mimeType: blob.contentType || (file.type === 'image/gif' ? 'image/gif' : 'image/webp'),
      // Conditionally add draftId and projectId only for project uploads
      ...(type === 'project' && { draftId: entityId }),
    }

    // Store metadata in Firestore
    const adminDb = getAdminDb()
    await adminDb.collection('uploads').doc(uploadId).set(uploadMetadata)

    return NextResponse.json({
      url: blob.url,
      size: optimizedBuffer.length,
      originalSize: file.size,
      compressionRatio: ((1 - optimizedBuffer.length / file.size) * 100).toFixed(1) + '%',
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/upload', ERROR_MESSAGES.UPLOAD_FAILED)
  }
}
