'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SatelliteImage, SatellitePreset } from '@/lib/agroapi';

interface SatelliteImagesResponse {
  fieldId: string;
  fieldName: string;
  images: SatelliteImage[];
  totalImages: number;
  filteredCount: number;
  needsSync: boolean;
  syncStatus: string;
  agroPolygonId?: string;
  configured: boolean;
  error?: string;
}

interface UseSatelliteImagesReturn {
  images: SatelliteImage[];
  selectedImage: SatelliteImage | null;
  selectedPreset: SatellitePreset;
  loading: boolean;
  error: string | null;
  configured: boolean;
  needsSync: boolean;
  syncStatus: string;
  agroPolygonId: string | null;
  selectImage: (image: SatelliteImage | null) => void;
  selectPreset: (preset: SatellitePreset) => void;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage satellite images for a field
 * @param fieldId - The field ID
 * @param days - Number of days to look back (default: 30)
 */
export function useSatelliteImages(
  fieldId: string | undefined,
  days: number = 30
): UseSatelliteImagesReturn {
  const [images, setImages] = useState<SatelliteImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<SatelliteImage | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<SatellitePreset>('ndvi');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [needsSync, setNeedsSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState('unknown');
  const [agroPolygonId, setAgroPolygonId] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    if (!fieldId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/satellite/${fieldId}?days=${days}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 503 && errorData.configured === false) {
          setConfigured(false);
          setImages([]);
          return;
        }
        throw new Error(errorData.error || 'Failed to fetch satellite images');
      }

      const data: SatelliteImagesResponse = await response.json();

      setConfigured(data.configured);
      setNeedsSync(data.needsSync);
      setSyncStatus(data.syncStatus);
      setAgroPolygonId(data.agroPolygonId || null);
      setImages(data.images || []);

      // Auto-select the most recent image if none selected
      if (data.images && data.images.length > 0 && !selectedImage) {
        setSelectedImage(data.images[0]);
      }
    } catch (err) {
      console.error('Error fetching satellite images:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [fieldId, days, selectedImage]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const selectImage = useCallback((image: SatelliteImage | null) => {
    setSelectedImage(image);
  }, []);

  const selectPreset = useCallback((preset: SatellitePreset) => {
    setSelectedPreset(preset);
  }, []);

  return {
    images,
    selectedImage,
    selectedPreset,
    loading,
    error,
    configured,
    needsSync,
    syncStatus,
    agroPolygonId,
    selectImage,
    selectPreset,
    refetch: fetchImages,
  };
}
