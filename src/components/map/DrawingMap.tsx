'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import type { FeatureGroup as FeatureGroupType } from 'leaflet';
import type { GeoJSONPolygon } from '@/types/database';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

// Fix Leaflet default marker icons - using CDN URLs to avoid bundler issues
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface DrawingMapProps {
  onPolygonChange: (polygon: GeoJSONPolygon | null) => void;
  initialPolygon?: GeoJSONPolygon;
}

// Component to fit map to polygon bounds
function FitBounds({ polygon }: { polygon?: GeoJSONPolygon }) {
  const map = useMap();

  useEffect(() => {
    if (polygon && polygon.coordinates.length > 0) {
      const coords = polygon.coordinates[0].map(
        (coord) => [coord[1], coord[0]] as [number, number]
      );
      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [map, polygon]);

  return null;
}

export function DrawingMapContent({ onPolygonChange, initialPolygon }: DrawingMapProps) {
  const featureGroupRef = useRef<FeatureGroupType>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Load initial polygon
  useEffect(() => {
    if (initialPolygon && featureGroupRef.current && !hasDrawn) {
      const coords = initialPolygon.coordinates[0].map(
        (coord) => [coord[1], coord[0]] as L.LatLngExpression
      );
      const polygon = L.polygon(coords, {
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.2,
      });
      featureGroupRef.current.clearLayers();
      featureGroupRef.current.addLayer(polygon);
    }
  }, [initialPolygon, hasDrawn]);

  const handleCreated = useCallback(
    (e: L.DrawEvents.Created) => {
      const layer = e.layer as L.Polygon;

      // Clear previous layers (only allow one polygon)
      if (featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
        featureGroupRef.current.addLayer(layer);
      }

      // Convert to GeoJSON
      const geoJson = layer.toGeoJSON();
      if (geoJson.geometry.type === 'Polygon') {
        onPolygonChange(geoJson.geometry as GeoJSONPolygon);
        setHasDrawn(true);
      }
    },
    [onPolygonChange]
  );

  const handleEdited = useCallback(
    (e: L.DrawEvents.Edited) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        if (layer instanceof L.Polygon) {
          const geoJson = layer.toGeoJSON();
          if (geoJson.geometry.type === 'Polygon') {
            onPolygonChange(geoJson.geometry as GeoJSONPolygon);
          }
        }
      });
    },
    [onPolygonChange]
  );

  const handleDeleted = useCallback(() => {
    onPolygonChange(null);
    setHasDrawn(false);
  }, [onPolygonChange]);

  return (
    <>
      <FitBounds polygon={initialPolygon} />
      <FeatureGroup ref={featureGroupRef}>
        <EditControl
          position="topright"
          onCreated={handleCreated}
          onEdited={handleEdited}
          onDeleted={handleDeleted}
          draw={{
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
            polygon: {
              allowIntersection: false,
              drawError: {
                color: '#e1e1e1',
                message: '<strong>Blad!</strong> Krawedzie nie moga sie przecinac.',
              },
              shapeOptions: {
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.2,
              },
            },
          }}
          edit={{
            remove: true,
          }}
        />
      </FeatureGroup>
    </>
  );
}
