import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Sliders,
  Palette,
  Layout,
  Layers,
  Sparkles,
  ChevronUp,
  ChevronDown,
  EyeOff,
  CheckCircle2,
  Globe,
  Upload,
  RefreshCw,
  Search,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import {
  HospitalWebsite,
  WebsiteSection,
  WebsiteSectionType,
  WebsiteTemplateId,
} from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { HospitalPublicWebsite } from '../../public/HospitalPublicWebsite';

export const WebsiteBuilder: React.FC = () => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [website, setWebsite] = useState<HospitalWebsite | null>(null);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'template' | 'theme' | 'seo'>('sections');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';
  const isSuperAdminManager = user?.role === 'super_admin_manager';
  const isAuthorizedToEdit = isSuperAdmin || isSuperAdminManager;

  useEffect(() => {
    if (!isAuthorizedToEdit) {
      showToast('Unauthorized Access', 'Only Super Admin or Super Admin Managers can access Website Builder.', 'error');
      navigate('/unauthorized');
      return;
    }

    if (hospitalId) {
      const existingWeb = MockStorage.getWebsiteByHospitalId(hospitalId);
      if (existingWeb) {
        setWebsite(existingWeb);
      } else {
        const hosp = MockStorage.getHospitalById(hospitalId);
        if (hosp) {
          const newWeb: HospitalWebsite = {
            id: `WEB-${hosp.id}`,
            hospitalId: hosp.id,
            hospitalName: hosp.name,
            subdomain: `${hosp.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.pulsecorehealth.com`,
            customDomain: `www.${hosp.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
            domainStatus: 'connected',
            status: 'draft',
            published: false,
            templateId: 'premium-healthcare',
            theme: 'Modern Teal',
            primaryColor: '#0d9488',
            secondaryColor: '#0284c7',
            heroTitle: `World-Class Care at ${hosp.name}`,
            heroDescription: '24/7 Tertiary care, specialized OPD clinics, and advanced inpatient medicine.',
            lastDeployedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            monthlyVisitors: 0,
            onlineBookingEnabled: true,
            emergencyBannerEnabled: true,
          };
          MockStorage.saveWebsite(newWeb);
          setWebsite(newWeb);
        }
      }

      const secList = MockStorage.getWebsiteSections(hospitalId);
      setSections(secList.sort((a, b) => a.displayOrder - b.displayOrder));
      if (secList.length > 0) {
        setActiveSectionId(secList[0].id);
      }
    }
  }, [hospitalId, isAuthorizedToEdit]);

  if (!website) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading website builder...
      </div>
    );
  }

  const activeSection = sections.find((s) => s.id === activeSectionId);

  // Section Controls
  const toggleSectionEnabled = (id: string) => {
    const updated = sections.map((s) => (s.id === id ? { ...s, isEnabled: !s.isEnabled } : s));
    setSections(updated);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const nextSections = [...sections];
    const temp = nextSections[index];
    nextSections[index] = nextSections[targetIdx];
    nextSections[targetIdx] = temp;

    // re-index displayOrder
    const reordered = nextSections.map((sec, idx) => ({ ...sec, displayOrder: idx + 1 }));
    setSections(reordered);
  };

  const updateActiveSectionContent = (key: string, val: any) => {
    if (!activeSectionId) return;
    setSections(sections.map((s) => (s.id === activeSectionId ? { ...s, [key]: val } : s)));
  };

  const updateActiveSectionSettings = (key: string, val: any) => {
    if (!activeSectionId) return;
    setSections(
      sections.map((s) =>
        s.id === activeSectionId ? { ...s, settings: { ...s.settings, [key]: val } } : s
      )
    );
  };

  // Actions
  const handleSaveDraft = () => {
    if (!website) return;
    const updatedWeb: HospitalWebsite = {
      ...website,
      status: 'draft',
      updatedAt: new Date().toISOString(),
      draftConfig: {
        templateId: website.templateId,
        theme: website.theme,
        primaryColor: website.primaryColor,
        secondaryColor: website.secondaryColor,
        heroTitle: website.heroTitle,
        heroDescription: website.heroDescription,
        heroImage: website.heroImage,
        seoTitle: website.seoTitle,
        seoDescription: website.seoDescription,
        sections,
      },
    };
    MockStorage.saveWebsite(updatedWeb);
    MockStorage.saveWebsiteSections(website.hospitalId, sections);
    setWebsite(updatedWeb);
    showToast('Draft Saved', 'Website changes saved as draft. Public visitors will see the published version until you click Publish.', 'info');
  };

  const handlePublish = () => {
    if (!website) return;
    const updatedWeb: HospitalWebsite = {
      ...website,
      status: 'published',
      published: true,
      lastDeployedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      updatedAt: new Date().toISOString(),
    };
    MockStorage.saveWebsite(updatedWeb);
    MockStorage.saveWebsiteSections(website.hospitalId, sections);
    setWebsite(updatedWeb);
    showToast('Website Published!', `Public URL live at https://${website.subdomain}`, 'success');
  };

  const handleUnpublish = () => {
    if (!website) return;
    const updatedWeb: HospitalWebsite = {
      ...website,
      status: 'draft',
      published: false,
    };
    MockStorage.saveWebsite(updatedWeb);
    setWebsite(updatedWeb);
    showToast('Website Unpublished', 'Site is now in maintenance mode.', 'warning');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-900 text-slate-100 font-sans -m-6 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/platform/websites')}
            className="text-slate-400 hover:text-white"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div className="h-5 w-px bg-slate-800" />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-sm text-white">{website.hospitalName}</h1>
              {website.published ? (
                <Badge variant="success" size="sm" dot>Published</Badge>
              ) : (
                <Badge variant="warning" size="sm" dot>Drafting</Badge>
              )}
            </div>
            <p className="text-[11px] text-teal-400 font-mono">
              https://{website.subdomain}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreviewModalOpen(true)}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Full Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Draft
          </Button>
          {website.published ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnpublish}
              className="border-rose-800 text-rose-300 hover:bg-rose-950/50"
            >
              Unpublish
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handlePublish}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold"
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Publish Live
            </Button>
          )}
        </div>
      </header>

      {/* 3-Column Studio Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Sections & Controls */}
        <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0">
          <div className="flex border-b border-slate-800 text-xs font-semibold text-slate-400">
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                activeTab === 'sections' ? 'border-teal-500 text-teal-400 font-bold bg-slate-900/50' : 'border-transparent hover:text-slate-200'
              }`}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                activeTab === 'template' ? 'border-teal-500 text-teal-400 font-bold bg-slate-900/50' : 'border-transparent hover:text-slate-200'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                activeTab === 'theme' ? 'border-teal-500 text-teal-400 font-bold bg-slate-900/50' : 'border-transparent hover:text-slate-200'
              }`}
            >
              Theme
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'sections' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>Page Layout Order</span>
                  <span>{sections.filter((s) => s.isEnabled).length} Enabled</span>
                </div>
                {sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      activeSectionId === sec.id
                        ? 'bg-teal-950/60 border-teal-500 text-white shadow-md'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionEnabled(sec.id);
                        }}
                        className={`p-1 rounded ${sec.isEnabled ? 'text-teal-400 bg-teal-500/10' : 'text-slate-600 bg-slate-800'}`}
                      >
                        {sec.isEnabled ? <CheckCircle2 className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <div>
                        <p className="text-xs font-bold capitalize">{sec.sectionType.replace('_', ' ')}</p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{sec.title}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={idx === 0}
                        onClick={() => moveSection(idx, 'up')}
                        className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={idx === sections.length - 1}
                        onClick={() => moveSection(idx, 'down')}
                        className="p-1 text-slate-500 hover:text-slate-200 disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'template' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Design Template</div>
                {[
                  { id: 'premium-healthcare', name: 'Premium Healthcare', desc: 'Sleek white marble, teal accents, and modern clinical card layouts.' },
                  { id: 'modern-hospital', name: 'Modern Hospital', desc: 'Bold navy typography, broad hero banners, and active emergency stats.' },
                  { id: 'luxury-medical', name: 'Luxury Medical Center', desc: 'Minimalist luxury spacing with high-contrast specialist rosters.' },
                ].map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => setWebsite({ ...website, templateId: tpl.id as WebsiteTemplateId })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      website.templateId === tpl.id
                        ? 'bg-teal-950/60 border-teal-500 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-white">{tpl.name}</h4>
                      {website.templateId === tpl.id && <Badge variant="success" size="sm">Active</Badge>}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{tpl.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'theme' && (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Theme Palette</label>
                  <Select
                    value={website.theme}
                    onChange={(e) => setWebsite({ ...website, theme: e.target.value as any })}
                    className="bg-slate-900 border-slate-800 text-white text-xs"
                  >
                    <option value="Modern Teal">Modern Teal</option>
                    <option value="Deep Ocean">Deep Ocean</option>
                    <option value="Healthcare Classic">Healthcare Classic</option>
                    <option value="Clean Minimal">Clean Minimal</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Primary Color Hex</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={website.primaryColor || '#0d9488'}
                      onChange={(e) => setWebsite({ ...website, primaryColor: e.target.value })}
                      className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={website.primaryColor || '#0d9488'}
                      onChange={(e) => setWebsite({ ...website, primaryColor: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MIDDLE COLUMN: Interactive Live Canvas Preview */}
        <main className="flex-1 bg-slate-950 p-6 overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden bg-white text-slate-900 min-h-[600px] flex flex-col">
            {/* Simulated Browser Address Bar */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div className="flex items-center space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="font-mono text-[11px] bg-white border border-slate-200 rounded px-4 py-0.5 text-slate-700">
                https://{website.subdomain}
              </div>
              <span className="text-[10px] text-teal-700 font-bold uppercase">Live Preview Canvas</span>
            </div>

            {/* Live Rendered Canvas */}
            <div className="flex-1 overflow-y-auto">
              <HospitalPublicWebsite hospitalId={website.hospitalId} customSections={sections} />
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: Active Section Content Editor */}
        <aside className="w-80 bg-slate-950 border-l border-slate-800 p-4 flex flex-col shrink-0 overflow-y-auto space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-teal-400">Section Settings</h3>
            <p className="text-[11px] text-slate-400 capitalize">{activeSection?.sectionType.replace('_', ' ') || 'Select a section'}</p>
          </div>

          {activeSection ? (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Section Title</label>
                <input
                  type="text"
                  value={activeSection.title || ''}
                  onChange={(e) => updateActiveSectionContent('title', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-white text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {activeSection.subtitle !== undefined && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Section Subtitle</label>
                  <input
                    type="text"
                    value={activeSection.subtitle || ''}
                    onChange={(e) => updateActiveSectionContent('subtitle', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-white text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              )}

              {activeSection.content !== undefined && (
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Body Content</label>
                  <textarea
                    rows={4}
                    value={activeSection.content || ''}
                    onChange={(e) => updateActiveSectionContent('content', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-white text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              )}

              {activeSection.sectionType === 'hero' && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="block text-teal-400 font-bold text-[11px] uppercase tracking-wider">
                    Hero Background Media
                  </label>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Media Type</label>
                    <select
                      value={activeSection.settings?.heroBgType || 'image'}
                      onChange={(e) =>
                        updateActiveSectionSettings('heroBgType', e.target.value as 'image' | 'video')
                      }
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white text-xs focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="image">🖼️ Background Image</option>
                      <option value="video">🎥 Background Video (.mp4)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      {activeSection.settings?.heroBgType === 'video' ? 'Background Video URL (.mp4)' : 'Background Image URL'}
                    </label>
                    <input
                      type="text"
                      value={activeSection.settings?.heroBgUrl || activeSection.imageUrl || ''}
                      onChange={(e) => {
                        updateActiveSectionSettings('heroBgUrl', e.target.value);
                        updateActiveSectionContent('imageUrl', e.target.value);
                      }}
                      placeholder={
                        activeSection.settings?.heroBgType === 'video'
                          ? 'https://example.com/hospital-intro.mp4'
                          : '/hero_bg_banner_1790314222005.jpg'
                      }
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white text-xs font-mono focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Feature / Section Image URL</label>
                <input
                  type="text"
                  value={activeSection.imageUrl || ''}
                  onChange={(e) => updateActiveSectionContent('imageUrl', e.target.value)}
                  placeholder="/light_hero_bg_1790313418511.jpg"
                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-white text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-800">
                <label className="flex items-center space-x-2 text-slate-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeSection.isEnabled}
                    onChange={() => toggleSectionEnabled(activeSection.id)}
                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-700 bg-slate-900"
                  />
                  <span>Show Section on Public Website</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a section from the left column to edit its content.
            </div>
          )}
        </aside>
      </div>

      {/* Full Screen Preview Modal */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Live Fullscreen Preview — ${website.hospitalName}`}
        subtitle={`Resolving tenant target: ${website.subdomain}`}
        maxWidth="4xl"
      >
        <div className="max-h-[75vh] overflow-y-auto border border-slate-200 rounded-xl">
          <HospitalPublicWebsite hospitalId={website.hospitalId} customSections={sections} />
        </div>
      </Modal>
    </div>
  );
};
