import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  Compass, 
  Layers, 
  ExternalLink, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Copy, 
  Check, 
  Download, 
  RotateCcw, 
  Filter, 
  Sparkles,
  ChevronRight,
  Maximize2,
  FileText,
  Navigation
} from 'lucide-react';
import { recordService } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import GisMapComponent from '../components/GisMapComponent.jsx';

export default function LandSearchGisPage({ setSelectedRecordId, setActiveTab, initialRecordId }) {
  const [gisPlots, setGisPlots] = useState([]);
  const [selectedPlot, setSelectedPlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Search filter criteria (Requirement 2)
  const [searchQuery, setSearchQuery] = useState('');
  const [plotNumberFilter, setPlotNumberFilter] = useState('');
  const [surveyNumberFilter, setSurveyNumberFilter] = useState('');
  const [khatianFilter, setKhatianFilter] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Workflow Stepper active stage (Requirement 10)
  // Stages: 1. Land Search -> 2. Identify Plot -> 3. GIS Location -> 4. Google Maps -> 5. View Plot Details
  const [workflowStage, setWorkflowStage] = useState(1);

  // Quick Demo Preset Parcels
  const samplePresets = [
    { label: 'WB: Moyna Plot #45 (Khatian 104)', village: 'Moyna', plot: '45', survey: '123/4', state: 'West Bengal', district: 'Purba Medinipur' },
    { label: 'MH: Wagholi Plot #12 (Survey 88/2A)', village: 'Wagholi', plot: '12', survey: '88/2A', state: 'Maharashtra', district: 'Pune' },
    { label: 'KA: Sompura Plot #3B (RTC 45)', village: 'Sompura', plot: '3B', survey: '45/1', state: 'Karnataka', district: 'Bengaluru Urban' },
    { label: 'UP: Kakori Plot #78 (Khatauni 215)', village: 'Kakori', plot: '78', survey: '215/1', state: 'Uttar Pradesh', district: 'Lucknow' },
    { label: 'WB: Moyna (Duplicate Claim #45)', village: 'Moyna', plot: '45', survey: '123/4', khatian: '287', state: 'West Bengal', district: 'Purba Medinipur' },
    { label: 'MH: Baramati Plot #3 (Sugarcane)', village: 'Baramati', plot: '3', survey: '14/7', state: 'Maharashtra', district: 'Pune' }
  ];

  const fetchGisPlots = async (overrideParams = null) => {
    setLoading(true);
    try {
      const params = overrideParams || {};
      if (!overrideParams) {
        if (searchQuery) params.search = searchQuery;
        if (plotNumberFilter) params.plot_number = plotNumberFilter;
        if (surveyNumberFilter) params.survey_number = surveyNumberFilter;
        if (khatianFilter) params.khatian_number = khatianFilter;
        if (villageFilter) params.village = villageFilter;
        if (districtFilter) params.district = districtFilter;
        if (stateFilter) params.state = stateFilter;
        if (statusFilter) params.status = statusFilter;
      }
      const data = await recordService.gisSearch(params);
      setGisPlots(data);

      if (data.length > 0) {
        // If initialRecordId is provided, select it, otherwise select the first record
        let target = data[0];
        if (initialRecordId) {
          const match = data.find(p => p.id === initialRecordId);
          if (match) target = match;
        }
        setSelectedPlot(target);
        setWorkflowStage(target ? 3 : 1);
      } else {
        setSelectedPlot(null);
        setWorkflowStage(1);
      }
    } catch (err) {
      console.error('Error fetching GIS land parcels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGisPlots();
  }, [stateFilter, districtFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGisPlots();
    setWorkflowStage(2);
  };

  const handleSelectPlot = (plot) => {
    setSelectedPlot(plot);
    setWorkflowStage(3);
  };

  const handlePresetClick = (preset) => {
    setSearchQuery('');
    setPlotNumberFilter(preset.plot || '');
    setSurveyNumberFilter(preset.survey || '');
    setKhatianFilter(preset.khatian || '');
    setVillageFilter(preset.village || '');
    setDistrictFilter(preset.district || '');
    setStateFilter(preset.state || '');
    setStatusFilter('');

    fetchGisPlots({
      plot_number: preset.plot,
      survey_number: preset.survey,
      village: preset.village,
      district: preset.district,
      state: preset.state,
      khatian_number: preset.khatian
    });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setPlotNumberFilter('');
    setSurveyNumberFilter('');
    setKhatianFilter('');
    setVillageFilter('');
    setDistrictFilter('');
    setStateFilter('');
    setStatusFilter('');
    fetchGisPlots({});
    setWorkflowStage(1);
  };

  const handleCopyCoordinates = () => {
    if (!selectedPlot) return;
    const text = `${selectedPlot.latitude.toFixed(6)}, ${selectedPlot.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleExportGeoJson = () => {
    if (!selectedPlot && gisPlots.length === 0) return;

    const features = (selectedPlot ? [selectedPlot] : gisPlots).map(p => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [p.coordinates.map(c => [c[1], c[0]])] // GeoJSON expects [lng, lat]
      },
      properties: {
        id: p.id,
        plot_number: p.plot_number,
        survey_number: p.survey_number,
        khatian_number: p.khatian_number,
        owner_name: p.owner_name,
        area_acres: p.area,
        village: p.village,
        district: p.district,
        state: p.state,
        status: p.status,
        centroid: [p.latitude, p.longitude]
      }
    }));

    const geoJson = {
      type: "FeatureCollection",
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
      },
      features
    };

    const blob = new Blob([JSON.stringify(geoJson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cadastral_parcel_${selectedPlot?.plot_number || 'gis_export'}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const workflowSteps = [
    { num: 1, label: 'Land Search', sub: 'Search Attributes' },
    { num: 2, label: 'Identify Plot', sub: 'Match Parcel' },
    { num: 3, label: 'GIS Location', sub: 'Spatial Boundary' },
    { num: 4, label: 'Google Maps', sub: 'Satellite & Hybrid' },
    { num: 5, label: 'Plot Details', sub: 'Deed Attributes' }
  ];

  return (
    <div className="page-container">
      
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              National Cadastre GIS Geoportal
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>WGS 84 / EPSG:4326</span>
          </div>
          <div className="page-title">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Compass size={24} style={{ color: '#0f4c81' }} />
              <span>GIS-Based Land Search & Map Location</span>
            </h2>
            <p>Locate geo-referenced cadastral parcels, inspect boundary polygons, and view verified plots on Google Maps.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {selectedPlot && (
            <button 
              className="btn btn-accent"
              onClick={() => window.open(selectedPlot.google_maps_url, '_blank')}
              title="Open currently selected plot on Google Maps"
            >
              <ExternalLink size={15} />
              <span>Open in Google Maps</span>
            </button>
          )}

          <button 
            className="btn btn-outline"
            onClick={handleExportGeoJson}
            title="Export parcel boundary coordinates in standard GeoJSON format"
          >
            <Download size={15} />
            <span>Export GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Workflow Stepper: Land Search → Identify Plot → GIS Location → Google Maps → View Plot Details (Requirement 10) */}
      <div 
        className="card" 
        style={{ 
          marginBottom: '20px', 
          padding: '14px 20px',
          background: 'linear-gradient(to right, #ffffff, #f8fafc)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
          {workflowSteps.map((step, idx) => {
            const isCompleted = workflowStage > step.num;
            const isCurrent = workflowStage === step.num;

            return (
              <React.Fragment key={step.num}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    cursor: 'pointer' 
                  }}
                  onClick={() => setWorkflowStage(step.num)}
                >
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isCompleted ? '#059669' : (isCurrent ? '#0284c7' : '#e2e8f0'),
                      color: (isCompleted || isCurrent) ? 'white' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '13px',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(2, 132, 199, 0.2)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isCompleted ? <Check size={16} /> : step.num}
                  </div>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: isCurrent ? 700 : 600, color: isCurrent ? '#0f172a' : '#475569' }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b' }}>
                      {step.sub}
                    </div>
                  </div>
                </div>

                {idx < workflowSteps.length - 1 && (
                  <div 
                    style={{ 
                      flex: 1, 
                      height: '2px', 
                      background: workflowStage > step.num ? '#059669' : '#e2e8f0',
                      margin: '0 12px',
                      transition: 'background 0.3s ease'
                    }} 
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Cadastral Search & Filter Card (Requirement 2) */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px 22px' }}>
        <form onSubmit={handleSearchSubmit}>
          {/* Main Search Input */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text"
                className="form-input"
                placeholder="Search across all land records by Plot #, Survey #, Khatian/Dag #, Owner, Village, or Registration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '38px', fontSize: '14px', height: '42px' }}
              />
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 20px' }}>
              <Search size={16} />
              <span>Search Cadastre</span>
            </button>

            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={handleResetFilters}
              title="Reset all filters"
              style={{ height: '42px' }}
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          </div>

          {/* Granular Field Filters: Plot Number, Survey Number, Khatian / Dag, Village, District, State */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '11.5px' }}>Plot Number</label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. 45, 12, 78"
                value={plotNumberFilter}
                onChange={(e) => setPlotNumberFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '11.5px' }}>Survey / Dag Number</label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. 123/4, 88/2A"
                value={surveyNumberFilter}
                onChange={(e) => setSurveyNumberFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '11.5px' }}>Khatian / Dag Number</label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. 104, 287, 312"
                value={khatianFilter}
                onChange={(e) => setKhatianFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '11.5px' }}>State</label>
              <select 
                className="form-select"
                value={stateFilter}
                onChange={(e) => {
                  setStateFilter(e.target.value);
                  setDistrictFilter('');
                }}
                style={{ padding: '6px 10px', fontSize: '12.5px' }}
              >
                <option value="">All States</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '11.5px' }}>District</label>
              <select 
                className="form-select"
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px' }}
              >
                <option value="">All Districts</option>
                {(!stateFilter || stateFilter === 'West Bengal') && <option value="Purba Medinipur">Purba Medinipur (WB)</option>}
                {(!stateFilter || stateFilter === 'Maharashtra') && <option value="Pune">Pune (MH)</option>}
                {(!stateFilter || stateFilter === 'Karnataka') && <option value="Bengaluru Urban">Bengaluru Urban (KA)</option>}
                {(!stateFilter || stateFilter === 'Karnataka') && <option value="Bengaluru Rural">Bengaluru Rural (KA)</option>}
                {(!stateFilter || stateFilter === 'Uttar Pradesh') && <option value="Lucknow">Lucknow (UP)</option>}
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '11.5px' }}>Village / Mauza</label>
              <input 
                type="text"
                className="form-input"
                placeholder="e.g. Moyna, Wagholi"
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '11.5px' }}>Verification Status</label>
              <select 
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '12.5px' }}
              >
                <option value="">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="DUPLICATE">Duplicate</option>
              </select>
            </div>
          </div>

          {/* Quick Demo Parcel Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={13} style={{ color: '#0284c7' }} />
              Quick Demo Parcels:
            </span>
            {samplePresets.map((preset, i) => (
              <button
                key={i}
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handlePresetClick(preset)}
                style={{
                  fontSize: '11.5px',
                  padding: '3px 8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Main Split Grid: Left Sidebar (Parcel Details & List) + Right (Interactive Map) */}
      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px', alignItems: 'start' }}>
        
        {/* Left Column: Identified Plot Information Card (Requirement 6) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {selectedPlot ? (
            <div className="card" style={{ borderTop: '4px solid #0284c7', boxShadow: 'var(--shadow-md)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.04em' }}>
                    Identified Cadastral Plot #{selectedPlot.id}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    Plot No. {selectedPlot.plot_number || selectedPlot.survey_number}
                  </h3>
                  <div style={{ fontSize: '12.5px', color: '#475569' }}>
                    {selectedPlot.village}, {selectedPlot.district}, {selectedPlot.state}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <StatusBadge status={selectedPlot.status} />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>AI Conf: {selectedPlot.OCR_confidence}%</span>
                </div>
              </div>

              {/* Cadastral Attributes Grid (Requirement 6) */}
              <div 
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '12.5px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Primary Landholder:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedPlot.owner_name}</strong>
                </div>

                {selectedPlot.father_or_guardian_name && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Guardian / Father:</span>
                    <span>s/o {selectedPlot.father_or_guardian_name}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Survey / Dag No:</span>
                  <strong style={{ color: '#0284c7', fontFamily: 'var(--font-mono)' }}>{selectedPlot.survey_number}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Khatian / Khatauni:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{selectedPlot.khatian_number || 'N/A'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Land Classification:</span>
                  <span>{selectedPlot.land_type || 'Agricultural'}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Parcel Extent:</span>
                  <strong style={{ color: '#0f172a' }}>
                    {selectedPlot.area} Acres <span style={{ color: '#64748b', fontWeight: 400 }}>({(selectedPlot.area * 4046.86).toFixed(0)} m²)</span>
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Validation Score:</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>{selectedPlot.validation_score}%</span>
                </div>

                {selectedPlot.duplicate_score >= 70 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                    <span>Duplicate / Overlap Risk:</span>
                    <strong>{selectedPlot.duplicate_score}% Conflict</strong>
                  </div>
                )}
              </div>

              {/* Exact Geodetic Coordinates & GIS Boundary Data (Requirement 3, 5, 8) */}
              <div 
                style={{
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  marginBottom: '14px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={13} />
                    Geodetic Coordinates (WGS84)
                  </span>
                  
                  <button 
                    onClick={handleCopyCoordinates}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '2px 8px', fontSize: '11px', background: 'white' }}
                  >
                    {copiedCoords ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                    <span>{copiedCoords ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', color: '#0f172a', fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>
                  Latitude: {selectedPlot.latitude.toFixed(6)}° N<br/>
                  Longitude: {selectedPlot.longitude.toFixed(6)}° E
                </div>

                <div style={{ fontSize: '11px', color: '#475569' }}>
                  Boundary Type: <strong>{selectedPlot.gis_boundary_type || 'POLYGON'}</strong> ({selectedPlot.coordinates?.length || 4} georeferenced vertices)
                </div>

                {selectedPlot.cadastral_metadata?.adjacent_plots && (
                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #bae6fd', fontSize: '11px', color: '#0369a1' }}>
                    <div><strong>North:</strong> {selectedPlot.cadastral_metadata.adjacent_plots.north}</div>
                    <div><strong>South:</strong> {selectedPlot.cadastral_metadata.adjacent_plots.south}</div>
                  </div>
                )}
              </div>

              {/* Action Buttons: View on Google Maps (Requirement 9) & Inspect Cadastral Record */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedRecordId(selectedPlot.id);
                    setActiveTab('record-details');
                  }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Eye size={15} />
                  <span>Inspect Full Land Record #{selectedPlot.id}</span>
                </button>

                <button 
                  className="btn btn-accent"
                  onClick={() => window.open(selectedPlot.google_maps_url, '_blank')}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <ExternalLink size={15} />
                  <span>View on Google Maps</span>
                </button>
              </div>

            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
              <Navigation size={32} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>No Parcel Selected</div>
              <div style={{ fontSize: '12px' }}>Use the search box above or select a cadastral plot from the list to display its GIS location.</div>
            </div>
          )}

          {/* Matching Cadastral Parcels List */}
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                Matching Parcels ({gisPlots.length})
              </span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Select to focus on map
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '360px', overflowY: 'auto' }}>
              {gisPlots.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: '#94a3b8' }}>
                  No parcels matched your criteria. Try resetting filters.
                </div>
              ) : (
                gisPlots.map(plot => {
                  const isSelected = selectedPlot?.id === plot.id;
                  const isConflict = plot.duplicate_score >= 70;

                  return (
                    <div
                      key={plot.id}
                      onClick={() => handleSelectPlot(plot)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: isSelected ? '#f0f9ff' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: isSelected ? '#0284c7' : '#0f172a' }}>
                          Plot #{plot.plot_number || plot.survey_number}
                        </span>
                        <StatusBadge status={plot.status} />
                      </div>

                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: 500 }}>
                        {plot.owner_name}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        <span>Survey: {plot.survey_number}</span>
                        <span>{plot.area} Acres</span>
                        <span>{plot.village}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Column: High-Performance Interactive Google Maps GIS View (Requirements 4, 5, 7, 8, 9) */}
        <div>
          <GisMapComponent 
            selectedPlot={selectedPlot}
            allPlots={gisPlots}
            onSelectPlot={handleSelectPlot}
            height="720px"
          />

          {/* Spatial Metadata & Integration Info Card */}
          <div 
            className="card" 
            style={{ 
              marginTop: '16px', 
              padding: '14px 18px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              fontSize: '12px',
              color: '#64748b'
            }}
          >
            <div>
              <strong style={{ color: '#0f172a' }}>GIS Cadastral Layer Integration: </strong>
              <span>Geo-referenced boundaries match revenue survey sheets. Google Satellite Hybrid tiles show real-world ground truth.</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669' }}></span>
                Verified Boundary
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#0284c7' }}></span>
                Active Parcel
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }}></span>
                Disputed / Conflict
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
