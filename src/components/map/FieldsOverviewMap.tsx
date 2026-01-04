'use client';

import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import type { FeatureCollection, Feature, Polygon } from 'geojson';
import type { Layer, PathOptions } from 'leaflet';
import { MAP_CONFIG, STATUS_COLORS } from '@/lib/constants';
import type { FieldWithStatus, MoistureStatus } from '@/types/database';
import 'leaflet/dist/leaflet.css';

interface FieldsOverviewMapProps {
  fields: FieldWithStatus[];
  onFieldClick?: (fieldId: string) => void;
  height?: number;
}

// Fix Leaflet marker icons
const fixLeafletIcons = async () => {
  if (typeof window !== 'undefined') {
    const L = await import('leaflet');
    delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }
};

// Component to fit map bounds to all fields
function FitBoundsToFields({ fields }: { fields: FieldWithStatus[] }) {
  const map = useMap();

  useEffect(() => {
    if (fields.length === 0) return;

    const fitBounds = async () => {
      const L = await import('leaflet');
      const bounds = L.latLngBounds([]);

      fields.forEach((field) => {
        if (field.boundary && typeof field.boundary === 'object') {
          const boundary = field.boundary as { type: string; coordinates: number[][][] };
          if (boundary.type === 'Polygon' && boundary.coordinates) {
            boundary.coordinates[0].forEach((coord: number[]) => {
              bounds.extend([coord[1], coord[0]]);
            });
          }
        }
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    fitBounds();
  }, [map, fields]);

  return null;
}

function getStatusColor(status: MoistureStatus): string {
  switch (status) {
    case 'good':
      return '#22c55e';
    case 'warning':
      return '#eab308';
    case 'critical':
      return '#ef4444';
    default:
      return '#9ca3af';
  }
}

function getFieldStyle(status: MoistureStatus): PathOptions {
  const color = getStatusColor(status);
  return {
    fillColor: color,
    fillOpacity: 0.4,
    color: color,
    weight: 2,
    opacity: 1,
  };
}

export function FieldsOverviewMap({ fields, onFieldClick, height = 500 }: FieldsOverviewMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // Convert fields to GeoJSON FeatureCollection
  const geojsonData: FeatureCollection<Polygon> = useMemo(() => {
    const features: Feature<Polygon>[] = fields
      .filter((field) => field.boundary && typeof field.boundary === 'object')
      .map((field) => ({
        type: 'Feature' as const,
        geometry: field.boundary as unknown as Polygon,
        properties: {
          id: field.id,
          name: field.name,
          status: field.status,
          moisture: field.current_moisture,
          area: field.area_hectares,
          crop: field.crop_type,
        },
      }));

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }, [fields]);

  const onEachFeature = (feature: Feature, layer: Layer) => {
    if (feature.properties) {
      const { name, status, moisture, area } = feature.properties;
      const statusLabel = status === 'good' ? 'Optymalnie' : status === 'warning' ? 'Monitoruj' : status === 'critical' ? 'Uwaga!' : 'Brak danych';
      const moistureText = moisture !== null ? `${Math.round(moisture * 100)}%` : 'Brak';

      layer.bindPopup(`
        <div style="min-width: 150px;">
          <p style="font-weight: 600; margin-bottom: 4px;">${name}</p>
          <p style="font-size: 12px; color: #666;">Wilgotnosc: ${moistureText}</p>
          <p style="font-size: 12px; color: #666;">Status: ${statusLabel}</p>
          <p style="font-size: 12px; color: #666;">Powierzchnia: ${area?.toFixed(2) || '-'} ha</p>
        </div>
      `);

      layer.on({
        mouseover: (e) => {
          const target = e.target;
          target.setStyle({
            weight: 4,
            fillOpacity: 0.6,
          });
        },
        mouseout: (e) => {
          const target = e.target;
          target.setStyle(getFieldStyle(status));
        },
        click: () => {
          if (onFieldClick && feature.properties?.id) {
            onFieldClick(feature.properties.id);
          }
        },
      });
    }
  };

  const styleFeature = (feature: Feature | undefined): PathOptions => {
    if (!feature?.properties) return {};
    return getFieldStyle(feature.properties.status);
  };

  if (fields.length === 0) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <p className="text-gray-500">Brak pol do wyswietlenia</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
      <MapContainer
        center={MAP_CONFIG.defaultCenter}
        zoom={MAP_CONFIG.defaultZoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution={MAP_CONFIG.attribution}
          url={MAP_CONFIG.tileUrl}
        />
        <GeoJSON
          key={JSON.stringify(geojsonData)}
          data={geojsonData}
          style={styleFeature}
          onEachFeature={onEachFeature}
        />
        <FitBoundsToFields fields={fields} />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <p className="text-xs font-semibold text-gray-700 mb-2">Legenda</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.good.fill }}></div>
            <span className="text-xs text-gray-600">Optymalnie</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.warning.fill }}></div>
            <span className="text-xs text-gray-600">Monitoruj</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.critical.fill }}></div>
            <span className="text-xs text-gray-600">Uwaga!</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.unknown.fill }}></div>
            <span className="text-xs text-gray-600">Brak danych</span>
          </div>
        </div>
      </div>
    </div>
  );
}
