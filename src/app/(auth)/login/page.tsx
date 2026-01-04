'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { UI_TEXT } from '@/lib/constants';
import { AlertCircle } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email(UI_TEXT.errors.invalidEmail),
  password: z.string().min(1, UI_TEXT.errors.required),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Nieprawidlowy email lub haslo.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Email nie zostal potwierdzony. Sprawdz swoja skrzynke.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      // Redirect to dashboard on successful login
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError(UI_TEXT.errors.generic);
    }
  };

  return (
    <Card>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {UI_TEXT.auth.login}
        </h1>
        <p className="text-gray-600 mt-1">
          Witaj ponownie! Zaloguj sie do swojego konta.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label={UI_TEXT.auth.email}
          type="email"
          placeholder="jan@example.com"
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <Input
          label={UI_TEXT.auth.password}
          type="password"
          placeholder="Wprowadz haslo"
          error={errors.password?.message}
          required
          {...register('password')}
        />

        <div className="flex items-center justify-end">
          <button
            type="button"
            className="text-sm text-gray-500 cursor-not-allowed"
            disabled
            title="Funkcja w przygotowaniu"
          >
            {UI_TEXT.auth.forgotPassword}
          </button>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
        >
          {UI_TEXT.auth.login}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        {UI_TEXT.auth.noAccount}{' '}
        <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
          {UI_TEXT.auth.register}
        </Link>
      </div>
    </Card>
  );
}
