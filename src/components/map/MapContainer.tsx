'use client';

import { useEffect, useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';
import { MAP_CONFIG } from '@/lib/constants';
import { Spinner } from '@/components/ui/Spinner';
import 'leaflet/dist/leaflet.css';

interface MapContainerProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
}

export function MapContainer({
  center = MAP_CONFIG.defaultCenter,
  zoom = MAP_CONFIG.defaultZoom,
  className = 'h-[500px] w-full',
  children,
}: MapContainerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <LeafletMapContainer
      center={center}
      zoom={zoom}
      className={`${className} rounded-lg z-0`}
      scrollWheelZoom={true}
      maxZoom={MAP_CONFIG.maxZoom}
    >
      <TileLayer
        attribution={MAP_CONFIG.attribution}
        url={MAP_CONFIG.tileUrl}
      />
      {children}
    </LeafletMapContainer>
  );
}
