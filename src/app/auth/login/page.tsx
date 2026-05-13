'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { loginSchema, type LoginInput } from '@/lib/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { GlassCard } from '@/components/glass/GlassCard';

/**
 * Tela de login — usa Firebase Auth (projeto arte-de-colorir-cabelos).
 * Usuários do app Flutter podem fazer login aqui sem re-cadastro.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/scanner';

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: LoginInput) {
    const auth = getFirebaseAuth();

    let idToken: string;
    try {
      const credential = await signInWithEmailAndPassword(auth, values.email, values.password);
      idToken = await credential.user.getIdToken();
    } catch (err) {
      toast.error(traduzirErroFirebase(err));
      return;
    }

    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });

    if (!res.ok) {
      toast.error('Erro ao iniciar sessão. Tente novamente.');
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full space-y-4">
      <GlassCard padding="lg" className="w-full">
        <div className="mb-5 text-center">
          <h1 className="text-xl font-semibold">Entrar</h1>
          <p className="mt-1 text-xs text-muted-foreground">Bem-vindo de volta</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      autoComplete="email"
                      autoCapitalize="none"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••"
                      autoComplete="current-password"
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" size="touch" className="mt-2 w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" />
                  Entrando…
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </GlassCard>

      {/* CTA secundário — claramente um botão, não um link de texto */}
      <div className="flex items-center gap-3 px-1">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          ou
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      <Button asChild variant="outline" size="touch" className="w-full">
        <Link href="/auth/register" prefetch>
          Criar conta gratuita
        </Link>
      </Button>
    </div>
  );
}

/** Traduz erros do Firebase Auth para PT-BR legíveis */
function traduzirErroFirebase(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/user-not-found' ||
    code === 'auth/wrong-password'
  )
    return 'E-mail ou senha incorretos.';
  if (code === 'auth/user-disabled') return 'Esta conta foi desativada.';
  if (code === 'auth/too-many-requests')
    return 'Muitas tentativas. Aguarde alguns minutos ou redefina sua senha.';
  if (code === 'auth/network-request-failed') return 'Sem conexão. Verifique sua internet.';
  return 'Erro ao entrar. Tente novamente.';
}
