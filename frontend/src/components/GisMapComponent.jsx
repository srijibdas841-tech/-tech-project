import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Compass, 
  MapPin, 
  ExternalLink, 
  Grid, 
  Eye, 
  Crosshair, 
  Key,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

// Tile Layer Configurations (Google Maps & Fallbacks)
const MAP_LAYERS = {
  satellite: {
    name: 'Google Satellite (Hybrid)',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: 'Imagery &copy; Google Maps Cadastre Engine'
  },
  roadmap: {
    name: 'Google Maps (Roadmap)',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: 'Map data &copy; Google Maps'
  },
  terrain: {
    name: 'Google Terrain (Topographic)',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    maxZoom: 20,
    attribution: 'Terrain &copy; Google Maps'
  },
  osm: {
    name: 'OpenStreetMap (Cadastre)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }
};

export default function GisMapComponent({ 
  selectedPlot, 
  allPlots = [], 
  onSelectPlot,
  height = '560px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const activePolygonRef = useRef(null);
  const cornerMarkersRef = useRef([]);
  const activeMarkerRef = useRef(null);
  const surroundingPolygonsRef = useRef([]);

  const [activeLayer, setActiveLayer] = useState('satellite');
  const [showBoundary, setShowBoundary] = useState(true);
  const [showCorners, setShowCorners] = useState(true);
  const [showSurrounding, setShowSurrounding] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(17);
  const [viewMode, setViewMode] = useState('leaflet'); // 'leaflet' or 'gmaps-embed'
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [googleApiKey, setGoogleApiKey] = useState(localStorage.getItem('google_maps_api_key') || '');
  const [centerCoords, setCenterCoords] = useState({ lat: 22.2542, lng: 87.7795 });

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const initialLat = selectedPlot?.latitude || 22.2542;
    const initialLng = selectedPlot?.longitude || 87.7795;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 17,
      zoomControl: false,
      attributionControl: true
    });

    // Add Base Tile Layer (Default: Google Hybrid Satellite)
    const layerCfg = MAP_LAYERS[activeLayer];
    const tileLayer = L.tileLayer(layerCfg.url, {
      maxZoom: layerCfg.maxZoom,
      attribution: layerCfg.attribution,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // Track zoom and center
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    map.on('move', () => {
      const c = map.getCenter();
      setCenterCoords({ lat: c.lat, lng: c.lng });
    });

    // Handle container resize
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Change Tile Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const map = mapInstanceRef.current;
    map.removeLayer(tileLayerRef.current);

    const layerCfg = MAP_LAYERS[activeLayer];
    const newLayer = L.tileLayer(layerCfg.url, {
      maxZoom: layerCfg.maxZoom,
      attribution: layerCfg.attribution,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    // Keep base layer at bottom
    newLayer.bringToBack();
    tileLayerRef.current = newLayer;
  }, [activeLayer]);

  // 3. Render Plot Boundary Polygon, Centroid Marker & Corner Beacons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous active polygon & marker
    if (activePolygonRef.current) {
      map.removeLayer(activePolygonRef.current);
      activePolygonRef.current = null;
    }
    if (activeMarkerRef.current) {
      map.removeLayer(activeMarkerRef.current);
      activeMarkerRef.current = null;
    }
    cornerMarkersRef.current.forEach(m => map.removeLayer(m));
    cornerMarkersRef.current = [];

    // Clear surrounding polygons
    surroundingPolygonsRef.current.forEach(p => map.removeLayer(p));
    surroundingPolygonsRef.current = [];

    if (!selectedPlot) return;

    const lat = selectedPlot.latitude;
    const lng = selectedPlot.longitude;
    const coords = selectedPlot.coordinates;

    // Draw surrounding plots if enabled
    if (showSurrounding && allPlots && allPlots.length > 0) {
      allPlots.forEach(other => {
        if (other.id === selectedPlot.id) return;
        if (other.coordinates && other.coordinates.length >= 3) {
          const isConflict = other.duplicate_score >= 70;
          const poly = L.polygon(other.coordinates, {
            color: isConflict ? '#ef4444' : '#64748b',
            weight: 1.5,
            dashArray: '4, 4',
            fillColor: isConflict ? '#fca5a5' : '#94a3b8',
            fillOpacity: 0.12
          }).addTo(map);

          poly.bindTooltip(
            `<div style="font-size:11px;font-weight:600;">Plot #${other.plot_number || other.survey_number} (${other.owner_name})</div>`, 
            { permanent: false, direction: 'center' }
          );

          poly.on('click', () => {
            if (onSelectPlot) onSelectPlot(other);
          });

          surroundingPolygonsRef.current.push(poly);
        }
      });
    }

    // Determine status color scheme
    const isVerified = selectedPlot.status === 'VERIFIED';
    const isConflict = selectedPlot.status === 'DUPLICATE' || (selectedPlot.duplicate_score >= 70);
    const primaryColor = isConflict ? '#dc2626' : (isVerified ? '#059669' : '#0284c7');
    const fillColor = isConflict ? '#f87171' : (isVerified ? '#34d399' : '#38bdf8');

    // Draw Selected Plot Boundary Polygon
    if (coords && coords.length >= 3 && showBoundary) {
      const polygon = L.polygon(coords, {
        color: primaryColor,
        weight: 3.5,
        dashArray: '6, 6',
        fillColor: fillColor,
        fillOpacity: 0.32
      }).addTo(map);

      activePolygonRef.current = polygon;

      // Add Corner Survey Boundary Stones / Vertices
      if (showCorners) {
        coords.forEach((c, idx) => {
          const cornerMarker = L.circleMarker([c[0], c[1]], {
            radius: 5,
            color: '#ffffff',
            weight: 2,
            fillColor: primaryColor,
            fillOpacity: 1
          }).addTo(map);

          cornerMarker.bindTooltip(
            `<div style="font-family:monospace;font-size:10px;">Vertex P${idx + 1}: ${c[0].toFixed(5)}, ${c[1].toFixed(5)}</div>`,
            { permanent: false, direction: 'top' }
          );
          cornerMarkersRef.current.push(cornerMarker);
        });
      }

      // Fly smoothly to plot bounds
      map.fitBounds(polygon.getBounds(), { padding: [60, 60], maxZoom: 18, animate: true, duration: 1.0 });

      // Polygon Tooltip & Popup
      const tooltipContent = `
        <div style="font-family:var(--font-sans);min-width:180px;padding:4px;">
          <div style="font-weight:700;color:${primaryColor};font-size:13px;">Plot #${selectedPlot.plot_number || selectedPlot.survey_number}</div>
          <div style="font-size:11px;color:#334155;margin-top:2px;">Survey: <strong>${selectedPlot.survey_number}</strong> | Area: <strong>${selectedPlot.area} Acres</strong></div>
          <div style="font-size:11px;color:#475569;">Owner: <strong>${selectedPlot.owner_name}</strong></div>
          <div style="font-size:10px;color:#64748b;margin-top:3px;">Village: ${selectedPlot.village}, ${selectedPlot.district}</div>
        </div>
      `;
      polygon.bindTooltip(tooltipContent, { permanent: false, sticky: true });
    } else if (lat && lng) {
      map.flyTo([lat, lng], 18, { animate: true, duration: 1.0 });
    }

    // Centroid Map Marker Pin with Pulsing Radar
    if (lat && lng) {
      const pinHtml = `
        <div class="cadastral-pin-container">
          <div class="cadastral-pulse" style="border-color:${primaryColor};"></div>
          <div class="cadastral-pin" style="background:${primaryColor};">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: pinHtml,
        className: 'cadastral-leaflet-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
      activeMarkerRef.current = marker;

      const popupContent = `
        <div style="font-family:var(--font-sans);padding:6px;max-width:240px;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-weight:700;font-size:13px;color:#0f172a;">Plot #${selectedPlot.plot_number || selectedPlot.survey_number}</span>
            <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:${isVerified ? '#dcfce7' : '#e0f2fe'};color:${primaryColor};font-weight:700;">${selectedPlot.status}</span>
          </div>
          <div style="font-size:12px;color:#334155;line-height:1.4;">
            <div>Survey: <strong>${selectedPlot.survey_number}</strong></div>
            <div>Khatian: <strong>${selectedPlot.khatian_number || 'N/A'}</strong></div>
            <div>Area: <strong>${selectedPlot.area} Acres</strong> (${(selectedPlot.area * 4046.86).toFixed(0)} m²)</div>
            <div>Holder: <strong>${selectedPlot.owner_name}</strong></div>
            <div style="margin-top:4px;font-size:11px;color:#64748b;">${selectedPlot.village}, ${selectedPlot.district}</div>
          </div>
          <div style="margin-top:8px;padding-top:6px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
            <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank" rel="noopener noreferrer" style="font-size:11px;color:#0284c7;text-decoration:none;font-weight:600;">
              Open in Google Maps &rarr;
            </a>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
    }

  }, [selectedPlot, allPlots, showBoundary, showCorners, showSurrounding]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (!mapInstanceRef.current || !selectedPlot) return;
    if (activePolygonRef.current) {
      mapInstanceRef.current.fitBounds(activePolygonRef.current.getBounds(), { padding: [60, 60], maxZoom: 18 });
    } else if (selectedPlot.latitude && selectedPlot.longitude) {
      mapInstanceRef.current.flyTo([selectedPlot.latitude, selectedPlot.longitude], 18);
    }
  };

  const handleOpenGoogleMaps = () => {
    if (!selectedPlot) return;
    const lat = selectedPlot.latitude || 22.2542;
    const lng = selectedPlot.longitude || 87.7795;
    const gmapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=18`;
    window.open(gmapsUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('google_maps_api_key', googleApiKey);
    setShowApiKeyModal(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-medium)', background: '#0f172a' }}>
      
      {/* Map View Toggle: Leaflet Interactive vs Google Maps Direct Embed */}
      {viewMode === 'gmaps-embed' ? (
        <iframe
          title="Google Maps Cadastral View"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={`https://maps.google.com/maps?q=${selectedPlot?.latitude || 22.2542},${selectedPlot?.longitude || 87.7795}&t=k&z=18&ie=UTF8&iwloc=&output=embed`}
        />
      ) : (
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      )}

      {/* Top Floating GIS Toolbar */}
      <div 
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          right: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 1000
        }}
      >
        {/* Left: Cadastral Information & View Toggle */}
        <div 
          style={{
            pointerEvents: 'auto',
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            padding: '7px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={15} style={{ color: '#38bdf8' }} />
            <span style={{ fontWeight: 600 }}>Cadastral Spatial View</span>
          </div>

          <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.2)' }} />

          {/* View mode toggle */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setViewMode('leaflet')}
              style={{
                background: viewMode === 'leaflet' ? '#0284c7' : 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Interactive GIS
            </button>
            <button
              onClick={() => setViewMode('gmaps-embed')}
              style={{
                background: viewMode === 'gmaps-embed' ? '#0284c7' : 'transparent',
                border: 'none',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Google Maps Live
            </button>
          </div>
        </div>

        {/* Right: Layer Switcher & External Google Maps Button */}
        <div style={{ pointerEvents: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          
          {/* Layer Selector */}
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '3px',
              display: 'flex',
              gap: '3px'
            }}
          >
            <button
              className="btn btn-sm"
              style={{
                padding: '4px 9px',
                fontSize: '11.5px',
                background: activeLayer === 'satellite' ? '#0f4c81' : 'transparent',
                color: activeLayer === 'satellite' ? 'white' : '#334155',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: activeLayer === 'satellite' ? 700 : 500
              }}
              onClick={() => setActiveLayer('satellite')}
              title="Google Satellite Hybrid imagery with roads and boundaries"
            >
              🛰️ Satellite
            </button>
            <button
              className="btn btn-sm"
              style={{
                padding: '4px 9px',
                fontSize: '11.5px',
                background: activeLayer === 'roadmap' ? '#0f4c81' : 'transparent',
                color: activeLayer === 'roadmap' ? 'white' : '#334155',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: activeLayer === 'roadmap' ? 700 : 500
              }}
              onClick={() => setActiveLayer('roadmap')}
              title="Google Standard Map Roadmap"
            >
              🗺️ Roadmap
            </button>
            <button
              className="btn btn-sm"
              style={{
                padding: '4px 9px',
                fontSize: '11.5px',
                background: activeLayer === 'terrain' ? '#0f4c81' : 'transparent',
                color: activeLayer === 'terrain' ? 'white' : '#334155',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: activeLayer === 'terrain' ? 700 : 500
              }}
              onClick={() => setActiveLayer('terrain')}
              title="Google Topographic Terrain view"
            >
              ⛰️ Terrain
            </button>
          </div>

          {/* View on Google Maps Option (Requirement 9) */}
          <button
            className="btn btn-accent btn-sm"
            onClick={handleOpenGoogleMaps}
            title="Open identified location directly in Google Maps"
            style={{
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontWeight: 700,
              fontSize: '12px'
            }}
          >
            <ExternalLink size={14} />
            <span>View on Google Maps</span>
          </button>
        </div>
      </div>

      {/* Right Navigation & Cadastral Controls */}
      <div 
        style={{
          position: 'absolute',
          right: '14px',
          top: '64px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          zIndex: 1000
        }}
      >
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          style={{
            width: '34px',
            height: '34px',
            background: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            color: '#1e293b'
          }}
        >
          <ZoomIn size={16} />
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{
            width: '34px',
            height: '34px',
            background: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            color: '#1e293b'
          }}
        >
          <ZoomOut size={16} />
        </button>

        <button
          onClick={handleRecenter}
          title="Recenter on Selected Parcel"
          style={{
            width: '34px',
            height: '34px',
            background: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            color: '#0284c7'
          }}
        >
          <Crosshair size={16} />
        </button>

        {/* Boundary Polygon Toggle */}
        <button
          onClick={() => setShowBoundary(!showBoundary)}
          title={showBoundary ? "Hide Plot Boundary" : "Show Plot Boundary"}
          style={{
            width: '34px',
            height: '34px',
            background: showBoundary ? '#0284c7' : 'white',
            color: showBoundary ? 'white' : '#64748b',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Grid size={16} />
        </button>

        {/* API Key Config Button for Google Maps */}
        <button
          onClick={() => setShowApiKeyModal(true)}
          title="Configure Google Maps API Key"
          style={{
            width: '34px',
            height: '34px',
            background: 'white',
            color: '#64748b',
            border: '1px solid #cbd5e1',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <Key size={15} />
        </button>
      </div>

      {/* Bottom Cadastral Geodetic Coordinates Bar */}
      <div 
        style={{
          position: 'absolute',
          bottom: '10px',
          left: '14px',
          right: '14px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(6px)',
          color: '#e2e8f0',
          padding: '6px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '11.5px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1000,
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#94a3b8' }}>Center Coordinates: </span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
              {centerCoords.lat.toFixed(5)}° N, {centerCoords.lng.toFixed(5)}° E
            </strong>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>Spatial Datum: </span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>EPSG:4326 (WGS 84 Cadastre)</span>
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>Zoom Level: </span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{currentZoom}x</span>
          </div>
        </div>

        {selectedPlot && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span>
              Active Parcel: <strong style={{ color: '#38bdf8' }}>#{selectedPlot.plot_number || selectedPlot.survey_number}</strong>
            </span>
            <span style={{ color: '#94a3b8' }}>Extent: <strong>{selectedPlot.area} Acres</strong></span>
            {selectedPlot.coordinates && (
              <span style={{ color: '#4ade80', fontSize: '10.5px' }}>
                &bull; Complete Polygon Boundary Georeferenced
              </span>
            )}
          </div>
        )}
      </div>

      {/* Google Maps API Key Modal */}
      {showApiKeyModal && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
          }}
        >
          <div 
            style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              padding: '22px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Key size={18} style={{ color: '#0f4c81' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Google Maps Platform API Key</h3>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b', marginBottom: '14px', lineHeight: 1.5 }}>
              The prototype currently provides live high-resolution Google Maps Satellite and Roadmap layers without requiring a paid key. You can also inject your official Google Maps JavaScript API Key below:
            </p>
            <input 
              type="text"
              className="form-input"
              placeholder="AIzaSy..."
              value={googleApiKey}
              onChange={(e) => setGoogleApiKey(e.target.value)}
              style={{ marginBottom: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowApiKeyModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveApiKey}>
                Save Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for custom Cadastral marker */}
      <style>{`
        .cadastral-pin-container {
          position: relative;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cadastral-pin {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 8px rgba(0,0,0,0.35);
          border: 2px solid white;
          z-index: 2;
        }
        .cadastral-pulse {
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid #0284c7;
          animation: cadastral-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          opacity: 0.75;
          z-index: 1;
        }
        @keyframes cadastral-ping {
          0% {
            transform: scale(0.6);
            opacity: 1;
          }
          75%, 100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
        }
        .leaflet-popup-content {
          margin: 10px 14px;
        }
      `}</style>
    </div>
  );
}
