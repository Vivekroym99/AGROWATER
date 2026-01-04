'use client';

import { useState, useEffect } from 'react';
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
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(8, UI_TEXT.errors.passwordMin),
  confirmPassword: z.string().min(1, UI_TEXT.errors.required),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Hasla nie sa identyczne',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      // User should have a session from the recovery link
      setIsValidSession(!!session);
    };

    checkSession();
  }, []);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (updateError) {
        if (updateError.message.includes('same password')) {
          setError('Nowe haslo musi byc inne niz poprzednie.');
        } else {
          setError(updateError.message);
        }
        return;
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch {
      setError(UI_TEXT.errors.generic);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Weryfikacja...</p>
        </div>
      </Card>
    );
  }

  // Invalid or expired link
  if (!isValidSession) {
    return (
      <Card>
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Link wygasl
          </h1>
          <p className="text-gray-600 mb-6">
            Ten link do resetowania hasla jest nieprawidlowy lub wygasl.
            Popros o nowy link.
          </p>
          <Link href="/forgot-password">
            <Button className="w-full">
              Popros o nowy link
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Haslo zmienione!
          </h1>
          <p className="text-gray-600 mb-6">
            Twoje haslo zostalo pomyslnie zmienione.
            Za chwile zostaniesz przekierowany do strony logowania.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Przejdz do logowania
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Ustaw nowe haslo
        </h1>
        <p className="text-gray-600 mt-1">
          Wprowadz nowe haslo dla swojego konta.
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
          label="Nowe haslo"
          type="password"
          placeholder="Minimum 8 znakow"
          error={errors.password?.message}
          required
          {...register('password')}
        />

        <Input
          label="Potwierdz haslo"
          type="password"
          placeholder="Powtorz nowe haslo"
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
        >
          Zmien haslo
        </Button>
      </form>
    </Card>
  );
}
