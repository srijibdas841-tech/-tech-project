import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Copy,
  Compass
} from 'lucide-react';
import { recordService } from '../services/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function SearchRecordsPage({ setSelectedRecordId, setActiveTab }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (districtFilter) params.district = districtFilter;
      const data = await recordService.list(params);
      setRecords(data);
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter, districtFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords();
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <h2>Cadastral Land Records Repository</h2>
          <p>Search, filter, and inspect verified and pending land deed titles across all states</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-accent"
            onClick={() => setActiveTab('gis-search')}
            title="Search land parcels on GIS interactive satellite map"
          >
            <Compass size={16} />
            <span>Search Land by GIS</span>
          </button>

          <button 
            className="btn btn-outline"
            onClick={() => {
              const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
              const dl = document.createElement('a');
              dl.setAttribute("href", jsonStr);
              dl.setAttribute("download", "cadastral_land_records.json");
              dl.click();
            }}
          >
            <Download size={16} />
            <span>Export Land Registry</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by Owner, Survey #, Plot, Village, or Registration..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ width: '180px' }}>
            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="VERIFIED">Verified</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="DUPLICATE">Duplicate</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div style={{ width: '180px' }}>
            <select 
              className="form-select"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
            >
              <option value="">All Districts</option>
              <option value="Purba Medinipur">Purba Medinipur (WB)</option>
              <option value="Pune">Pune (MH)</option>
              <option value="Bengaluru">Bengaluru (KA)</option>
              <option value="Lucknow">Lucknow (UP)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary">
            <Search size={15} />
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* Records Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Showing <strong>{records.length}</strong> matching land records
          </span>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Owner Name</th>
                <th>Survey / Dag #</th>
                <th>Plot #</th>
                <th>Area</th>
                <th>Village / Mauza</th>
                <th>District & State</th>
                <th>AI Confidence</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>
                    No matching cadastral records found for your search criteria.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0f4c81' }}>
                      #{r.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {r.owner_name}
                      {r.father_or_guardian_name && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>s/o {r.father_or_guardian_name}</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: '#0369a1' }}>
                      {r.survey_number}
                    </td>
                    <td>{r.plot_number || 'N/A'}</td>
                    <td style={{ fontWeight: 600 }}>{r.area} Acres</td>
                    <td>{r.village}</td>
                    <td>{r.district}, {r.state}</td>
                    <td>
                      <StatusBadge status={r.OCR_confidence} type="confidence" />
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setSelectedRecordId(r.id);
                            setActiveTab('record-details');
                          }}
                        >
                          <Eye size={13} />
                          <span>Inspect</span>
                        </button>

                        <button 
                          className="btn btn-accent btn-sm"
                          title="Locate on GIS satellite map"
                          onClick={() => {
                            setSelectedRecordId(r.id);
                            setActiveTab('gis-search');
                          }}
                          style={{ padding: '5px 8px' }}
                        >
                          <Compass size={13} />
                          <span>GIS Map</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
