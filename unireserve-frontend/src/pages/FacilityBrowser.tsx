import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import { Search, ChevronRight, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ApiEnvelope, FacilitySummary } from '../types/api';

const FacilityBrowser = () => {
  const [facilities, setFacilities] = useState<FacilitySummary[]>([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get<ApiEnvelope<FacilitySummary[]>>('/facilities/')
      .then((response) => {
        setFacilities(response.data.data);
      })
      .catch((error) => console.error('Error loading facilities', error));
  }, []);

  const filtered = facilities.filter((facility) => facility.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-heading mb-3">Explore Spaces</h1>
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search for study rooms, courts, labs..." 
            className="input-field pl-12"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {['All Spaces', 'Study Pods', 'Laboratories', 'Sports Courts'].map((cat, i) => (
          <button key={cat} className={`px-5 py-2 rounded-full whitespace-nowrap text-sm ${i === 0 ? 'chip-selected' : 'chip-outline'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {filtered.map((facility) => (
          <div key={facility.id} onClick={() => navigate(`/facilities/${facility.id}`)} className="glass-card overflow-hidden cursor-pointer group">
            <div className="h-48 bg-surface-low relative overflow-hidden">
              {/* Blurred abstract background mimicking structural photos */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute inset-0 bg-surface/40 backdrop-blur-sm"></div>
              {/* Capacity Ring */}
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
                <Users className="w-4 h-4 text-tertiary" />
                <span className="text-xs font-bold">{facility.total_capacity} max</span>
              </div>
            </div>
            <div className="p-5 border-t border-white/5">
              <h3 className="text-xl font-bold mb-1">{facility.name}</h3>
              <p className="text-sm text-gray-400 flex items-center justify-between mt-4">
                <span>{facility.is_active ? 'Available for booking' : 'Currently Offline'}</span>
                <ChevronRight className="w-5 h-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-gray-500">No facilities found.</div>}
      </div>
    </div>
  );
};

export default FacilityBrowser;
