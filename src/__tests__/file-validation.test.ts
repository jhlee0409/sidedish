import { describe, it, expect } from 'vitest'
import { validateMagicNumber, MAGIC_NUMBERS } from '@/lib/file-validation'

describe('validateMagicNumber', () => {
  // 유효한 이미지 파일 시그니처 테스트
  describe('valid image signatures', () => {
    it('should validate JPEG files', () => {
      // JPEG magic number: FF D8 FF
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01
      ])
      expect(validateMagicNumber(jpegBuffer, 'image/jpeg')).toBe(true)
    })

    it('should validate PNG files', () => {
      // PNG magic number: 89 50 4E 47 0D 0A 1A 0A
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D
      ])
      expect(validateMagicNumber(pngBuffer, 'image/png')).toBe(true)
    })

    it('should validate GIF87a files', () => {
      // GIF87a magic number: 47 49 46 38 37 61
      const gif87Buffer = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00
      ])
      expect(validateMagicNumber(gif87Buffer, 'image/gif')).toBe(true)
    })

    it('should validate GIF89a files', () => {
      // GIF89a magic number: 47 49 46 38 39 61
      const gif89Buffer = Buffer.from([
        0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00
      ])
      expect(validateMagicNumber(gif89Buffer, 'image/gif')).toBe(true)
    })

    it('should validate WebP files', () => {
      // WebP: RIFF + size + WEBP
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x24, 0x00, 0x00, 0x00, // file size
        0x57, 0x45, 0x42, 0x50  // WEBP
      ])
      expect(validateMagicNumber(webpBuffer, 'image/webp')).toBe(true)
    })
  })

  // 잘못된 파일 시그니처 테스트
  describe('invalid signatures', () => {
    it('should reject mismatched MIME type', () => {
      // PNG signature but claiming JPEG
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D
      ])
      expect(validateMagicNumber(pngBuffer, 'image/jpeg')).toBe(false)
    })

    it('should reject invalid magic numbers', () => {
      // Random bytes
      const randomBuffer = Buffer.from([
        0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B
      ])
      expect(validateMagicNumber(randomBuffer, 'image/jpeg')).toBe(false)
      expect(validateMagicNumber(randomBuffer, 'image/png')).toBe(false)
      expect(validateMagicNumber(randomBuffer, 'image/gif')).toBe(false)
    })

    it('should reject WebP without WEBP marker', () => {
      // RIFF header but not WEBP
      const fakeWebpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x24, 0x00, 0x00, 0x00, // file size
        0x41, 0x56, 0x49, 0x20  // AVI (not WEBP)
      ])
      expect(validateMagicNumber(fakeWebpBuffer, 'image/webp')).toBe(false)
    })

    it('should reject unknown MIME types', () => {
      const buffer = Buffer.alloc(12)
      expect(validateMagicNumber(buffer, 'image/bmp')).toBe(false)
      expect(validateMagicNumber(buffer, 'application/pdf')).toBe(false)
    })
  })

  // 버퍼 크기 검증
  describe('buffer size validation', () => {
    it('should reject buffers smaller than 12 bytes', () => {
      const smallBuffer = Buffer.from([0xFF, 0xD8, 0xFF])
      expect(validateMagicNumber(smallBuffer, 'image/jpeg')).toBe(false)
    })

    it('should accept buffers exactly 12 bytes', () => {
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01
      ])
      expect(validateMagicNumber(jpegBuffer, 'image/jpeg')).toBe(true)
    })
  })
})

describe('MAGIC_NUMBERS config', () => {
  it('should have signatures for all common image types', () => {
    expect(MAGIC_NUMBERS['image/jpeg']).toBeDefined()
    expect(MAGIC_NUMBERS['image/png']).toBeDefined()
    expect(MAGIC_NUMBERS['image/gif']).toBeDefined()
    expect(MAGIC_NUMBERS['image/webp']).toBeDefined()
  })
})
