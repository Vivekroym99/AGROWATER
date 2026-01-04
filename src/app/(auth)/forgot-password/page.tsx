'use client';

import { useState } from 'react';
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

const forgotPasswordSchema = z.object({
  email: z.string().email(UI_TEXT.errors.invalidEmail),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        { redirectTo: redirectUrl }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError(UI_TEXT.errors.generic);
    }
  };

  if (success) {
    return (
      <Card>
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sprawdz email
          </h1>
          <p className="text-gray-600 mb-6">
            Wyslalismy link do resetowania hasla na podany adres email.
            Link wygasa po 24 godzinach.
          </p>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Powrot do logowania
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
          Resetowanie hasla
        </h1>
        <p className="text-gray-600 mt-1">
          Podaj adres email powiazany z Twoim kontem.
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

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
        >
          Wyslij link resetujacy
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="text-sm text-gray-600 hover:text-gray-800 inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Powrot do logowania
        </Link>
      </div>
    </Card>
  );
}
