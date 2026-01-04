'use client';

import { useState, useEffect, useCallback } from 'react';
import type { FieldWithStatus, GeoJSONPolygon } from '@/types/database';

interface UseFieldsReturn {
  fields: FieldWithStatus[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createField: (data: CreateFieldData) => Promise<{ data?: FieldWithStatus; error?: string }>;
  updateField: (id: string, data: UpdateFieldData) => Promise<{ data?: FieldWithStatus; error?: string }>;
  deleteField: (id: string) => Promise<{ success?: boolean; error?: string }>;
}

interface CreateFieldData {
  name: string;
  boundary: GeoJSONPolygon;
  crop_type?: string;
  alert_threshold?: number;
  alerts_enabled?: boolean;
}

interface UpdateFieldData {
  name?: string;
  boundary?: GeoJSONPolygon;
  crop_type?: string;
  alert_threshold?: number;
  alerts_enabled?: boolean;
}

export function useFields(): UseFieldsReturn {
  const [fields, setFields] = useState<FieldWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/fields');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch fields');
      }

      setFields(result.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching fields:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const createField = useCallback(async (data: CreateFieldData) => {
    try {
      const response = await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Failed to create field' };
      }

      // Refetch to get the field with status
      await fetchFields();

      return { data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { error: message };
    }
  }, [fetchFields]);

  const updateField = useCallback(async (id: string, data: UpdateFieldData) => {
    try {
      const response = await fetch(`/api/fields/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Failed to update field' };
      }

      // Refetch to get updated data
      await fetchFields();

      return { data: result.data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { error: message };
    }
  }, [fetchFields]);

  const deleteField = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/fields/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: result.error || 'Failed to delete field' };
      }

      // Remove from local state
      setFields((prev) => prev.filter((f) => f.id !== id));

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { error: message };
    }
  }, []);

  return {
    fields,
    loading,
    error,
    refetch: fetchFields,
    createField,
    updateField,
    deleteField,
  };
}

// Hook for fetching a single field
export function useField(id: string) {
  const [field, setField] = useState<FieldWithStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchField = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/fields/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch field');
      }

      setField(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching field:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchField();
  }, [fetchField]);

  return {
    field,
    loading,
    error,
    refetch: fetchField,
  };
}
