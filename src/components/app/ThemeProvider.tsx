'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

/**
 * Wrapper do next-themes — adiciona/remove classes `dark` ou `light` no `<html>`
 * e persiste preferência em localStorage.
 *
 * Configuração:
 *   - attribute='class'  → usa `className` (combina com Tailwind dark: variants)
 *   - defaultTheme='system' → usa prefers-color-scheme do OS
 *   - enableSystem  → respeita mudança no SO em tempo real
 *   - disableTransitionOnChange → evita flash de cor ao trocar tema
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
