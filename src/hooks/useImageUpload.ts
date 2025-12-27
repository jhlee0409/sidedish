/**
 * 이미지 업로드 훅
 *
 * 파일 선택, 프리뷰 생성, 검증, 업로드를 처리합니다.
 * Register와 Edit 페이지에서 공통으로 사용됩니다.
 */

import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { FILE_CONSTRAINTS, FORM_ERROR_MESSAGES } from '@/lib/form-constants'

export type UploadType = 'profile' | 'project'

export interface UseImageUploadOptions {
  maxSizeBytes?: number
  onError?: (error: string) => void
}

export interface UseImageUploadReturn {
  /** 선택된 파일 */
  selectedFile: File | null
  /** 프리뷰 URL (base64 data URL) */
  previewUrl: string
  /** 업로드 진행 중 여부 */
  isUploading: boolean
  /** 파일 input ref */
  fileInputRef: React.RefObject<HTMLInputElement | null>
  /** 파일 변경 핸들러 */
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  /** 파일 선택 트리거 */
  triggerFileSelect: () => void
  /** 파일 업로드 (서버로 전송) */
  uploadImage: (type: UploadType, entityId: string) => Promise<string | null>
  /** 상태 초기화 */
  reset: () => void
  /** 파일 존재 여부 */
  hasFile: boolean
}

export function useImageUpload(options: UseImageUploadOptions = {}): UseImageUploadReturn {
  const {
    maxSizeBytes = FILE_CONSTRAINTS.MAX_SIZE_BYTES,
    onError,
  } = options

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleError = useCallback((message: string) => {
    if (onError) {
      onError(message)
    } else {
      toast.error(message)
    }
  }, [onError])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 파일 크기 검증
    if (file.size > maxSizeBytes) {
      handleError(FORM_ERROR_MESSAGES.FILE_TOO_LARGE)
      // input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // 파일 타입 검증
    if (!FILE_CONSTRAINTS.ALLOWED_TYPES.includes(file.type as typeof FILE_CONSTRAINTS.ALLOWED_TYPES[number])) {
      handleError('지원하지 않는 이미지 형식입니다. (JPG, PNG, WebP, GIF만 가능)')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setSelectedFile(file)

    // 프리뷰 URL 생성
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.onerror = () => {
      handleError('이미지 미리보기 생성에 실패했습니다.')
    }
    reader.readAsDataURL(file)
  }, [maxSizeBytes, handleError])

  const uploadImage = useCallback(async (type: UploadType, entityId: string): Promise<string | null> => {
    if (!selectedFile) {
      handleError('업로드할 파일을 선택해주세요.')
      return null
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', type)
      formData.append('entityId', entityId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '이미지 업로드에 실패했습니다.')
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      handleError(error instanceof Error ? error.message : '이미지 업로드에 실패했습니다.')
      return null
    } finally {
      setIsUploading(false)
    }
  }, [selectedFile, handleError])

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const reset = useCallback(() => {
    setSelectedFile(null)
    setPreviewUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return {
    selectedFile,
    previewUrl,
    isUploading,
    fileInputRef,
    handleFileChange,
    triggerFileSelect,
    uploadImage,
    reset,
    hasFile: !!selectedFile || !!previewUrl,
  }
}

export default useImageUpload
