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
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col justify-center text-slate-800 selection:bg-teal-600 selection:text-white relative py-12"
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-100/90 border border-teal-200 text-teal-800 text-xs font-bold shadow-xs">
            <Globe className="w-4 h-4 text-teal-600" />
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
            <div className="relative flex items-center shadow-xl rounded-full border border-slate-300/90 bg-white p-1.5 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all">
              <Search className="w-5 h-5 text-teal-600 ml-4 shrink-0" />
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
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-6 py-3 rounded-full shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                Search <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Helper domain suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-semibold">Example Domains:</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('apexmedical');
                setIsSearched(true);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-200/80 hover:bg-teal-100 text-slate-700 hover:text-teal-900 font-mono text-[11px] transition-colors cursor-pointer"
            >
              apexmedical.pulsecorehealth.com
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('stjude');
                setIsSearched(true);
              }}
              className="px-2.5 py-1 rounded-full bg-slate-200/80 hover:bg-teal-100 text-slate-700 hover:text-teal-900 font-mono text-[11px] transition-colors cursor-pointer"
            >
              stjude.pulsecorehealth.com
            </button>
          </div>
        </div>

        {/* Search Results Display (Only shown when searching or if query matches) */}
        {trimmedQuery && (
          <div className="space-y-4 max-w-2xl mx-auto pt-4">
            <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <span>Domain Search Results ({searchResults.length})</span>
              <span className="font-mono text-teal-700">Query: "{trimmedQuery}"</span>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((hosp) => {
                  const website = MockStorage.getWebsiteByHospitalId(hosp.id);
                  return (
                    <div
                      key={hosp.id}
                      onClick={() => handleSelectHospital(hosp)}
                      className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-md p-5 hover:shadow-xl hover:border-teal-500 transition-all cursor-pointer group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-600 text-white flex items-center justify-center font-bold shadow-md shrink-0">
                          <Activity className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-extrabold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                              {hosp.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                              {hosp.websiteUrl || `https://${hosp.id.toLowerCase()}.pulsecorehealth.com`}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {hosp.city}, {hosp.state} • {hosp.totalBeds} Beds • 24/7 OPD
                          </p>
                        </div>
                      </div>

                      <Button variant="primary" size="sm" className="bg-teal-600 hover:bg-teal-700 shrink-0 rounded-xl">
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
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Protected Multi-Tenant Architecture. Hospital network directory is hidden to preserve tenant privacy.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalPortalGateway;
