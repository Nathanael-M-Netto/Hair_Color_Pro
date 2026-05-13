'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Barra de navegação inferior — fixa, glass-strong.
 *
 * Convenção iOS/Android: tab bar com ícone + label, mínimo 44px tátil
 * por item (WCAG 2.5.5). O item ativo recebe uma pílula sutil de fundo +
 * cor primária no ícone — diferenciação visual mais forte que só cor.
 */
const navItems = [
  { href: '/scanner', label: 'Scanner', Icon: Camera },
  { href: '/history', label: 'Histórico', Icon: Clock },
  { href: '/profile', label: 'Perfil', Icon: User },
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav
      // `app-nav-marker` é usado pelo InstallHint pra detectar via
      // CSS selector quando a AppNav está presente e subir o banner.
      data-app-nav-marker
      aria-label="Navegação principal"
      className={cn(
        'app-nav-marker fixed inset-x-0 bottom-0 z-40',
        'glass-strong border-t border-border/60',
        // Respeita o home indicator no iPhone
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <ul className="flex items-stretch justify-around px-2 pt-1.5 pb-1">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                prefetch
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group relative mx-auto flex h-12 w-full max-w-[88px] flex-col items-center justify-center gap-0.5 rounded-2xl transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  'active:scale-95',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground/80',
                )}
              >
                {/* Pílula ativa — fundo sutil que evidencia a aba selecionada */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -z-0 rounded-2xl bg-primary/10 ring-1 ring-primary/20"
                  />
                )}
                <Icon
                  className={cn(
                    'relative z-10 h-5 w-5 transition-transform duration-200',
                    isActive && 'scale-110',
                  )}
                  aria-hidden="true"
                />
                <span className="relative z-10 font-mono text-[9px] uppercase tracking-widest">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
