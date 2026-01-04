'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapContainer, DrawingMapContent } from '@/components/map';
import { FieldForm, type FieldFormData } from '@/components/fields/FieldForm';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UI_TEXT } from '@/lib/constants';
import { useFields } from '@/hooks/useFields';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { GeoJSONPolygon } from '@/types/database';

export default function NewFieldPage() {
  const router = useRouter();
  const { createField } = useFields();
  const [polygon, setPolygon] = useState<GeoJSONPolygon | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePolygonChange = (newPolygon: GeoJSONPolygon | null) => {
    setPolygon(newPolygon);
  };

  const handleSubmit = async (data: FieldFormData) => {
    if (!polygon) {
      setError('Narysuj granice pola na mapie.');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createField({
      name: data.name,
      boundary: polygon,
      crop_type: data.crop_type || undefined,
      alert_threshold: data.alert_threshold,
      alerts_enabled: data.alerts_enabled,
    });

    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Redirect to fields list on success
    router.push('/fields');
  };

  const handleCancel = () => {
    router.push('/fields');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/fields">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {UI_TEXT.fields.back}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {UI_TEXT.fields.addNew}
          </h1>
          <p className="text-gray-600 mt-1">
            {UI_TEXT.map.instructions}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Map and form layout */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Map area - 60% */}
        <div className="lg:col-span-3">
          <Card className="p-0 overflow-hidden">
            <MapContainer className="h-[500px] w-full rounded-lg">
              <DrawingMapContent
                onPolygonChange={handlePolygonChange}
              />
            </MapContainer>
          </Card>
        </div>

        {/* Form area - 40% */}
        <div className="lg:col-span-2">
          <Card title="Szczegoly pola">
            <FieldForm
              polygon={polygon}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
