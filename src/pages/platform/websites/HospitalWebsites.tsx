import React, { useState, useEffect } from 'react';
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
  Tablet,
  Monitor,
  Trash2,
  Lock,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { HospitalWebsite } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useNotification } from '../../../context/NotificationContext';
import { HospitalPublicWebsite } from '../../public/HospitalPublicWebsite';

export const HospitalWebsites: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [websites, setWebsites] = useState<HospitalWebsite[]>(() => MockStorage.getWebsites());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWeb, setSelectedWeb] = useState<HospitalWebsite | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshData = () => {
    setWebsites(MockStorage.getWebsites());
  };

  useEffect(() => {
    const handleStorageSync = () => {
      setWebsites(MockStorage.getWebsites());
    };
    window.addEventListener('pulse_storage_updated', handleStorageSync);
    window.addEventListener('storage', handleStorageSync);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleStorageSync);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  const filtered = websites.filter(
    (w) =>
      w.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.subdomain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.customDomain && w.customDomain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const publishedCount = websites.filter((w) => w.status === 'published' || w.published === true).length;
  const draftCount = websites.length - publishedCount;

  const handlePreview = (web: HospitalWebsite) => {
    setSelectedWeb(web);
    setIsPreviewOpen(true);
  };

  const handleOpenConfig = (web: HospitalWebsite) => {
    setSelectedWeb(web);
    setIsConfigOpen(true);
  };

  const handleTogglePublish = (web: HospitalWebsite) => {
    const isNowPublished = MockStorage.toggleWebsitePublish(web.id);
    showToast(
      isNowPublished ? 'Website Published & Live' : 'Website Moved to Draft',
      isNowPublished
        ? `${web.hospitalName} is now immediately visible on the Public Directory (Select Your Hospital Website).`
        : `${web.hospitalName} is now in draft mode and hidden from the Public Directory.`,
      isNowPublished ? 'success' : 'warning'
    );
    refreshData();
    if (selectedWeb && selectedWeb.id === web.id) {
      setSelectedWeb({
        ...selectedWeb,
        status: isNowPublished ? 'published' : 'draft',
        published: isNowPublished,
      });
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWeb) {
      const isPub = selectedWeb.status === 'published';
      const updated = {
        ...selectedWeb,
        status: (isPub ? 'published' : 'draft') as 'published' | 'draft',
        published: isPub,
      };
      MockStorage.saveWebsite(updated);
      showToast('Website Configured', 'Domain routing and publication parameters updated.');
      setIsConfigOpen(false);
      refreshData();
    }
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      MockStorage.deleteWebsite(confirmDeleteId);
      showToast('Website Deleted', 'Hospital website portal removed.');
      setConfirmDeleteId(null);
      refreshData();
    }
  };

  const handleCopySubdomain = (web: HospitalWebsite) => {
    const url = `https://${web.customDomain || web.subdomain}`;
    navigator.clipboard.writeText(url);
    setCopiedId(web.id);
    showToast('Copied to Clipboard', url, 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSyncNetwork = () => {
    const synced = MockStorage.getWebsites();
    setWebsites(synced);
    showToast('Network Synchronized', `All ${synced.length} hospital websites are verified and in sync.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Multi-Tenant Hospital Websites & Custom Domains"
        subtitle="Manage white-label public patient portals, automated SSL certificates, custom domain mapping, and portal lifecycles."
        breadcrumbs={[{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Hospital Websites' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncNetwork}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Sync Network Sites
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

      {/* Directory Synchronization Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white border border-teal-800/60 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Public Directory Synchronization Status
              </h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Live Sync Enabled
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Currently, <strong className="text-teal-300">{publishedCount} published websites</strong> are live and accessible on the public{' '}
              <strong className="text-white">"Select Your Hospital Website"</strong> directory page.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          <div className="text-right hidden lg:block mr-2">
            <span className="text-[11px] text-slate-400 block font-medium">Published / Draft</span>
            <span className="text-xs font-bold text-teal-300 font-mono">
              {publishedCount} Live • {draftCount} Draft
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/select-hospital')}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/20 w-full sm:w-auto"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View Directory Page
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by hospital name or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{filtered.length}</strong> website portals ({publishedCount} published)
          </p>
        </div>
      </Card>

      {/* Website Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((web) => {
          const isPublished = web.status === 'published' || web.published === true;
          return (
            <Card key={web.id} className="overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-slate-900">{web.hospitalName}</h3>
                    {isPublished ? (
                      <Badge variant="success" size="sm" dot>Published & Live</Badge>
                    ) : (
                      <Badge variant="warning" size="sm" dot>Draft Mode</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-indigo-600 font-mono flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      https://{web.subdomain}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopySubdomain(web)}
                      className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedId === web.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-md font-semibold text-slate-700 shadow-2xs">
                    {web.theme || 'Modern Teal'}
                  </span>
                  <button
                    onClick={() => setConfirmDeleteId(web.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Hospital Website"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <CardContent className="space-y-4 pt-4">
                {/* Publication Switch Row */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Directory Publication Status</span>
                    <span className="text-[11px] text-slate-500">
                      {isPublished
                        ? '✓ Visible to patients on Select Hospital Directory'
                        : '⚠ Draft mode — hidden from public directory'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePublish(web)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      isPublished
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    }`}
                  >
                    {isPublished ? (
                      <>
                        <ToggleRight className="w-4 h-4" /> Published
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-amber-700" /> Click to Publish
                      </>
                    )}
                  </button>
                </div>

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
                      <ShieldCheck className="w-3.5 h-3.5" /> Wildcard SSL Active
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500">Monthly Visitors:</span>
                    <span className="font-bold text-slate-900">{(web.monthlyVisitors || 120).toLocaleString()} views</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Last Live Deploy:</span>
                    <span className="text-slate-700 font-mono text-[11px]">{web.lastDeployedAt || 'Recent'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <Button
                    variant="primary"
                    size="xs"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold cursor-pointer"
                    onClick={() => navigate(`/platform/websites/builder/${web.hospitalId}`)}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Open Builder
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handlePreview(web)}
                    leftIcon={<Eye className="w-3.5 h-3.5 text-indigo-600" />}
                    className="cursor-pointer font-bold"
                  >
                    Preview
                  </Button>
                  <a href={`/hospital-site/${web.hospitalId}`} target="_blank" rel="noopener noreferrer">
                    <Button
                      variant="outline"
                      size="xs"
                      leftIcon={<ExternalLink className="w-3.5 h-3.5 text-indigo-600" />}
                      className="cursor-pointer"
                    >
                      Public Site
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleOpenConfig(web)}
                    leftIcon={<Settings className="w-3.5 h-3.5 text-slate-600" />}
                    className="cursor-pointer"
                  >
                    Domain
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Website Live Preview Modal — Renders Authentic Built Website */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-600 border border-teal-200">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900">
                Live Website Preview — {selectedWeb?.hospitalName}
              </span>
            </div>
          </div>
        }
        subtitle="Simulated real-time patient landing page and custom sections designed for this facility"
        maxWidth="7xl"
      >
        {selectedWeb && (
          <div className="space-y-4">
            {/* Top Browser Frame Bar with Viewport Switcher & Actions */}
            <div className="bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3">
              {/* Traffic Lights & URL */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="inline-flex items-center gap-1.5 font-mono bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-slate-300 text-xs shadow-inner">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>https://{selectedWeb.customDomain || selectedWeb.subdomain}</span>
                </div>
              </div>

              {/* Responsive Device Viewport Switcher */}
              <div className="inline-flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewViewport('desktop')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewViewport === 'desktop' ? 'bg-teal-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('tablet')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewViewport === 'tablet' ? 'bg-teal-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" /> Tablet (768px)
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewViewport('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewViewport === 'mobile' ? 'bg-teal-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" /> Mobile (390px)
                </button>
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(selectedWeb)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedWeb.status === 'published' || selectedWeb.published
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  }`}
                >
                  {selectedWeb.status === 'published' || selectedWeb.published ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Published
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" /> Publish Now
                    </>
                  )}
                </button>

                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    navigate(`/platform/websites/builder/${selectedWeb.hospitalId}`);
                  }}
                  leftIcon={<Sparkles className="w-3 h-3 text-teal-400" />}
                  className="bg-slate-800 text-black border-slate-700 hover:bg-slate-700"
                >
                  Edit in Builder
                </Button>

                <a href={`/hospital-site/${selectedWeb.hospitalId}`} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="outline"
                    size="xs"
                    leftIcon={<ExternalLink className="w-3 h-3 text-teal-400" />}
                    className="bg-slate-800 text-black border-slate-700 hover:bg-slate-700"
                  >
                    Open Tab
                  </Button>
                </a>
              </div>
            </div>

            {/* Simulated Frame Container with Actual Hospital Public Website Component */}
            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 flex justify-center overflow-hidden min-h-[600px] max-h-[75vh]">
              <div
                className={`transition-all duration-300 overflow-y-auto rounded-xl border border-slate-800 shadow-2xl bg-white ${
                  previewViewport === 'desktop'
                    ? 'w-full'
                    : previewViewport === 'tablet'
                    ? 'w-[768px] border-8 border-slate-800 rounded-3xl'
                    : 'w-[390px] border-8 border-slate-800 rounded-4xl'
                }`}
              >
                <HospitalPublicWebsite
                  hospitalId={selectedWeb.hospitalId}
                  customWebsite={selectedWeb}
                  customSections={MockStorage.getWebsiteSections(selectedWeb.hospitalId)}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Domain Configuration Modal */}
      <Modal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        title="Domain Routing & SSL Configuration"
        subtitle="Configure custom domain routing, SSL certificates, and website publication status"
      >
        {selectedWeb && (
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <Input
              label="Subdomain Alias"
              value={selectedWeb.subdomain}
              onChange={(e) => setSelectedWeb({ ...selectedWeb, subdomain: e.target.value })}
              required
            />
            <Input
              label="Custom Domain (CNAME target)"
              value={selectedWeb.customDomain || ''}
              onChange={(e) => setSelectedWeb({ ...selectedWeb, customDomain: e.target.value })}
              placeholder="e.g. www.apexhealth.org"
            />
            <Select
              label="Website Publication Status"
              value={selectedWeb.status}
              onChange={(e) =>
                setSelectedWeb({
                  ...selectedWeb,
                  status: e.target.value as any,
                  published: e.target.value === 'published',
                })
              }
            >
              <option value="published">Published & Live (Visible on Directory)</option>
              <option value="draft">Draft Mode (Hidden from Directory)</option>
            </Select>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Directory Sync Rule:</p>
              <p>
                When set to <strong>Published & Live</strong>, this hospital will immediately appear for selection in{' '}
                <span className="font-mono text-teal-700">/select-hospital</span>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsConfigOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Domain Configuration
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Hospital Website"
        message="Are you sure you want to delete this hospital website portal? The custom domain routing and public directory listing will be disconnected."
        confirmText="Delete Website"
        variant="danger"
      />
    </div>
  );
};

export default HospitalWebsites;
