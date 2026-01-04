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
