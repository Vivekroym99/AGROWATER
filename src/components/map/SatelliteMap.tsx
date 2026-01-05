'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, useMap } from 'react-leaflet';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { useLocale } from '@/i18n';
import { useSatelliteImages } from '@/hooks/useSatelliteImages';
import { getTileUrlWithApiKey, getMaxZoomForSource } from '@/lib/agroapi';
import type { SatellitePreset, SatelliteImage } from '@/lib/agroapi';
import type { GeoJSONPolygon } from '@/types/database';
import { MAP_CONFIG } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils/cn';

import 'leaflet/dist/leaflet.css';

interface SatelliteMapProps {
  fieldId: string;
  boundary: GeoJSONPolygon | null;
  onSyncRequest?: () => void;
  className?: string;
}

const dateLocales = { pl, en: enUS };

// Component to fit bounds to polygon
function FitBounds({ boundary }: { boundary: GeoJSONPolygon }) {
  const map = useMap();

  useMemo(() => {
    if (boundary?.coordinates?.[0]) {
      const coords = boundary.coordinates[0].map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      if (coords.length > 0) {
        map.fitBounds(coords, { padding: [20, 20] });
      }
    }
  }, [map, boundary]);

  return null;
}

// Satellite layer selector component
function LayerSelector({
  selectedPreset,
  onSelectPreset,
}: {
  selectedPreset: SatellitePreset;
  onSelectPreset: (preset: SatellitePreset) => void;
}) {
  const t = useTranslations('satellite');

  const presets: { value: SatellitePreset; label: string }[] = [
    { value: 'truecolor', label: t('layerTrueColor') },
    { value: 'falsecolor', label: t('layerFalseColor') },
    { value: 'ndvi', label: t('layerNdvi') },
    { value: 'evi', label: t('layerEvi') },
  ];

  return (
    <div className="flex flex-wrap gap-1">
      {presets.map((preset) => (
        <button
          key={preset.value}
          onClick={() => onSelectPreset(preset.value)}
          className={cn(
            'px-2 py-1 text-xs rounded-md transition-colors',
            selectedPreset === preset.value
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

// Image date selector component
function ImageSelector({
  images,
  selectedImage,
  onSelectImage,
}: {
  images: SatelliteImage[];
  selectedImage: SatelliteImage | null;
  onSelectImage: (image: SatelliteImage) => void;
}) {
  const t = useTranslations('satellite');
  const locale = useLocale();
  const dateLocale = dateLocales[locale as keyof typeof dateLocales] || enUS;

  if (images.length === 0) {
    return (
      <span className="text-sm text-gray-500 dark:text-gray-400">
        {t('noImages')}
      </span>
    );
  }

  return (
    <select
      value={selectedImage?.id || ''}
      onChange={(e) => {
        const image = images.find((img) => img.id === e.target.value);
        if (image) onSelectImage(image);
      }}
      className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    >
      {images.map((image) => (
        <option key={image.id} value={image.id}>
          {format(new Date(image.date), 'd MMM yyyy', { locale: dateLocale })} - {image.source} ({image.cloudCoverage}% cloud)
        </option>
      ))}
    </select>
  );
}

export function SatelliteMap({
  fieldId,
  boundary,
  onSyncRequest,
  className,
}: SatelliteMapProps) {
  const t = useTranslations('satellite');
  const {
    images,
    selectedImage,
    selectedPreset,
    loading,
    configured,
    needsSync,
    selectImage,
    selectPreset,
  } = useSatelliteImages(fieldId);

  // Convert GeoJSON to Leaflet positions
  const polygonPositions = useMemo(() => {
    if (!boundary?.coordinates?.[0]) return [];
    return boundary.coordinates[0].map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );
  }, [boundary]);

  // Get tile URL for current selection
  const tileUrl = useMemo(() => {
    if (!selectedImage) return null;
    const presetUrl = selectedImage.tileUrls[selectedPreset];
    return getTileUrlWithApiKey(presetUrl);
  }, [selectedImage, selectedPreset]);

  const maxZoom = selectedImage ? getMaxZoomForSource(selectedImage.source) : 14;

  // Show not configured state
  if (!configured) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('title')}
        </h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">
            Agro API not configured
          </p>
        </div>
      </div>
    );
  }

  // Show needs sync state
  if (needsSync) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('title')}
        </h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {t('notSynced')}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
            {t('syncFirst')}
          </p>
          {onSyncRequest && (
            <Button
              variant="primary"
              size="sm"
              onClick={onSyncRequest}
            >
              Sync with Agro API
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6', className)}>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('title')}
        </h2>
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="ml-3 text-gray-500 dark:text-gray-400">{t('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden', className)}>
      {/* Header with controls */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('title')}
          </h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <ImageSelector
              images={images}
              selectedImage={selectedImage}
              onSelectImage={selectImage}
            />
          </div>
        </div>
        <div className="mt-3">
          <LayerSelector
            selectedPreset={selectedPreset}
            onSelectPreset={selectPreset}
          />
        </div>
        {selectedImage && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {t('source')}: {selectedImage.source} | {t('cloudCoverage')}: {selectedImage.cloudCoverage}%
          </div>
        )}
      </div>

      {/* Map */}
      <div className="h-[400px]">
        <MapContainer
          center={MAP_CONFIG.defaultCenter}
          zoom={12}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          {/* Base OSM layer */}
          <TileLayer
            url={MAP_CONFIG.tileUrl}
            attribution={MAP_CONFIG.attribution}
          />

          {/* Satellite imagery layer */}
          {tileUrl && (
            <TileLayer
              url={tileUrl}
              maxZoom={maxZoom}
              opacity={0.9}
            />
          )}

          {/* Field boundary overlay */}
          {polygonPositions.length > 0 && (
            <Polygon
              positions={polygonPositions}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillOpacity: 0,
                dashArray: '5, 5',
              }}
            />
          )}

          {/* Fit map to boundary */}
          {boundary && <FitBounds boundary={boundary} />}
        </MapContainer>
      </div>

      {/* No images message */}
      {images.length === 0 && !loading && (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          <p>{t('noImages')}</p>
        </div>
      )}
    </div>
  );
}
