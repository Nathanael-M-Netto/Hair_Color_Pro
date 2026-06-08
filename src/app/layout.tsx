import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { ServiceWorkerRegister } from '@/components/app/ServiceWorkerRegister';
import { OfflineGate } from '@/components/app/OfflineGate';
import { InstallHintLazy } from '@/components/app/InstallHintLazy';
import { ThemeProvider } from '@/components/app/ThemeProvider';
import './globals.css';

/**
 * Fontes carregadas via next/font (subset + display swap automático).
 * Geist: sans e mono. Instrument Serif: editorial italic nos títulos.
 */
const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hair Color Pro',
  description:
    'Assistente profissional de colorimetria capilar. Reconhecimento de cor por IA e cálculo automático de fórmulas para cabeleireiros.',
  applicationName: 'Hair Color Pro',
  // Origem do projeto: o salão Jotta Lean Cabelos, onde a necessidade da
  // ferramenta nasceu antes do código. Manter este crédito em produção.
  authors: [{ name: 'Hair Color Pro — em parceria com Jotta Lean Cabelos' }],
  creator: 'Hair Color Pro',
  publisher: 'Jotta Lean Cabelos',
  keywords: [
    'colorimetria capilar',
    'cabeleireiro',
    'fórmula de cor',
    'tinta de cabelo',
    'cobertura de brancos',
    'descoloração',
    'Jotta Lean Cabelos',
  ],
  manifest: '/manifest.webmanifest',
  // Faz o app se comportar como nativo quando salvo na tela inicial (iOS / Android).
  appleWebApp: {
    capable: true,
    title: 'Hair Color Pro',
    statusBarStyle: 'black-translucent', // status bar transparente, conteúdo sobe até o topo
    // startupImage real é declarado no <head> do RootLayout (linha 100+),
    // com 8 resoluções e media queries — Next metadata só aceita 1 sem media.
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    // Apple Touch Icon — iOS Safari exige PNG. Lê EXCLUSIVAMENTE este link.
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  // themeColor por media-query: o navegador escolhe automaticamente conforme
  // o tema atual do <html>. Mantém status bar do PWA sempre alinhada.
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0E0C0B' },
    { media: '(prefers-color-scheme: light)', color: '#FAF6F1' },
  ],
  // colorScheme `light dark` permite ao browser ajustar UI nativa (scrollbar,
  // form controls, autofill) ao tema do app.
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// Splash screens iOS por resolução — sem isso, app instalado mostra
// tela branca por 1-2s antes do JS carregar. Cada link tem media query
// específica pra um modelo de iPhone/iPad.
const APPLE_SPLASH_LINKS: { media: string; href: string }[] = [
  {
    media:
      '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    href: '/splash-iphone-15-pro-max-portrait.png',
  },
  {
    media:
      '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    href: '/splash-iphone-15-pro-portrait.png',
  },
  {
    media:
      '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    href: '/splash-iphone-14-plus-portrait.png',
  },
  {
    media:
      '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    href: '/splash-iphone-15-portrait.png',
  },
  {
    media:
      '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)',
    href: '/splash-iphone-x-portrait.png',
  },
  {
    media:
      '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
    href: '/splash-iphone-se-portrait.png',
  },
  {
    media:
      '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
    href: '/splash-ipad-pro-12-portrait.png',
  },
  {
    media:
      '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)',
    href: '/splash-ipad-pro-11-portrait.png',
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      // Sem `dark` hardcoded: o ThemeProvider (Client Component) adiciona
      // a classe `dark` ou `light` no <html> baseado em preferência salva
      // ou prefers-color-scheme do SO. Default no SSR é dark (storageKey
      // do next-themes resolve antes do paint).
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Apple Splash Screens — uma tag por resolução */}
        {APPLE_SPLASH_LINKS.map((s) => (
          <link key={s.href} rel="apple-touch-startup-image" media={s.media} href={s.href} />
        ))}
      </head>
      <body className="min-h-dvh overscroll-none bg-background text-foreground antialiased">
        <ThemeProvider>
        {/* "Status bar fuse" — faixa sólida fixa no topo do viewport com a
            cor exata do theme_color do manifest (#0E0C0B). Em PWA standalone
            no Android, o Chrome pinta a area da status bar com theme_color e
            o app fica abaixo. Essa div garante que a faixa visualmente
            adjacente NUNCA tenha gradient/Aurora/qualquer cor diferente —
            elimina a "costura" perceptível entre system UI e webview. */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-50"
          style={{
            height: 'max(env(safe-area-inset-top), 8px)',
            backgroundColor: 'var(--color-statusbar)',
          }}
        />
        {children}
        {/* Portão de tela cheia quando sem internet — app é online-only, então
            bloqueia tudo e oferece recuperação real em vez de telas quebradas. */}
        <OfflineGate />
        <Toaster />
        {/* Banner flutuante de instalação — lazy-loaded, não bloqueia first paint */}
        <InstallHintLazy />
        {/* Registra o Service Worker (cliente-only, sem render) — critério de instalabilidade PWA */}
        <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}
