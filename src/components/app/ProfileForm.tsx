'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';
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
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/app/ThemeToggle';

const profileSchema = z.object({
  nome: z.string().min(2, 'Mínimo 2 caracteres').max(80).trim(),
  salao: z.string().max(100).trim().optional(),
});

type ProfileInput = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  userId: string; // Firebase UID
  initialNome: string;
  initialSalao: string;
}

export function ProfileForm({ userId: _userId, initialNome, initialSalao }: ProfileFormProps) {
  const router = useRouter();
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { nome: initialNome, salao: initialSalao },
  });

  const isLoading = form.formState.isSubmitting;

  async function onSubmit(values: ProfileInput) {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: values.nome,
        salao: values.salao ?? null,
      }),
    });

    if (!res.ok) {
      toast.error('Erro ao salvar perfil. Tente novamente.');
      return;
    }

    toast.success('Perfil atualizado!');
    router.refresh();
  }

  async function handleSignOut() {
    // 1. Sign out do Firebase (client-side)
    const auth = getFirebaseAuth();
    await signOut(auth);

    // 2. Apagar o session cookie (server-side)
    await fetch('/api/auth/session', { method: 'DELETE' });

    router.push('/');
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <GlassCard padding="lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome" autoComplete="name" className="h-11" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="salao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salão (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do salão"
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
                  Salvando…
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </form>
        </Form>
      </GlassCard>

      <Separator className="opacity-50" />

      {/* Toggle de tema (Sistema / Claro / Escuro) */}
      <GlassCard padding="md" variant="subtle">
        <ThemeToggle />
      </GlassCard>

      <Button
        variant="outline"
        size="touch"
        className="w-full border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
        onClick={handleSignOut}
      >
        <LogOut aria-hidden="true" />
        Sair da conta
      </Button>
    </div>
  );
}
