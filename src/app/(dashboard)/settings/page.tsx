'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCircle, AlertCircle, Lock, Trash2, Bell } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const t = useTranslations();
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

  // Dynamic schema with translations
  const profileSchema = z.object({
    full_name: z.string().min(1, t('errors.required')),
    phone: z.string().optional(),
  });

  const passwordSchema = z
    .object({
      newPassword: z.string().min(8, t('errors.passwordMin')),
      confirmPassword: z.string().min(8, t('errors.passwordMin')),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('settings.passwordMismatch'),
      path: ['confirmPassword'],
    });

  type ProfileFormData = z.infer<typeof profileSchema>;
  type PasswordFormData = z.infer<typeof passwordSchema>;

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
        setPasswordError(result.error || t('settings.passwordChangeError'));
      } else {
        setPasswordSuccess(true);
        resetPasswordForm();
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch {
      setPasswordError(t('errors.generic'));
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteConfirmText = t('settings.deleteConfirmText');

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== deleteConfirmText) {
      setDeleteError(t('settings.deleteConfirmLabel'));
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
        setDeleteError(result.error || t('settings.deleteError'));
        setDeleting(false);
        return;
      }

      // Sign out and redirect
      await signOut();
      router.push('/');
    } catch {
      setDeleteError(t('errors.generic'));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>

      {/* Profile settings */}
      <Card title={t('settings.profile')}>
        {profileSuccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm">{t('common.success')}</p>
          </div>
        )}

        {profileError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{profileError}</p>
          </div>
        )}

        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          <Input
            label={t('auth.fullName')}
            error={profileErrors.full_name?.message}
            required
            {...registerProfile('full_name')}
          />

          <Input
            label={t('auth.email')}
            type="email"
            value={user?.email || ''}
            disabled
          />

          <Input
            label={t('auth.phone')}
            type="tel"
            placeholder="+48 123 456 789"
            error={profileErrors.phone?.message}
            {...registerProfile('phone')}
          />

          <Button type="submit" loading={profileSubmitting}>
            {t('common.save')}
          </Button>
        </form>
      </Card>

      {/* Notification settings */}
      <Card title={t('settings.notifications')}>
        <div className="flex items-start gap-3">
          <Bell className="h-5 w-5 text-gray-400 mt-0.5" />
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('settings.notificationsInfo')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('settings.notificationsHint')}
            </p>
          </div>
        </div>
      </Card>

      {/* Password change */}
      <Card title={t('settings.changePassword')}>
        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <p className="text-sm">{t('settings.passwordChanged')}</p>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{passwordError}</p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
          <Input
            label={t('settings.newPassword')}
            type="password"
            error={passwordErrors.newPassword?.message}
            {...registerPassword('newPassword')}
          />

          <Input
            label={t('settings.confirmPassword')}
            type="password"
            error={passwordErrors.confirmPassword?.message}
            {...registerPassword('confirmPassword')}
          />

          <Button type="submit" disabled={changingPassword}>
            {changingPassword ? <Spinner size="sm" /> : <Lock className="h-4 w-4 mr-2" />}
            {t('settings.changePasswordBtn')}
          </Button>
        </form>
      </Card>

      {/* Danger zone - Delete account */}
      <Card
        title={t('settings.deleteAccount')}
        className="border-red-200 dark:border-red-800"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('settings.deleteAccountWarning')}
          </p>

          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('settings.deleteMyAccount')}
          </Button>
        </div>
      </Card>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 w-full">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
              {t('settings.deleteConfirmTitle')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              {t('settings.deleteConfirmWarning')}
            </p>

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <p>{deleteError}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('settings.deleteConfirmLabel')}
              </label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={t('settings.deleteConfirmPlaceholder')}
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
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmation !== deleteConfirmText}
              >
                {deleting ? <Spinner size="sm" /> : t('settings.deleteAccount')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
