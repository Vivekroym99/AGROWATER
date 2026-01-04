'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFields } from '@/hooks/useFields';
import { FieldsOverviewMap } from '@/components/map';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { UI_TEXT, STATUS_COLORS, CROP_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';
import {
  Map,
  Plus,
  List,
  LayoutGrid,
  Droplets,
  AlertTriangle,
  AlertCircle,
  Filter,
} from 'lucide-react';
import type { MoistureStatus } from '@/types/database';

type ViewMode = 'map' | 'list';
type StatusFilter = MoistureStatus | 'all';

export default function OverviewPage() {
  const router = useRouter();
  const { fields, loading, error } = useFields();
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredFields = useMemo(() => {
    if (statusFilter === 'all') return fields;
    return fields.filter((f) => f.status === statusFilter);
  }, [fields, statusFilter]);

  const stats = useMemo(() => {
    const totalFields = fields.length;
    const totalArea = fields.reduce((sum, f) => sum + (f.area_hectares || 0), 0);
    const byStatus = {
      good: fields.filter((f) => f.status === 'good').length,
      warning: fields.filter((f) => f.status === 'warning').length,
      critical: fields.filter((f) => f.status === 'critical').length,
      unknown: fields.filter((f) => f.status === 'unknown').length,
    };

    return { totalFields, totalArea, byStatus };
  }, [fields]);

  const handleFieldClick = (fieldId: string) => {
    router.push(`/fields/${fieldId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Przeglad pol</h1>
          <p className="text-gray-600 mt-1">
            Wszystkie pola na jednej mapie
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
                viewMode === 'map'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <Map className="h-4 w-4" />
              Mapa
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1',
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
          </div>
          <Link href="/fields/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {UI_TEXT.fields.add}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.totalFields}</p>
              <p className="text-xs text-gray-500">Pol</p>
            </div>
          </div>
        </Card>
        <Card className="!p-3">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.totalArea.toFixed(1)} ha</p>
              <p className="text-xs text-gray-500">Powierzchnia</p>
            </div>
          </div>
        </Card>
        <button
          onClick={() => setStatusFilter(statusFilter === 'good' ? 'all' : 'good')}
          className={cn(
            'text-left rounded-lg border p-3 transition-colors',
            statusFilter === 'good' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:bg-gray-50'
          )}
        >
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.byStatus.good}</p>
              <p className="text-xs text-gray-500">W normie</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'warning' ? 'all' : 'warning')}
          className={cn(
            'text-left rounded-lg border p-3 transition-colors',
            statusFilter === 'warning' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 bg-white hover:bg-gray-50'
          )}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.byStatus.warning}</p>
              <p className="text-xs text-gray-500">Monitoruj</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'critical' ? 'all' : 'critical')}
          className={cn(
            'text-left rounded-lg border p-3 transition-colors',
            statusFilter === 'critical' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:bg-gray-50'
          )}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.byStatus.critical}</p>
              <p className="text-xs text-gray-500">Uwaga!</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filter indicator */}
      {statusFilter !== 'all' && (
        <div className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-gray-600">
            Filtr: {statusFilter === 'good' ? 'W normie' : statusFilter === 'warning' ? 'Monitoruj' : statusFilter === 'critical' ? 'Uwaga!' : 'Brak danych'}
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className="text-blue-600 hover:text-blue-700"
          >
            Wyczysc
          </button>
        </div>
      )}

      {/* Empty State */}
      {fields.length === 0 && (
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

      {/* Map View */}
      {fields.length > 0 && viewMode === 'map' && (
        <div className="relative">
          <FieldsOverviewMap
            fields={filteredFields}
            onFieldClick={handleFieldClick}
            height={600}
          />
        </div>
      )}

      {/* List View */}
      {fields.length > 0 && viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Nazwa</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600 hidden sm:table-cell">Uprawa</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Powierzchnia</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Wilgotnosc</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFields.map((field) => {
                const statusColors = STATUS_COLORS[field.status];
                const cropLabel = CROP_TYPES.find((c) => c.value === field.crop_type)?.label || field.crop_type || '-';

                return (
                  <tr
                    key={field.id}
                    onClick={() => handleFieldClick(field.id)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{field.name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{cropLabel}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {field.area_hectares?.toFixed(2) || '-'} ha
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('font-medium', statusColors.text)}>
                        {field.current_moisture !== null
                          ? `${Math.round(field.current_moisture * 100)}%`
                          : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          statusColors.bg,
                          statusColors.text
                        )}
                      >
                        {UI_TEXT.status[field.status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
