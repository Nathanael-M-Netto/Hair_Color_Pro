import { ImageResponse } from 'next/og';

/**
 * Open Graph image — gerada on-the-fly pelo Next quando alguém compartilha
 * a URL no WhatsApp/Twitter/iMessage/etc. Preview rico em vez de "site sem imagem".
 *
 * Edge runtime: roda na borda da Vercel/CDN, sem cold start.
 */
export const runtime = 'edge';
export const alt = 'Hair Color Pro — Colorimetria capilar com IA';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0E0C0B',
          backgroundImage:
            'radial-gradient(ellipse at 20% 0%, #2A1810 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, #1F1614 0%, transparent 60%)',
          color: '#F5EFE6',
          fontFamily: 'serif',
          padding: '80px',
        }}
      >
        {/* Logomark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 48,
            fontSize: 16,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(245, 239, 230, 0.7)',
            fontFamily: 'monospace',
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #C66A3E 0%, #E6CFAF 100%)',
            }}
          />
          Hair Color Pro
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 96,
            margin: 0,
            textAlign: 'center',
            fontWeight: 300,
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
          }}
        >
          Diagnóstico de cor na{' '}
          <span
            style={{
              fontStyle: 'italic',
              background: 'linear-gradient(135deg, #C66A3E 0%, #E6CFAF 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            ponta do dedo.
          </span>
        </h1>

        {/* Tagline */}
        <p
          style={{
            marginTop: 32,
            fontSize: 28,
            color: 'rgba(245, 239, 230, 0.6)',
            textAlign: 'center',
            fontFamily: 'sans-serif',
          }}
        >
          Colorimetria capilar com IA, em segundos
        </p>
      </div>
    ),
    { ...size },
  );
}
