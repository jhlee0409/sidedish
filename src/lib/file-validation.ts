/**
 * File Validation Utilities
 *
 * Magic number validation to ensure file content matches claimed MIME type.
 * Prevents malicious files disguised as images.
 */

/**
 * Magic number signatures for image file validation
 */
export const MAGIC_NUMBERS: Record<string, { signature: number[]; offset?: number }[]> = {
  'image/jpeg': [
    { signature: [0xFF, 0xD8, 0xFF] }, // JPEG/JFIF/EXIF
  ],
  'image/png': [
    { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }, // PNG
  ],
  'image/gif': [
    { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] }, // GIF87a
    { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] }, // GIF89a
  ],
  'image/webp': [
    { signature: [0x52, 0x49, 0x46, 0x46] }, // RIFF (first 4 bytes)
  ],
}

// Minimum buffer size for validation
const MIN_BUFFER_SIZE = 12

/**
 * Validates file magic numbers to ensure content matches claimed MIME type
 * @param buffer - File buffer
 * @param mimeType - Claimed MIME type
 * @returns true if valid, false if magic number doesn't match
 */
export function validateMagicNumber(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_NUMBERS[mimeType]
  if (!signatures) return false

  // Check if buffer is too short
  if (buffer.length < MIN_BUFFER_SIZE) return false

  // Check each possible signature for this MIME type
  for (const { signature, offset = 0 } of signatures) {
    let matches = true
    for (let i = 0; i < signature.length; i++) {
      if (buffer[offset + i] !== signature[i]) {
        matches = false
        break
      }
    }
    if (matches) {
      // Additional check for WebP: verify WEBP marker at offset 8
      if (mimeType === 'image/webp') {
        const webpMarker = [0x57, 0x45, 0x42, 0x50] // WEBP
        for (let i = 0; i < webpMarker.length; i++) {
          if (buffer[8 + i] !== webpMarker[i]) {
            return false
          }
        }
      }
      return true
    }
  }

  return false
}
