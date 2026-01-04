'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFields } from '@/hooks/useFields';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldCard } from '@/components/fields/FieldCard';
import { Spinner } from '@/components/ui/Spinner';
import { UI_TEXT } from '@/lib/constants';
import { Map, Plus, Droplets, AlertTriangle, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const { fields, loading, error } = useFields();

  // Calculate stats from real field data
  const stats = useMemo(() => {
    const totalFields = fields.length;
    const totalArea = fields.reduce((sum, f) => sum + (f.area_hectares || 0), 0);
    const fieldsOk = fields.filter((f) => f.status === 'good').length;
    const fieldsWarning = fields.filter(
      (f) => f.status === 'warning' || f.status === 'critical'
    ).length;

    return {
      totalFields,
      totalArea: Math.round(totalArea * 100) / 100,
      fieldsOk,
      fieldsWarning,
    };
  }, [fields]);

  const handleFieldClick = (id: string) => {
    router.push(`/fields/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {UI_TEXT.dashboard.title}
          </h1>
          <p className="text-gray-600 mt-1">
            Witaj, {profile?.full_name || 'Uzytkowniku'}!
          </p>
        </div>
        <Link href="/fields/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {UI_TEXT.fields.add}
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Map className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFields}</p>
              <p className="text-sm text-gray-600">{UI_TEXT.dashboard.totalFields}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Droplets className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalArea} ha</p>
              <p className="text-sm text-gray-600">{UI_TEXT.dashboard.totalArea}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Droplets className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.fieldsOk}</p>
              <p className="text-sm text-gray-600">{UI_TEXT.dashboard.fieldsOk}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.fieldsWarning}</p>
              <p className="text-sm text-gray-600">{UI_TEXT.dashboard.needsAttention}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Empty state - shown when user has no fields */}
      {!loading && !error && fields.length === 0 && (
        <Card className="text-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Map className="h-12 w-12 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {UI_TEXT.dashboard.noFields}
              </h3>
              <p className="text-gray-600 mt-1">
                {UI_TEXT.dashboard.addFirst}
              </p>
            </div>
            <Link href="/fields/new">
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                {UI_TEXT.fields.add}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Fields list - shown when user has fields */}
      {!loading && !error && fields.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {UI_TEXT.fields.title}
            </h2>
            <Link href="/fields" className="text-sm text-blue-600 hover:text-blue-700">
              {UI_TEXT.fields.viewAll}
            </Link>
          </div>
          <div className="grid gap-4">
            {fields.slice(0, 5).map((field) => (
              <FieldCard
                key={field.id}
                field={{
                  id: field.id,
                  name: field.name,
                  area_hectares: field.area_hectares,
                  crop_type: field.crop_type,
                  current_moisture: field.current_moisture,
                  status: field.status,
                  last_reading_date: field.last_reading_date,
                }}
                onClick={handleFieldClick}
              />
            ))}
          </div>
          {fields.length > 5 && (
            <div className="text-center">
              <Link href="/fields">
                <Button variant="outline">
                  {UI_TEXT.fields.viewAll} ({fields.length})
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
