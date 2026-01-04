'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { UI_TEXT } from '@/lib/constants';
import { CheckCircle, AlertCircle, Lock, Trash2, Bell } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(1, UI_TEXT.errors.required),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    newPassword: z.string().min(8, UI_TEXT.errors.passwordMin),
    confirmPassword: z.string().min(8, UI_TEXT.errors.passwordMin),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Hasła muszą być identyczne',
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, updateProfile, signOut } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setProfileError(null);
    setProfileSuccess(false);

    const result = await updateProfile({
      full_name: data.full_name,
      phone: data.phone || null,
    });

    if (result.error) {
      setProfileError(result.error);
    } else {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordError(null);
    setPasswordSuccess(false);
    setChangingPassword(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: data.newPassword }),
      });

      const result = await response.json();

      if (!response.ok) {
        setPasswordError(result.error || 'Nie udało się zmienić hasła');
      } else {
        setPasswordSuccess(true);
        resetPasswordForm();
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch {
      setPasswordError('Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'USUŃ KONTO') {
      setDeleteError('Wpisz "USUŃ KONTO" aby potwierdzić');
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });

      const result = await response.json();

      if (!response.ok) {
        setDeleteError(result.error || 'Nie udało się usunąć konta');
        setDeleting(false);
        return;
      }

      // Sign out and redirect
      await signOut();
      router.push('/');
    } catch {
      setDeleteError('Wystąpił błąd. Spróbuj ponownie.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">{UI_TEXT.nav.settings}</h1>

      {/* Profile settings */}
      <Card title="Profil">
        {profileSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm">{UI_TEXT.common.success}</p>
          </div>
        )}

        {profileError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{profileError}</p>
          </div>
        )}

        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          <Input
            label={UI_TEXT.auth.fullName}
            error={profileErrors.full_name?.message}
            required
            {...registerProfile('full_name')}
          />

          <Input
            label={UI_TEXT.auth.email}
            type="email"
            value={user?.email || ''}
            disabled
          />

          <Input
            label={UI_TEXT.auth.phone}
            type="tel"
            placeholder="+48 123 456 789"
            error={profileErrors.phone?.message}
            {...registerProfile('phone')}
          />

          <Button type="submit" loading={profileSubmitting}>
            {UI_TEXT.common.save}
          </Button>
        </form>
      </Card>

      {/* Notification settings */}
      <Card title="Powiadomienia">
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-700">
              Ustawienia alertów są konfigurowane dla każdego pola osobno.
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Przejdź do szczegółów pola, aby włączyć/wyłączyć powiadomienia i ustawić próg alertu.
            </p>
          </div>
        </div>
      </Card>

      {/* Password change */}
      <Card title="Zmiana hasła">
        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm">Hasło zostało zmienione</p>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{passwordError}</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            label="Nowe hasło"
            type="password"
            error={passwordErrors.newPassword?.message}
            {...registerPassword('newPassword')}
          />

          <Input
            label="Powtórz nowe hasło"
            type="password"
            error={passwordErrors.confirmPassword?.message}
            {...registerPassword('confirmPassword')}
          />

          <Button type="submit" disabled={changingPassword}>
            {changingPassword ? <Spinner size="sm" /> : <Lock className="h-4 w-4 mr-2" />}
            Zmień hasło
          </Button>
        </form>
      </Card>

      {/* Danger zone - Delete account */}
      <Card
        title="Usuń konto"
        className="border-red-200"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Po usunięciu konta wszystkie Twoje dane (pola, odczyty, alerty) zostaną trwale usunięte.
            Tej operacji nie można cofnąć.
          </p>

          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Usuń moje konto
          </Button>
        </div>
      </Card>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 w-full">
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Czy na pewno chcesz usunąć konto?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną trwale usunięte.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4" />
                <p>{deleteError}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wpisz <span className="font-bold">USUŃ KONTO</span> aby potwierdzić:
              </label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="USUŃ KONTO"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                  setDeleteError(null);
                }}
                disabled={deleting}
              >
                Anuluj
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmation !== 'USUŃ KONTO'}
              >
                {deleting ? <Spinner size="sm" /> : 'Usuń konto'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
