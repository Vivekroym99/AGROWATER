'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@/components/ui/Spinner';

// Dynamic import for MapContainer to avoid SSR issues with Leaflet
export const MapContainer = dynamic(
  () => import('./MapContainer').then((mod) => mod.MapContainer),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
  }
);

// Dynamic import for DrawingMapContent
export const DrawingMapContent = dynamic(
  () => import('./DrawingMap').then((mod) => mod.DrawingMapContent),
  {
    ssr: false,
    loading: () => null,
  }
);

// Dynamic import for FieldsOverviewMap
export const FieldsOverviewMap = dynamic(
  () => import('./FieldsOverviewMap').then((mod) => mod.FieldsOverviewMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
  }
);

// Dynamic import for SatelliteMap
export const SatelliteMap = dynamic(
  () => import('./SatelliteMap').then((mod) => mod.SatelliteMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] w-full bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
  }
);
