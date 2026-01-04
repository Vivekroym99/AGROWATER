'use client';

import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Download, FileText, Table, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  downloadCSV,
  generateFieldsCSV,
  generateMoistureHistoryCSV,
  openPrintableReport,
} from '@/lib/export';
import type { FieldWithStatus, MoistureReading } from '@/types/database';

interface ExportMenuProps {
  fields: FieldWithStatus[];
  readings?: MoistureReading[];
  currentField?: FieldWithStatus;
  variant?: 'default' | 'compact';
}

export function ExportMenu({ fields, readings, currentField, variant = 'default' }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCSV = async () => {
    setLoading('csv');
    try {
      const filename = currentField
        ? `agrowater-${currentField.name.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.csv`
        : `agrowater-pola-${format(new Date(), 'yyyy-MM-dd')}.csv`;

      if (currentField && readings) {
        const csv = generateMoistureHistoryCSV(currentField, readings);
        downloadCSV(csv, filename);
      } else {
        const csv = generateFieldsCSV(fields);
        downloadCSV(csv, filename);
      }
    } finally {
      setLoading(null);
      setIsOpen(false);
    }
  };

  const handleExportPDF = async () => {
    setLoading('pdf');
    try {
      const fieldsToExport = currentField ? [currentField] : fields;

      // If we have a current field with readings, attach them
      const fieldsWithReadings = fieldsToExport.map((field) => ({
        ...field,
        readings: currentField && readings && field.id === currentField.id ? readings : undefined,
      }));

      openPrintableReport(fieldsWithReadings);
    } finally {
      setLoading(null);
      setIsOpen(false);
    }
  };

  if (variant === 'compact') {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100"
        >
          <Download className="h-4 w-4" />
          Eksportuj
          <ChevronDown className="h-3 w-3" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={handleExportCSV}
              disabled={loading === 'csv'}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <Table className="h-4 w-4" />
              {loading === 'csv' ? 'Eksportowanie...' : 'Eksportuj CSV'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={loading === 'pdf'}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {loading === 'pdf' ? 'Generowanie...' : 'Eksportuj PDF'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Eksportuj
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">Format eksportu</p>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={loading === 'csv'}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
          >
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Table className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {loading === 'csv' ? 'Eksportowanie...' : 'CSV (Excel)'}
              </p>
              <p className="text-xs text-gray-500">Arkusz kalkulacyjny</p>
            </div>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={loading === 'pdf'}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 disabled:opacity-50"
          >
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <FileText className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {loading === 'pdf' ? 'Generowanie...' : 'PDF (Raport)'}
              </p>
              <p className="text-xs text-gray-500">Drukowany raport</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
