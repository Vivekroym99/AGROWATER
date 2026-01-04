'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TimeRange } from '@/components/charts/TimeRangeSelector';

interface MoistureReading {
  id: string;
  observation_date: string;
  moisture_index: number;
  vv_backscatter: number | null;
  vh_backscatter: number | null;
  source: string;
  created_at: string;
}

interface UseMoistureHistoryResult {
  readings: MoistureReading[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMoistureHistory(
  fieldId: string | null,
  days: TimeRange = 30
): UseMoistureHistoryResult {
  const [readings, setReadings] = useState<MoistureReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!fieldId) {
      setReadings([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error: fetchError } = await supabase
        .from('moisture_readings')
        .select('*')
        .eq('field_id', fieldId)
        .gte('observation_date', startDate.toISOString().split('T')[0])
        .lte('observation_date', endDate.toISOString().split('T')[0])
        .order('observation_date', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      setReadings(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Błąd pobierania danych';
      setError(message);
      setReadings([]);
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
    refetch: fetchHistory,
  };
}
