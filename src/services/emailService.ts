'use server'

import { DigestEmailData } from './digestGeneratorService'
import { LUNCHBOX_TEXT } from '@/lib/lunchbox-text'

/** Resend API 응답 타입 */
interface ResendResponse {
  id?: string
  error?: {
    message: string
    name: string
  }
}

/** 이메일 발송 결과 */
export interface EmailSendResult {
  success: boolean
  messageId?: string
  error?: string
}

/** Resend API 클라이언트 */
async function sendViaResend(
  to: string,
  subject: string,
  html: string
): Promise<ResendResponse> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'lunchbox@sidedish.app'
  const fromName = process.env.RESEND_FROM_NAME || 'SideDish 도시락'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject,
      html,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('Resend API error:', data)
    return { error: data.error || { message: 'Unknown error', name: 'ApiError' } }
  }

  return data
}

/** 다이제스트 이메일 발송 */
export async function sendDigestEmail(
  to: string,
  digestData: DigestEmailData
): Promise<EmailSendResult> {
  try {
    const response = await sendViaResend(to, digestData.subject, digestData.htmlBody)

    if (response.error) {
      return {
        success: false,
        error: response.error.message,
      }
    }

    return {
      success: true,
      messageId: response.id,
    }
  } catch (error) {
    console.error('Email send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/** 일괄 이메일 발송 (구독자 목록) */
export async function sendBulkDigestEmails(
  emails: string[],
  digestDataList: DigestEmailData[]
): Promise<{
  total: number
  success: number
  failed: number
  results: Array<{ email: string; result: EmailSendResult }>
}> {
  const results: Array<{ email: string; result: EmailSendResult }> = []

  // 이메일과 다이제스트 데이터를 매칭하여 발송
  for (let i = 0; i < emails.length; i++) {
    const email = emails[i]
    const digestData = digestDataList[i]

    if (!digestData) {
      results.push({
        email,
        result: { success: false, error: 'No digest data available' },
      })
      continue
    }

    const result = await sendDigestEmail(email, digestData)
    results.push({ email, result })

    // Rate limit 방지를 위한 딜레이 (100ms)
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  const success = results.filter((r) => r.result.success).length

  return {
    total: emails.length,
    success,
    failed: emails.length - success,
    results,
  }
}
