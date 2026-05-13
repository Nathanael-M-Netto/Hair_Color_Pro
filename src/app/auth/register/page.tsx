'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { registerSchema, type RegisterInput } from '@/lib/schemas/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
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
 * Tela de cadastro — cria conta no Firebase Auth (projeto arte-de-colorir-cabelos).
 *
 * Fluxo:
 * 1. createUserWithEmailAndPassword — cria a conta no Firebase
 * 2. updateProfile — salva o nome de exibição no Firebase Auth
 * 3. POST /api/auth/session — cria session cookie + perfil no Firestore
 * 4. Redireciona para /scanner
 */
export default function RegisterPage() {
  const router = useRouter();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { nome: '', email: '', password: '', passwordConfirm: '' },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: RegisterInput) {
    const auth = getFirebaseAuth();

    let idToken: string;
    try {
      const credential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(credential.user, { displayName: values.nome });
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
      toast.error('Conta criada, mas houve um erro ao iniciar sessão. Faça login.');
      router.push('/auth/login');
      return;
    }

    toast.success('Conta criada!');
    router.push('/scanner');
    router.refresh();
  }

  return (
    <div className="w-full space-y-4">
      <GlassCard padding="lg" className="w-full">
        <div className="mb-5 text-center">
          <h1 className="text-xl font-semibold">Criar conta</h1>
          <p className="mt-1 text-xs text-muted-foreground">Grátis · sem cartão</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Maria Silva"
                      autoComplete="name"
                      autoCapitalize="words"
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
                    <PasswordInput
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
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
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar senha</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Repita"
                      autoComplete="new-password"
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
                  Criando…
                </>
              ) : (
                <>
                  Criar conta
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </GlassCard>

      <div className="flex items-center gap-3 px-1">
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          ou
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>

      <Button asChild variant="outline" size="touch" className="w-full">
        <Link href="/auth/login" prefetch>
          Já tenho conta
        </Link>
      </Button>
    </div>
  );
}

function traduzirErroFirebase(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'auth/email-already-in-use') return 'Este e-mail já está cadastrado.';
  if (code === 'auth/weak-password') return 'A senha deve ter pelo menos 6 caracteres.';
  if (code === 'auth/invalid-email') return 'E-mail inválido.';
  if (code === 'auth/network-request-failed') return 'Sem conexão. Verifique sua internet.';
  return 'Erro ao criar conta. Tente novamente.';
}
