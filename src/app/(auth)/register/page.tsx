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
import { CheckCircle, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().email(UI_TEXT.errors.invalidEmail),
  password: z.string().min(8, UI_TEXT.errors.passwordMin),
  fullName: z.string().min(1, UI_TEXT.errors.required),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: UI_TEXT.errors.required,
  }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);

    try {
      const supabase = createClient();

      const { error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            phone: data.phone || null,
          },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          setError('Ten adres email jest juz zarejestrowany.');
        } else {
          setError(signUpError.message);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setError(UI_TEXT.errors.generic);
    }
  };

  if (success) {
    return (
      <Card className="text-center">
        <div className="flex flex-col items-center gap-4 py-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            Rejestracja pomyslna!
          </h2>
          <p className="text-gray-600">
            {UI_TEXT.auth.checkEmail}
          </p>
          <Link href="/login">
            <Button variant="secondary">
              {UI_TEXT.auth.login}
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
          {UI_TEXT.auth.register}
        </h1>
        <p className="text-gray-600 mt-1">
          Utworz konto, aby monitorowac swoje pola
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
          placeholder="Minimum 8 znakow"
          error={errors.password?.message}
          required
          {...register('password')}
        />

        <Input
          label={UI_TEXT.auth.fullName}
          type="text"
          placeholder="Jan Kowalski"
          error={errors.fullName?.message}
          required
          {...register('fullName')}
        />

        <Input
          label={UI_TEXT.auth.phone}
          type="tel"
          placeholder="+48 123 456 789"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="acceptTerms"
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            {...register('acceptTerms')}
          />
          <label htmlFor="acceptTerms" className="text-sm text-gray-700">
            {UI_TEXT.auth.acceptTerms}
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
        >
          {UI_TEXT.auth.register}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        {UI_TEXT.auth.hasAccount}{' '}
        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
          {UI_TEXT.auth.login}
        </Link>
      </div>
    </Card>
  );
}
