import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Settings,
  Sparkles,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { HospitalWebsite } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useNotification } from '../../../context/NotificationContext';

export const HospitalWebsites: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [websites, setWebsites] = useState<HospitalWebsite[]>(() => MockStorage.getWebsites());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeb, setSelectedWeb] = useState<HospitalWebsite | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const refreshData = () => {
    setWebsites(MockStorage.getWebsites());
  };

  const filtered = websites.filter(
    (w) =>
      w.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.customDomain && w.customDomain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handlePreview = (web: HospitalWebsite) => {
    setSelectedWeb(web);
    setIsPreviewOpen(true);
  };

  const handleOpenConfig = (web: HospitalWebsite) => {
    setSelectedWeb(web);
    setIsConfigOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWeb) {
      MockStorage.saveWebsite(selectedWeb);
      showToast('Website Configured', 'Domain routing and theme preferences updated.');
      setIsConfigOpen(false);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Multi-Tenant Hospital Websites & Custom Domains"
        subtitle="Manage white-label public patient portals, automated SSL certificates, and custom domain mapping."
        breadcrumbs={[{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Hospital Websites' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => showToast('DNS Engine Healthy', 'All edge CDN nodes synchronized')}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Verify Edge DNS
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (websites.length > 0) {
                  handleOpenConfig(websites[0]);
                }
              }}
              leftIcon={<Globe className="w-3.5 h-3.5" />}
            >
              Configure Hospital Site
            </Button>
          </div>
        }
      />

      {/* Website Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((web) => (
          <Card key={web.id} className="overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900">{web.hospitalName}</h3>
                  {web.status === 'published' ? (
                    <Badge variant="success" size="sm" dot>Published</Badge>
                  ) : (
                    <Badge variant="neutral" size="sm" dot>Draft</Badge>
                  )}
                </div>
                <p className="text-xs text-indigo-600 font-mono mt-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  https://{web.subdomain}
                </p>
              </div>
              <span className="text-xs px-2 py-1 bg-slate-100 rounded-md font-semibold text-slate-700">
                {web.theme}
              </span>
            </div>

            <CardContent className="space-y-4">
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Custom Domain:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {web.customDomain || 'Not configured'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">SSL / TLS Status:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Wildcard SSL Auto-Renewed
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Monthly Visitors:</span>
                  <span className="font-bold text-slate-900">{web.monthlyVisitors.toLocaleString()} views</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Last Live Deploy:</span>
                  <span className="text-slate-700">{web.lastDeployedAt}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button
                  variant="primary"
                  size="xs"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold"
                  onClick={() => navigate(`/platform/websites/builder/${web.hospitalId}`)}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Open Builder
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handlePreview(web)}
                  leftIcon={<Eye className="w-3.5 h-3.5" />}
                >
                  Preview
                </Button>
                <a href={`/hospital-site/${web.hospitalId}`} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="xs"
                    leftIcon={<ExternalLink className="w-3.5 h-3.5 text-indigo-600" />}
                  >
                    Public Site
                  </Button>
                </a>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleOpenConfig(web)}
                  leftIcon={<Settings className="w-3.5 h-3.5" />}
                >
                  Domain
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Website Live Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <span>Public Patient Portal Preview — {selectedWeb?.hospitalName}</span>
          </div>
        }
        subtitle="Simulated responsive hospital frontend landing page"
        maxWidth="4xl"
      >
        {selectedWeb && (
          <div className="space-y-6">
            {/* Mock Browser Header */}
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="bg-slate-100 px-4 py-2 flex items-center gap-2 border-b border-slate-200 text-xs text-slate-500">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 text-center font-mono bg-white px-3 py-1 rounded-md border border-slate-200 text-slate-700 text-[11px] truncate">
                  https://{selectedWeb.customDomain || selectedWeb.subdomain}
                </div>
              </div>

              {/* Simulated Landing Page Content */}
              <div className="p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="font-bold text-lg text-teal-400 tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> {selectedWeb.hospitalName}
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-300">
                    <span>Specialties</span>
                    <span>Our Doctors</span>
                    <span>Emergency: 911</span>
                    <button className="px-3 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs">
                      Book Appointment
                    </button>
                  </div>
                </div>

                <div className="max-w-xl space-y-3 py-6">
                  <span className="text-xs uppercase font-mono tracking-widest text-teal-400 font-bold">
                    Trusted Healthcare Excellence
                  </span>
                  <h2 className="text-3xl font-extrabold leading-tight">
                    World-Class Medical Care at {selectedWeb.hospitalName}
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    24/7 emergency response, modern outpatient care, advanced diagnostics, and dedicated specialist consultations.
                  </p>
                  <div className="pt-2 flex gap-3">
                    <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-lg">
                      Schedule Telehealth / OPD Visit
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700">
                      View Clinical Services
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Domain Settings Modal */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Custom Domain & Branding Configuration"
        subtitle="Manage DNS CNAME mappings and hospital portal theme"
        maxWidth="md"
      >
        {selectedWeb && (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <Input
              label="PulseCore Subdomain"
              value={selectedWeb.subdomain}
              disabled
              helperText="Managed automatically by the platform"
            />

            <Input
              label="Custom Domain (e.g. www.apexhealth.org)"
              value={selectedWeb.customDomain || ''}
              onChange={(e) => setSelectedWeb({ ...selectedWeb, customDomain: e.target.value })}
              placeholder="www.hospitalname.org"
              helperText="Point your DNS CNAME record to cname.pulsecorehealth.com"
            />

            <Select
              label="Portal UI Color Theme"
              value={selectedWeb.theme}
              onChange={(e) => setSelectedWeb({ ...selectedWeb, theme: e.target.value as any })}
            >
              <option value="Modern Teal">Modern Teal (Recommended)</option>
              <option value="Deep Ocean">Deep Ocean</option>
              <option value="Healthcare Classic">Healthcare Classic</option>
              <option value="Clean Minimal">Clean Minimal</option>
            </Select>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsConfigOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Domain Settings
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
