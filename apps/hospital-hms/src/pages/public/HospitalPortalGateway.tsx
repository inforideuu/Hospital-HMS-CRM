import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Sparkles,
  ArrowRight,
  Activity,
  MapPin,
  PhoneCall,
  Bed,
  CheckCircle2,
  Globe,
  ShieldCheck,
  SearchCheck,
  AlertCircle,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { Hospital, HospitalWebsite } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNotification } from '../../context/NotificationContext';
import { HospitalPublicWebsite } from './HospitalPublicWebsite';

export const HospitalPortalGateway: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [hospitals, setHospitals] = useState<Hospital[]>(() => MockStorage.getHospitals());
  const [websites, setWebsites] = useState<HospitalWebsite[]>(() => MockStorage.getWebsites());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTenantHospitalId, setActiveTenantHospitalId] = useState<string | null>(null);
  const [isSearched, setIsSearched] = useState(false);

  React.useEffect(() => {
    const handleStorageUpdate = () => {
      setHospitals(MockStorage.getHospitals());
      setWebsites(MockStorage.getWebsites());
    };
    window.addEventListener('pulse_storage_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Filter hospitals ONLY when user searches by Name, Subdomain, Domain URL, City, or ID
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults = hospitals.filter((h) => {
    if (!trimmedQuery) return false;

    const website = websites.find((w) => w.hospitalId === h.id || w.id === `WEB-${h.id}`) || MockStorage.getWebsiteByHospitalId(h.id);
    const isPublished = website && (website.status === 'published' || website.published === true);
    if (!isPublished) return false;

    const matchesName = h.name.toLowerCase().includes(trimmedQuery);
    const matchesCity = h.city.toLowerCase().includes(trimmedQuery);
    const matchesState = h.state.toLowerCase().includes(trimmedQuery);
    const matchesId = h.id.toLowerCase().includes(trimmedQuery);
    const matchesWebsiteUrl = h.websiteUrl?.toLowerCase().includes(trimmedQuery);

    // Extract domain prefix (e.g., "apexmedical" from "apexmedical.pulsecorehealth.com")
    const cleanDomain = h.websiteUrl?.replace('https://', '').replace('http://', '').toLowerCase();
    const matchesDomain = cleanDomain ? cleanDomain.includes(trimmedQuery) : false;

    return matchesName || matchesCity || matchesState || matchesId || matchesWebsiteUrl || matchesDomain;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearched(true);
    if (searchResults.length === 1) {
      handleSelectHospital(searchResults[0]);
    } else if (searchResults.length === 0 && trimmedQuery) {
      showToast('Hospital Domain Not Found', 'Please check the domain name or facility code and try again.', 'error');
    }
  };

  const handleSelectHospital = (hosp: Hospital) => {
    setActiveTenantHospitalId(hosp.id);
    showToast(`Navigated to ${hosp.name}`, 'Rendering official hospital website & portal', 'info');
  };

  // If a hospital tenant is selected, show that hospital's custom website!
  if (activeTenantHospitalId) {
    return <HospitalPublicWebsite hospitalId={activeTenantHospitalId} />;
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-center text-slate-800 selection:bg-[#FF3030] selection:text-white relative py-12"
      style={{ backgroundImage: "url('/login_bg_light_1790316830068.jpg')" }}
    >
      {/* Light Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-100/95 via-slate-100/90 to-white/85 backdrop-blur-[2px]" />

      <div className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            ← Back to SaaS Home
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/superadmin-login')}
            className="bg-white/90 hover:bg-white text-slate-700 text-xs rounded-full font-bold"
          >
            Super Admin Login
          </Button>
        </div>

        {/* Google-Style Domain Search Box */}
        <div className="text-center space-y-6 max-w-2xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF3030]/10 border border-[#FF3030]/30 text-[#FF3030] text-xs font-bold shadow-xs">
            <Globe className="w-4 h-4 text-[#FF3030]" />
            Hospital Domain & Facility Lookup Engine
          </div>

          <h1 className="text-3xl sm:text-5xl font-serif font-extrabold text-slate-900 tracking-tight leading-tight">
            Find Your Hospital Website
          </h1>
          <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-lg mx-auto">
            Search by unique hospital domain name, web address, or facility ID to access your hospital’s official website and OPD booking portal.
          </p>

          {/* Interactive Google-Style Domain Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto pt-2">
            <div className="relative flex items-center shadow-xl rounded-full border border-slate-300/90 bg-white p-1.5 focus-within:ring-2 focus-within:ring-[#FF3030] focus-within:border-[#FF3030] transition-all">
              <Search className="w-5 h-5 text-[#FF3030] ml-4 shrink-0" />
              <input
                type="text"
                placeholder="Enter domain (e.g. apexmedical, metro.pulsecorehealth.com) or Hospital Name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearched(false);
                }}
                className="w-full text-sm font-medium py-2.5 px-3 text-slate-900 placeholder:text-slate-400 bg-transparent border-none focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="bg-[#FF3030] hover:bg-[#e62222] text-white font-bold text-xs px-6 py-3 rounded-full shadow-md shadow-[#FF3030]/25 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                Search <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          
        </div>

        {/* Search Results Display (Only shown when searching or if query matches) */}
        {trimmedQuery && (
          <div className="space-y-4 max-w-2xl mx-auto pt-4">
            <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <span>Domain Search Results ({searchResults.length})</span>
              <span className="font-mono text-[#FF3030]">Query: "{trimmedQuery}"</span>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((hosp) => {
                  const website = MockStorage.getWebsiteByHospitalId(hosp.id);
                  return (
                    <div
                      key={hosp.id}
                      onClick={() => handleSelectHospital(hosp)}
                      className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-md p-5 hover:shadow-xl hover:border-[#FF3030] transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-[#FF3030] text-white flex items-center justify-center font-bold shadow-md shadow-[#FF3030]/25 shrink-0">
                          <Activity className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#FF3030] transition-colors truncate">
                              {hosp.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-[#FF3030] border border-[#FF3030]/25">
                              {hosp.websiteUrl || `https://${hosp.id.toLowerCase()}.pulsecorehealth.com`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {hosp.city}, {hosp.state} • {hosp.totalBeds} Beds • 24/7 OPD
                          </p>
                        </div>
                      </div>

                      <Button variant="coral" size="sm" className="bg-[#FF3030] hover:bg-[#e62222] text-white shrink-0 rounded-xl shadow-md shadow-[#FF3030]/20 border-none">
                        Open Hospital Site <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-white/90 rounded-2xl border border-slate-200 shadow-xs max-w-md mx-auto space-y-2">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <p className="text-sm font-bold text-slate-900">No Registered Hospital Domain Found</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  No published hospital matched "{trimmedQuery}". Please verify the domain name or contact the hospital admin.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Privacy Shield Notice */}
        <div className="max-w-xl mx-auto text-center pt-6">
          <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-200 text-slate-600 text-xs flex items-center justify-center gap-2 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#FF3030] shrink-0" />
            <span>Protected Multi-Tenant Architecture. Hospital network directory is hidden to preserve tenant privacy.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalPortalGateway;
