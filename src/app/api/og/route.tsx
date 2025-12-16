import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Get parameters from URL
    const title = searchParams.get('title') || 'SideDish'
    const description = searchParams.get('description') || '사이드 프로젝트 큐레이션 플랫폼'
    const author = searchParams.get('author') || ''
    const platform = searchParams.get('platform') || 'WEB'

    // Platform badge colors
    const platformColors: Record<string, { bg: string; text: string }> = {
      WEB: { bg: '#3B82F6', text: '#FFFFFF' },
      APP: { bg: '#10B981', text: '#FFFFFF' },
      GAME: { bg: '#8B5CF6', text: '#FFFFFF' },
      DESIGN: { bg: '#EC4899', text: '#FFFFFF' },
      OTHER: { bg: '#6B7280', text: '#FFFFFF' },
    }

    const platformLabels: Record<string, string> = {
      WEB: '🌐 Web',
      APP: '📱 App',
      GAME: '🎮 Game',
      DESIGN: '🎨 Design',
      OTHER: '📦 Other',
    }

    const colors = platformColors[platform] || platformColors.WEB
    const platformLabel = platformLabels[platform] || platformLabels.WEB

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#F8FAFC',
            padding: '60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header with logo and platform badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #F97316, #EA580C)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                }}
              >
                🍽️
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B' }}>
                SideDish
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: colors.bg,
                color: colors.text,
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              {platformLabel}
            </div>
          </div>

          {/* Main content */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
            <h1
              style={{
                fontSize: title.length > 30 ? '48px' : '56px',
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.2,
                marginBottom: '20px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: '24px',
                color: '#64748B',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {description}
            </p>
          </div>

          {/* Footer with author */}
          {author && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginTop: '40px',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #FED7AA, #FDBA74)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#EA580C',
                }}
              >
                {author.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '20px', fontWeight: 600, color: '#475569' }}>
                {author} Chef
              </span>
            </div>
          )}

          {/* Decorative elements */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.1))',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-50px',
              left: '-50px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'rgba(148, 163, 184, 0.1)',
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG Image generation error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
