'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldCard } from '@/components/fields/FieldCard';
import { Spinner } from '@/components/ui/Spinner';
import { UI_TEXT } from '@/lib/constants';
import { useFields } from '@/hooks/useFields';
import { Plus, Map, AlertCircle } from 'lucide-react';

export default function FieldsPage() {
  const router = useRouter();
  const { fields, loading, error } = useFields();

  const handleFieldClick = (id: string) => {
    router.push(`/fields/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {UI_TEXT.fields.title}
          </h1>
        </div>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          {UI_TEXT.fields.title}
        </h1>
        <Link href="/fields/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {UI_TEXT.fields.add}
          </Button>
        </Link>
      </div>

      {/* Fields list or empty state */}
      {fields.length === 0 ? (
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
      ) : (
        <div className="grid gap-4">
          {fields.map((field) => (
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
      )}
    </div>
  );
}
