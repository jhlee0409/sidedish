'use server'

import { DigestEmailData, WeatherDigestContent } from './digestGeneratorService'
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

/** 날씨 다이제스트 HTML 이메일 템플릿 생성 */
function generateDigestEmailHtml(content: WeatherDigestContent): string {
  const { greeting, summary, cityHighlights, outfit, tips, closing } = content

  const cityHighlightsHtml = cityHighlights
    .map(
      (city) => `
      <tr>
        <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">
          <strong style="color: #1e293b;">${city.city}</strong>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">${city.highlight}</p>
        </td>
      </tr>
    `
    )
    .join('')

  const tipsHtml = tips
    .map((tip) => `<li style="margin: 8px 0; color: #475569;">${tip}</li>`)
    .join('')

  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>오늘의 도시락</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px 24px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 8px;">🍱</div>
        <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">오늘의 도시락</h1>
        <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.8); font-size: 14px;">매일 아침, 당신에게 필요한 정보를</p>
      </td>
    </tr>

    <!-- Greeting -->
    <tr>
      <td style="padding: 32px 24px 16px;">
        <p style="margin: 0; color: #1e293b; font-size: 18px; line-height: 1.6;">
          ${greeting}
        </p>
      </td>
    </tr>

    <!-- Summary -->
    <tr>
      <td style="padding: 16px 24px;">
        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px;">
          <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.7;">
            ${summary}
          </p>
        </div>
      </td>
    </tr>

    <!-- City Highlights -->
    <tr>
      <td style="padding: 24px;">
        <h2 style="margin: 0 0 16px; color: #1e293b; font-size: 16px; font-weight: 600;">
          🏙️ 도시별 날씨
        </h2>
        <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          ${cityHighlightsHtml}
        </table>
      </td>
    </tr>

    <!-- Outfit -->
    <tr>
      <td style="padding: 0 24px 24px;">
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px;">
          <h3 style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 600;">
            👔 오늘의 옷차림
          </h3>
          <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.6;">
            ${outfit}
          </p>
        </div>
      </td>
    </tr>

    <!-- Tips -->
    <tr>
      <td style="padding: 0 24px 24px;">
        <h2 style="margin: 0 0 12px; color: #1e293b; font-size: 16px; font-weight: 600;">
          💡 오늘의 팁
        </h2>
        <ul style="margin: 0; padding-left: 20px;">
          ${tipsHtml}
        </ul>
      </td>
    </tr>

    <!-- Closing -->
    <tr>
      <td style="padding: 16px 24px 32px; text-align: center;">
        <p style="margin: 0; color: #64748b; font-size: 15px; font-style: italic;">
          ${closing}
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px;">
          ${LUNCHBOX_TEXT.EMAIL_FOOTER}
        </p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://sidedish.app'}/mypage?tab=lunchbox" style="color: #6366f1; font-size: 12px; text-decoration: none;">
          ${LUNCHBOX_TEXT.EMAIL_MANAGE_LINK}
        </a>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/** 다이제스트 이메일 발송 */
export async function sendDigestEmail(
  to: string,
  digestData: DigestEmailData
): Promise<EmailSendResult> {
  try {
    const html = generateDigestEmailHtml(digestData.content)

    const response = await sendViaResend(to, digestData.subject, html)

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
  digestData: DigestEmailData
): Promise<{
  total: number
  success: number
  failed: number
  results: Array<{ email: string; result: EmailSendResult }>
}> {
  const results: Array<{ email: string; result: EmailSendResult }> = []

  // 순차적으로 발송 (Resend 무료 플랜의 rate limit 고려)
  for (const email of emails) {
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

/** 테스트 이메일 발송 */
export async function sendTestEmail(to: string): Promise<EmailSendResult> {
  const testContent: WeatherDigestContent = {
    greeting: '좋은 아침이에요! ☀️ 오늘은 12월 18일 수요일이에요.',
    summary:
      '오늘 전국적으로 맑은 날씨가 예상돼요. 서울은 영하 2도에서 시작해 낮에는 5도까지 올라갈 예정이에요. 건조한 날씨가 계속되니 수분 섭취에 신경 써주세요.',
    cityHighlights: [
      { city: '서울', highlight: '☀️ 맑음, -2°C ~ 5°C, 건조해요' },
      { city: '부산', highlight: '⛅ 구름 조금, 3°C ~ 9°C, 바람이 조금 불어요' },
      { city: '대구', highlight: '☀️ 맑음, 0°C ~ 7°C, 포근한 오후가 될 거예요' },
    ],
    outfit:
      '아침저녁으로 쌀쌀하니 두꺼운 외투를 챙기세요. 낮에는 햇볕이 따뜻해서 얇은 니트 정도면 충분해요.',
    tips: [
      '자외선 차단제 잊지 마세요! ☀️',
      '건조해서 입술이 트기 쉬우니 립밤 챙기세요',
      '미세먼지 보통 - 환기하기 좋은 날이에요',
    ],
    closing: '오늘도 따뜻하고 건강한 하루 보내세요! 🌟',
  }

  const testDigestData: DigestEmailData = {
    subject: '🍱 [테스트] 오늘의 도시락 - 서울 -2°C',
    previewText: testContent.summary.slice(0, 100),
    content: testContent,
    rawWeatherData: {
      generatedAt: Date.now(),
      cities: [],
    },
    generatedAt: Date.now(),
  }

  return sendDigestEmail(to, testDigestData)
}
