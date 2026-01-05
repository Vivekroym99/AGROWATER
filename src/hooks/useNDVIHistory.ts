'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TimeRange } from '@/components/charts/TimeRangeSelector';
import type { NDVIReading, VegetationStatus } from '@/types/database';
import type { VegetationStats } from '@/lib/agroapi';

interface UseNDVIHistoryResult {
  readings: NDVIReading[];
  loading: boolean;
  error: string | null;
  configured: boolean;
  needsSync: boolean;
  syncStatus: string;
  stats: VegetationStats | null;
  currentNDVI: number | null;
  currentStatus: VegetationStatus;
  refetch: () => Promise<void>;
}

export function useNDVIHistory(
  fieldId: string | null,
  days: TimeRange = 30
): UseNDVIHistoryResult {
  const [readings, setReadings] = useState<NDVIReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [needsSync, setNeedsSync] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('unknown');
  const [stats, setStats] = useState<VegetationStats | null>(null);
  const [currentNDVI, setCurrentNDVI] = useState<number | null>(null);
  const [currentStatus, setCurrentStatus] = useState<VegetationStatus>('unknown');

  const fetchHistory = useCallback(async () => {
    if (!fieldId) {
      setReadings([]);
      setStats(null);
      setCurrentNDVI(null);
      setCurrentStatus('unknown');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ndvi/${fieldId}?days=${days}`);
      const data = await response.json();

      if (!response.ok) {
        // Check if it's a configuration issue
        if (data.configured === false) {
          setConfigured(false);
          setError(null);
          setReadings([]);
          return;
        }

        throw new Error(data.error || 'Blad pobierania danych NDVI');
      }

      setConfigured(true);
      setReadings(data.readings || []);
      setStats(data.stats || null);
      setCurrentNDVI(data.currentNDVI ?? null);
      setCurrentStatus(data.currentStatus || 'unknown');
      setNeedsSync(data.needsSync || false);
      setSyncStatus(data.syncStatus || 'unknown');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Blad pobierania danych NDVI';
      setError(message);
      setReadings([]);
      setStats(null);
      setCurrentNDVI(null);
      setCurrentStatus('unknown');
    } finally {
      setLoading(false);
    }
  }, [fieldId, days]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    readings,
    loading,
    error,
    configured,
    needsSync,
    syncStatus,
    stats,
    currentNDVI,
    currentStatus,
    refetch: fetchHistory,
  };
}
