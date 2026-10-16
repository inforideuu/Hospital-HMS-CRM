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
  ShieldCheck,
  Building2,
  MapPin,
  PhoneCall,
  Plus,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
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

import { ErrorBoundary } from '../../../components/common/ErrorBoundary';
import { compressImage } from '../../../utils/imageCompressor';

export const WebsiteBuilder: React.FC = () => {
  const { hospitalId } = useParams<{ hospitalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [website, setWebsite] = useState<HospitalWebsite | null>(null);
  const [sections, setSections] = useState<WebsiteSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sections' | 'template' | 'theme' | 'branding'>('sections');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isCompressingLogo, setIsCompressingLogo] = useState(false);

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

  const handleAddBranchesSection = () => {
    if (!website) return;
    const newSec: WebsiteSection = {
      id: `SEC-BR-${website.hospitalId}-${Date.now()}`,
      websiteId: website.id,
      hospitalId: website.hospitalId,
      sectionType: 'branches',
      title: 'Our Hospital Branches & Healthcare Network',
      subtitle: 'Delivering Clinical Excellence Across Regional Locations',
      content: 'Access our advanced healthcare network, specialized clinical departments, and 24/7 emergency response across all regional branch campuses.',
      displayOrder: sections.length + 1,
      isEnabled: true,
      settings: {
        branchCardCount: 3,
        branchCard1Title: 'ABC Chennai Hospital (Flagship Campus)',
        branchCard1Location: '45 Anna Salai, T. Nagar, Chennai, Tamil Nadu',
        branchCard1Desc: 'Flagship tertiary hospital featuring 24/7 Level-1 trauma care, interventional cardiology, neurology, and 60 inpatient beds.',
        branchCard1Img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
        branchCard1Link: '/hospital/abc-chennai',
        branchCard1Phone: '+91 44 2834 9000',

        branchCard2Title: 'ABC Bangalore Hospital',
        branchCard2Location: '88 Hosur Road, Koramangala 5th Block, Bengaluru, Karnataka',
        branchCard2Desc: 'Comprehensive multispecialty hospital with robotic surgery, pediatric ICU, specialized oncology, and high-tech day surgery suites.',
        branchCard2Img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
        branchCard2Link: '/hospital/abc-bangalore',
        branchCard2Phone: '+91 80 4123 4567',

        branchCard3Title: 'ABC Hyderabad Medical Center',
        branchCard3Location: '12 Cyber Hills, HITEC City, Hyderabad, Telangana',
        branchCard3Desc: 'Specialized digital diagnostic center and orthopedic institute providing advanced joint replacement and rehabilitation therapies.',
        branchCard3Img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
        branchCard3Link: '/hospital/abc-hyderabad',
        branchCard3Phone: '+91 40 6789 1234',
      },
    };
    const updated = [...sections, newSec];
    setSections(updated);
    setActiveSectionId(newSec.id);
    showToast('Branches Section Added', 'Branches section added to layout.', 'success');
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
          <div className="flex border-b border-slate-800 text-xs font-semibold text-slate-400 overflow-x-auto">
            <button
              onClick={() => setActiveTab('sections')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors whitespace-nowrap px-2 ${
                activeTab === 'sections' ? 'border-teal-500 text-teal-400 font-bold bg-slate-900/50' : 'border-transparent hover:text-slate-200'
              }`}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveTab('template')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors whitespace-nowrap px-2 ${
                activeTab === 'template' ? 'border-teal-500 text-teal-400 font-bold bg-slate-900/50' : 'border-transparent hover:text-slate-200'
              }`}
            >
              Templates
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors whitespace-nowrap px-2 ${
                activeTab === 'theme' ? 'border-teal-500 text-teal-400 font-bold bg-slate-900/50' : 'border-transparent hover:text-slate-200'
              }`}
            >
              Theme
            </button>
            <button
              onClick={() => setActiveTab('branding')}
              className={`flex-1 py-3 text-center border-b-2 transition-colors whitespace-nowrap px-2 ${
                activeTab === 'branding' ? 'border-teal-500 text-teal-400 font-bold bg-slate-900/50' : 'border-transparent hover:text-slate-200'
              }`}
            >
              Branding & Logo
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'sections' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>Page Layout Order</span>
                  <span>{sections.filter((s) => s.isEnabled).length} Enabled</span>
                </div>
                {sections
                  .filter((sec) => sec.sectionType !== 'testimonials')
                  .map((sec, idx) => (
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
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionEnabled(sec.id);
                        }}
                        title={sec.isEnabled ? 'Disable Section' : 'Enable Section'}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          sec.isEnabled
                            ? 'text-teal-400 bg-teal-500/10 hover:bg-teal-500/20'
                            : 'text-slate-500 bg-slate-800 hover:bg-slate-700'
                        }`}
                      >
                        {sec.isEnabled ? <CheckCircle2 className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold capitalize">{sec.sectionType.replace('_', ' ')}</p>
                          {sec.sectionType === 'branches' && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              Network
                            </span>
                          )}
                        </div>
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

                {!sections.some((s) => s.sectionType === 'branches') && (
                  <button
                    type="button"
                    onClick={handleAddBranchesSection}
                    className="w-full mt-3 p-3 rounded-xl border border-dashed border-teal-500/50 bg-teal-950/20 hover:bg-teal-950/40 text-teal-400 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Add Branches Section
                  </button>
                )}
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
                  <select
                    value={website.theme || 'Modern Teal'}
                    onChange={(e) => setWebsite({ ...website, theme: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Modern Teal" className="bg-slate-900 text-white font-medium">Modern Teal (Vibrant Teal & Dark Slate)</option>
                    <option value="Deep Ocean" className="bg-slate-900 text-white font-medium">Deep Ocean (Midnight Navy & Indigo)</option>
                    <option value="Healthcare Classic" className="bg-slate-900 text-white font-medium">Healthcare Classic (Clinical Blue & Soft Ice)</option>
                    <option value="Clean Minimal" className="bg-slate-900 text-white font-medium">Clean Minimal (Luxury Emerald & Warm Cream)</option>
                  </select>
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

            {activeTab === 'branding' && (
              <div className="space-y-4 text-xs">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hospital Logo & Navbar Branding</div>

                {/* Current Logo Preview */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">Navbar & Footer Logo Preview:</span>
                  <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-lg border border-slate-800">
                    <img
                      src={website.logoUrl || MockStorage.getHospitalById(website.hospitalId)?.logoUrl || 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80'}
                      alt="Logo Preview"
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 bg-white p-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-xs truncate">{website.hospitalName}</p>
                      <p className="text-[10px] text-teal-400 font-semibold">Live in Navbar & Footer</p>
                    </div>
                  </div>
                </div>

                {/* File Upload Button */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Upload New Logo Image</label>
                  <label className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-teal-500/50 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 font-semibold cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    <span>{isCompressingLogo ? 'Compressing...' : 'Upload Logo File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && website) {
                          try {
                            setIsCompressingLogo(true);
                            const compressed = await compressImage(file, 800, 800, 0.85);
                            setWebsite({ ...website, logoUrl: compressed });
                            showToast('Logo Updated', 'Hospital logo compressed and applied to Navbar and Footer.', 'success');
                          } catch (err) {
                            showToast('Upload Error', 'Could not process logo file.', 'error');
                          } finally {
                            setIsCompressingLogo(false);
                          }
                        }
                      }}
                      disabled={isCompressingLogo}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Paste URL */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Or Paste Image URL</label>
                  <input
                    type="text"
                    value={website.logoUrl || ''}
                    onChange={(e) => setWebsite({ ...website, logoUrl: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-white text-xs font-mono focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                {/* Logo Presets */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-400 block">Quick Select Logo Presets:</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { name: 'Apex Care Center', url: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80' },
                      { name: 'Metro Super-Specialty', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80' },
                      { name: 'St. Jude General', url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80' },
                      { name: 'City Heart Hospital', url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&auto=format&fit=crop&q=80' },
                      { name: 'Specialty Clinic', url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=80' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setWebsite({ ...website, logoUrl: preset.url })}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          website.logoUrl === preset.url
                            ? 'bg-teal-950/60 border-teal-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-7 h-7 rounded-md object-cover bg-white" />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
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
              <HospitalPublicWebsite hospitalId={website.hospitalId} customSections={sections} customWebsite={website} />
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
              {/* Prominent Enable / Disable Toggle Switch for this section */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                  activeSection.isEnabled
                    ? 'bg-teal-950/40 border-teal-500/30'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-xs">Section Visibility</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        activeSection.isEnabled ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {activeSection.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {activeSection.isEnabled
                      ? 'Visible to public website visitors'
                      : 'Hidden from public website visitors'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSectionEnabled(activeSection.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeSection.isEnabled
                      ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30'
                      : 'bg-teal-600 text-white hover:bg-teal-500 shadow-md shadow-teal-600/30'
                  }`}
                >
                  {activeSection.isEnabled ? <EyeOff className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {activeSection.isEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
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

              {activeSection.content !== undefined && activeSection.sectionType !== 'services' && activeSection.sectionType !== 'facilities' && activeSection.sectionType !== 'departments' && activeSection.sectionType !== 'doctors' && activeSection.sectionType !== 'footer' && (
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

              {activeSection.sectionType === 'appointment_cta' && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="block text-teal-400 font-bold text-[11px] uppercase tracking-wider">
                    Appointment Call-To-Action Button
                  </label>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">CTA Button Label Text</label>
                    <input
                      type="text"
                      placeholder="Sign In to Portal"
                      value={activeSection.settings?.buttonText || ''}
                      onChange={(e) => updateActiveSectionSettings('buttonText', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Button Target URL Link</label>
                    <input
                      type="text"
                      placeholder="/login"
                      value={activeSection.settings?.buttonLink || ''}
                      onChange={(e) => updateActiveSectionSettings('buttonLink', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white text-xs font-mono focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              {activeSection.sectionType === 'contact' && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="block text-teal-400 font-bold text-[11px] uppercase tracking-wider">
                    Contact Section 3 Cards Editor
                  </label>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-teal-400 block uppercase">Card 1: Location & Address</span>
                    <div>
                      <label className="block text-slate-400 text-[10px]">Card 1 Title</label>
                      <input
                        type="text"
                        placeholder="Hospital Address"
                        value={(activeSection.settings as any)?.contactCard1Title || ''}
                        onChange={(e) => updateActiveSectionSettings('contactCard1Title', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px]">Full Address</label>
                      <input
                        type="text"
                        placeholder="742 Evergreen Healthcare Blvd, New York, NY"
                        value={(activeSection.settings as any)?.address || ''}
                        onChange={(e) => updateActiveSectionSettings('address', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-teal-400 block uppercase">Card 2: Emergency & Phone</span>
                    <div>
                      <label className="block text-slate-400 text-[10px]">Card 2 Title</label>
                      <input
                        type="text"
                        placeholder="Emergency & Reception"
                        value={(activeSection.settings as any)?.contactCard2Title || ''}
                        onChange={(e) => updateActiveSectionSettings('contactCard2Title', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px]">Emergency Phone Number</label>
                      <input
                        type="text"
                        placeholder="+1 (555) 234-5678"
                        value={(activeSection.settings as any)?.phone || ''}
                        onChange={(e) => updateActiveSectionSettings('phone', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px]">Contact Email</label>
                      <input
                        type="text"
                        placeholder="contact@apexmedical.org"
                        value={(activeSection.settings as any)?.email || ''}
                        onChange={(e) => updateActiveSectionSettings('email', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-teal-400 block uppercase">Card 3: Operating Hours</span>
                    <div>
                      <label className="block text-slate-400 text-[10px]">Card 3 Title</label>
                      <input
                        type="text"
                        placeholder="Operating Hours"
                        value={(activeSection.settings as any)?.contactCard3Title || ''}
                        onChange={(e) => updateActiveSectionSettings('contactCard3Title', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px]">Operating Hours Detail</label>
                      <input
                        type="text"
                        placeholder="24/7 Emergency & ICU • OPD: Mon-Sat 8:00 AM - 6:00 PM"
                        value={(activeSection.settings as any)?.hours || ''}
                        onChange={(e) => updateActiveSectionSettings('hours', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection.sectionType === 'footer' && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="block text-teal-400 font-bold text-[11px] uppercase tracking-wider">
                    Footer Content & Branding Editor
                  </label>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Footer Brand Tagline Paragraph</label>
                    <textarea
                      rows={3}
                      placeholder="The trusted healthcare partner providing advanced..."
                      value={activeSection.content || ''}
                      onChange={(e) => updateActiveSectionContent('content', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Copyright Notice Text</label>
                    <input
                      type="text"
                      placeholder="© 2026 Apex City Medical Center. All rights reserved."
                      value={(activeSection.settings as any)?.copyrightText || activeSection.subtitle || ''}
                      onChange={(e) => {
                        updateActiveSectionSettings('copyrightText', e.target.value);
                        updateActiveSectionContent('subtitle', e.target.value);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white text-xs focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Powered By Badge Text</label>
                    <input
                      type="text"
                      placeholder="HEALTHCORE"
                      value={(activeSection.settings as any)?.poweredBy || ''}
                      onChange={(e) => updateActiveSectionSettings('poweredBy', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white text-xs uppercase tracking-widest focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Location Map Image URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=300&auto=format&fit=crop&q=80"
                      value={(activeSection.settings as any)?.mapImg || ''}
                      onChange={(e) => updateActiveSectionSettings('mapImg', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-white text-xs font-mono focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              )}

              {activeSection.sectionType === 'about' && (
                <div className="space-y-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="block text-teal-400 font-bold text-[11px] uppercase tracking-wider">
                    About Us Statistics Counters
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 font-semibold text-[10px] mb-0.5">Stat 1 Value</label>
                      <input
                        type="text"
                        placeholder="50+"
                        value={activeSection.settings?.stat1Value || ''}
                        onChange={(e) => updateActiveSectionSettings('stat1Value', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold text-[10px] mb-0.5">Stat 1 Label</label>
                      <input
                        type="text"
                        placeholder="Beds Capacity"
                        value={activeSection.settings?.stat1Label || ''}
                        onChange={(e) => updateActiveSectionSettings('stat1Label', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold text-[10px] mb-0.5">Stat 2 Value</label>
                      <input
                        type="text"
                        placeholder="12"
                        value={activeSection.settings?.stat2Value || ''}
                        onChange={(e) => updateActiveSectionSettings('stat2Value', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold text-[10px] mb-0.5">Stat 2 Label</label>
                      <input
                        type="text"
                        placeholder="Specialists"
                        value={activeSection.settings?.stat2Label || ''}
                        onChange={(e) => updateActiveSectionSettings('stat2Label', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold text-[10px] mb-0.5">Stat 3 Value</label>
                      <input
                        type="text"
                        placeholder="8"
                        value={activeSection.settings?.stat3Value || ''}
                        onChange={(e) => updateActiveSectionSettings('stat3Value', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold text-[10px] mb-0.5">Stat 3 Label</label>
                      <input
                        type="text"
                        placeholder="Departments"
                        value={activeSection.settings?.stat3Label || ''}
                        onChange={(e) => updateActiveSectionSettings('stat3Label', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection.sectionType === 'services' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-teal-400 font-bold text-[11px] uppercase tracking-wider font-sans block">
                      Clinical Service Cards ({(activeSection.settings as any)?.serviceCardCount || 6} Items)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const current = (activeSection.settings as any)?.serviceCardCount || 6;
                        updateActiveSectionSettings('serviceCardCount', current + 1);
                      }}
                      className="px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] cursor-pointer"
                    >
                      + Add Card
                    </button>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {Array.from({ length: (activeSection.settings as any)?.serviceCardCount || 6 }, (_, idx) => {
                      const id = idx + 1;
                      const defaultServices = [
                        { title: 'Emergency Trauma & ICU', desc: 'Round-the-clock level 1 emergency care and critical ICU beds.' },
                        { title: 'Advanced Pathology & Imaging', desc: 'High-speed MRI, CT Scans, digital X-Rays and automated lab diagnostics.' },
                        { title: 'Robotic & Minimally Invasive Surgery', desc: 'Precision surgical procedures with faster recovery times.' },
                        { title: 'Cardiovascular Interventions', desc: 'Cath lab angioplasty, pacemaker installations, and cardiac rehab.' },
                        { title: 'Mother & Child Care (NICU)', desc: 'Comprehensive maternity suites and neonatal intensive care.' },
                        { title: 'Tele-Consultation & Home Visits', desc: 'Virtual doctor appointments and emergency home care visits.' },
                      ];
                      const d = defaultServices[idx % defaultServices.length];
                      return (
                        <div key={id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-teal-400 block uppercase">Card {id}</span>
                            {id > 6 && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateActiveSectionSettings(`serviceCard${id}Title`, '');
                                  updateActiveSectionSettings(`serviceCard${id}Desc`, '');
                                }}
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[10px]">Title</label>
                            <input
                              type="text"
                              placeholder={d.title}
                              value={(activeSection.settings as any)?.[`serviceCard${id}Title`] !== undefined ? (activeSection.settings as any)?.[`serviceCard${id}Title`] : d.title}
                              onChange={(e) => updateActiveSectionSettings(`serviceCard${id}Title`, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[10px]">Description</label>
                            <textarea
                              rows={2}
                              placeholder={d.desc}
                              value={(activeSection.settings as any)?.[`serviceCard${id}Desc`] !== undefined ? (activeSection.settings as any)?.[`serviceCard${id}Desc`] : d.desc}
                              onChange={(e) => updateActiveSectionSettings(`serviceCard${id}Desc`, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeSection.sectionType === 'facilities' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="text-teal-400 font-bold text-[11px] uppercase tracking-wider block">
                    Infrastructure Facilities Cards (4 Items)
                  </label>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {[
                      { id: 1, title: 'Modular Operation Theatres', count: '12 OTs' },
                      { id: 2, title: 'ICU & CCU Ventilator Beds', count: '50+ Beds' },
                      { id: 3, title: '24/7 Ambulance Fleet', count: 'GPS Tracked' },
                      { id: 4, title: 'Blood Bank & In-House Pharmacy', count: '24/7 Ready' },
                    ].map((item) => (
                      <div key={item.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                        <span className="text-[10px] font-bold text-teal-400 block uppercase">Facility {item.id}</span>
                        <div>
                          <label className="block text-slate-400 text-[10px]">Title</label>
                          <input
                            type="text"
                            placeholder={item.title}
                            value={(activeSection.settings as any)?.[`facilityCard${item.id}Title`] !== undefined ? (activeSection.settings as any)?.[`facilityCard${item.id}Title`] : item.title}
                            onChange={(e) => updateActiveSectionSettings(`facilityCard${item.id}Title`, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 text-[10px]">Badge / Count Label</label>
                          <input
                            type="text"
                            placeholder={item.count}
                            value={(activeSection.settings as any)?.[`facilityCard${item.id}Count`] !== undefined ? (activeSection.settings as any)?.[`facilityCard${item.id}Count`] : item.count}
                            onChange={(e) => updateActiveSectionSettings(`facilityCard${item.id}Count`, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection.sectionType === 'departments' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-teal-400 font-bold text-[11px] uppercase tracking-wider block">
                      Department Cards & Banner Images ({(activeSection.settings as any)?.deptCardCount || 6} Items)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const current = (activeSection.settings as any)?.deptCardCount || 6;
                        updateActiveSectionSettings('deptCardCount', current + 1);
                      }}
                      className="px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px]"
                    >
                      + Add Card
                    </button>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {Array.from({ length: (activeSection.settings as any)?.deptCardCount || 6 }, (_, idx) => {
                      const id = idx + 1;
                      const defaults = [
                        { title: 'Cardiology & Cardiovascular Sciences', desc: 'Comprehensive non-invasive & catheterization labs for acute heart care.', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80' },
                        { title: 'Neurology & Neurosurgery', desc: 'Advanced brain, spinal cord, stroke rehabilitation, and neuro ICU units.', img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&auto=format&fit=crop&q=80' },
                        { title: 'Pediatric & Neonatal Care', desc: 'Dedicated neonatal intensive care (NICU) and pediatric emergency care.', img: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80' },
                        { title: 'Orthopedics & Joint Reconstruction', desc: 'Arthroscopic surgery, joint replacements, and trauma reconstruction.', img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80' },
                        { title: 'General Internal Medicine & OPD', desc: 'Preventive health checkups, chronic disease management, and outpatient clinics.', img: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&auto=format&fit=crop&q=80' },
                        { title: 'Emergency & Trauma Bay', desc: '24/7 Level-1 trauma response, resuscitations, and stroke code activations.', img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80' },
                      ];
                      const d = defaults[idx % defaults.length];
                      return (
                        <div key={id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 relative group">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-teal-400 uppercase">Department Card {id}</span>
                            {id > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateActiveSectionSettings(`deptCard${id}Title`, '');
                                  updateActiveSectionSettings(`deptCard${id}Desc`, '');
                                  updateActiveSectionSettings(`deptCard${id}Img`, '');
                                }}
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[10px]">Title</label>
                            <input
                              type="text"
                              placeholder={d.title}
                              value={(activeSection.settings as any)?.[`deptCard${id}Title`] !== undefined ? (activeSection.settings as any)?.[`deptCard${id}Title`] : d.title}
                              onChange={(e) => updateActiveSectionSettings(`deptCard${id}Title`, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[10px]">Description</label>
                            <textarea
                              rows={2}
                              placeholder={d.desc}
                              value={(activeSection.settings as any)?.[`deptCard${id}Desc`] !== undefined ? (activeSection.settings as any)?.[`deptCard${id}Desc`] : d.desc}
                              onChange={(e) => updateActiveSectionSettings(`deptCard${id}Desc`, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[10px]">Banner Image URL</label>
                            <input
                              type="text"
                              placeholder={d.img}
                              value={(activeSection.settings as any)?.[`deptCard${id}Img`] !== undefined ? (activeSection.settings as any)?.[`deptCard${id}Img`] : d.img}
                              onChange={(e) => updateActiveSectionSettings(`deptCard${id}Img`, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs font-mono"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeSection.sectionType === 'doctors' && (
                <div className="space-y-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-teal-400 font-bold text-[11px] uppercase tracking-wider block">
                      Specialist Doctors Roster ({(activeSection.settings as any)?.docCardCount || 3} Items)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const current = (activeSection.settings as any)?.docCardCount || 3;
                        updateActiveSectionSettings('docCardCount', current + 1);
                      }}
                      className="px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] cursor-pointer"
                    >
                      + Add Doctor
                    </button>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {Array.from({ length: (activeSection.settings as any)?.docCardCount || 3 }, (_, idx) => {
                      const id = idx + 1;
                      const defaults = [
                        { name: 'Dr. Evelyn Reed, MD', spec: 'Senior Interventional Cardiologist', fee: '₹1,200', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80' },
                        { name: 'Dr. Christopher Shaw, MD', spec: 'Neurologist & Neuro-Oncologist', fee: '₹1,500', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80' },
                        { name: 'Dr. Ananya Roy, MD', spec: 'Pediatric Specialist', fee: '₹800', img: 'https://images.unsplash.com/photo-1594824813566-88855ce78907?w=150&auto=format&fit=crop&q=80' },
                        { name: 'Dr. Rajesh Sharma, MS', spec: 'Orthopedic & Joint Surgeon', fee: '₹1,000', img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80' },
                        { name: 'Dr. Priya Nair, MD', spec: 'Consultant Dermatologist', fee: '₹700', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80' },
                        { name: 'Dr. Vikramaditya Singh, DM', spec: 'Gastroenterologist', fee: '₹1,400', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80' },
                      ];
                      const item = defaults[idx % defaults.length];
                      return (
                        <div key={id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 relative group">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-teal-400 uppercase">Doctor Card {id}</span>
                            {id > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  updateActiveSectionSettings(`docCard${id}Name`, '');
                                  updateActiveSectionSettings(`docCard${id}Spec`, '');
                                  updateActiveSectionSettings(`docCard${id}Fee`, '');
                                  updateActiveSectionSettings(`docCard${id}Img`, '');
                                }}
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[10px]">Doctor Name</label>
                            <input
                              type="text"
                              placeholder={item.name}
                              value={(activeSection.settings as any)?.[`docCard${id}Name`] !== undefined ? (activeSection.settings as any)?.[`docCard${id}Name`] : item.name}
                              onChange={(e) => updateActiveSectionSettings(`docCard${id}Name`, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[10px]">Specialization</label>
                            <input
                              type="text"
                              placeholder={item.spec}
                              value={(activeSection.settings as any)?.[`docCard${id}Spec`] !== undefined ? (activeSection.settings as any)?.[`docCard${id}Spec`] : item.spec}
                              onChange={(e) => updateActiveSectionSettings(`docCard${id}Spec`, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[10px]">OPD Fee Badge (₹)</label>
                            <input
                              type="text"
                              placeholder={item.fee}
                              value={(activeSection.settings as any)?.[`docCard${id}Fee`] !== undefined ? (activeSection.settings as any)?.[`docCard${id}Fee`] : item.fee}
                              onChange={(e) => updateActiveSectionSettings(`docCard${id}Fee`, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[10px]">Photo / Avatar URL</label>
                            <input
                              type="text"
                              placeholder={item.img}
                              value={(activeSection.settings as any)?.[`docCard${id}Img`] !== undefined ? (activeSection.settings as any)?.[`docCard${id}Img`] : item.img}
                              onChange={(e) => updateActiveSectionSettings(`docCard${id}Img`, e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-xs font-mono"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeSection.sectionType === 'testimonials' && (
                <div className="space-y-2.5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-700/50 text-amber-200">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Managed by Hospital Admin</span>
                  </div>
                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Superadmin / Managers can control section visibility and page order. Individual patient reviews, quotes, 3D carousel items, ratings, and avatar photos are exclusively CRUD-managed by the Hospital Admin in Hospital Settings.
                  </p>
                </div>
              )}

              {activeSection.sectionType === 'branches' && (
                <div className="space-y-3.5 p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  {/* Branches Section Enable / Disable Banner */}
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      activeSection.isEnabled
                        ? 'bg-teal-950/50 border-teal-500/40'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2
                        className={`w-5 h-5 ${
                          activeSection.isEnabled ? 'text-teal-400' : 'text-slate-500'
                        }`}
                      />
                      <div>
                        <p className="text-xs font-bold text-white">Branches Section</p>
                        <p className="text-[10px] text-slate-400">
                          {activeSection.isEnabled
                            ? 'Status: ENABLED (Live on website)'
                            : 'Status: DISABLED (Section hidden)'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSectionEnabled(activeSection.id)}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                        activeSection.isEnabled
                          ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30'
                          : 'bg-teal-600 text-white hover:bg-teal-500'
                      }`}
                    >
                      {activeSection.isEnabled ? 'Disable Section' : 'Enable Section'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-teal-400" />
                      <span className="text-teal-400 font-bold text-[11px] uppercase tracking-wider">
                        Branch Cards ({Number((activeSection.settings as any)?.branchCardCount) || 3})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const current = Number((activeSection.settings as any)?.branchCardCount) || 3;
                          if (current < 8) {
                            updateActiveSectionSettings('branchCardCount', current + 1);
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] cursor-pointer"
                      >
                        + Add Card
                      </button>
                      {(Number((activeSection.settings as any)?.branchCardCount) || 3) > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const current = Number((activeSection.settings as any)?.branchCardCount) || 3;
                            updateActiveSectionSettings('branchCardCount', Math.max(1, current - 1));
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] cursor-pointer"
                        >
                          - Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Configure branch facility photo (image), physical location, and clinical capabilities description for each network campus card.
                  </p>

                  <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                    {Array.from(
                      { length: Number((activeSection.settings as any)?.branchCardCount) || 3 },
                      (_, idx) => {
                        const id = idx + 1;
                        const defaultBranchCards = [
                          {
                            title: 'ABC Chennai Hospital (Flagship Campus)',
                            location: '45 Anna Salai, T. Nagar, Chennai, Tamil Nadu',
                            desc: 'Flagship tertiary hospital featuring 24/7 Level-1 trauma care, interventional cardiology, neurology, and 60 inpatient beds.',
                            img: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
                            phone: '+91 44 2834 9000',
                            link: '/hospital/abc-chennai',
                          },
                          {
                            title: 'ABC Bangalore Hospital',
                            location: '88 Hosur Road, Koramangala 5th Block, Bengaluru, Karnataka',
                            desc: 'Comprehensive multispecialty hospital with robotic surgery, pediatric ICU, specialized oncology, and high-tech day surgery suites.',
                            img: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
                            phone: '+91 80 4123 4567',
                            link: '/hospital/abc-bangalore',
                          },
                          {
                            title: 'ABC Hyderabad Medical Center',
                            location: '12 Cyber Hills, HITEC City, Hyderabad, Telangana',
                            desc: 'Specialized digital diagnostic center and orthopedic institute providing advanced joint replacement and rehabilitation therapies.',
                            img: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
                            phone: '+91 40 6789 1234',
                            link: '/hospital/abc-hyderabad',
                          },
                        ];
                        const d = defaultBranchCards[idx % defaultBranchCards.length];

                        const curImg =
                          (activeSection.settings as any)?.[`branchCard${id}Img`] !== undefined
                            ? (activeSection.settings as any)?.[`branchCard${id}Img`]
                            : d.img;
                        const curLocation =
                          (activeSection.settings as any)?.[`branchCard${id}Location`] !== undefined
                            ? (activeSection.settings as any)?.[`branchCard${id}Location`]
                            : d.location;
                        const curDesc =
                          (activeSection.settings as any)?.[`branchCard${id}Desc`] !== undefined
                            ? (activeSection.settings as any)?.[`branchCard${id}Desc`]
                            : d.desc;
                        const curTitle =
                          (activeSection.settings as any)?.[`branchCard${id}Title`] !== undefined
                            ? (activeSection.settings as any)?.[`branchCard${id}Title`]
                            : d.title;
                        const curPhone =
                          (activeSection.settings as any)?.[`branchCard${id}Phone`] !== undefined
                            ? (activeSection.settings as any)?.[`branchCard${id}Phone`]
                            : d.phone;
                        const curLink =
                          (activeSection.settings as any)?.[`branchCard${id}Link`] !== undefined
                            ? (activeSection.settings as any)?.[`branchCard${id}Link`]
                            : d.link;

                        return (
                          <div key={id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                              <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5" />
                                Branch Card #{id}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  updateActiveSectionSettings(`branchCard${id}Title`, '');
                                  updateActiveSectionSettings(`branchCard${id}Location`, '');
                                  updateActiveSectionSettings(`branchCard${id}Desc`, '');
                                  updateActiveSectionSettings(`branchCard${id}Img`, '');
                                  updateActiveSectionSettings(`branchCard${id}Phone`, '');
                                  updateActiveSectionSettings(`branchCard${id}Link`, '');
                                }}
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                              >
                                Clear
                              </button>
                            </div>

                            {/* Branch Title */}
                            <div>
                              <label className="block text-slate-400 text-[10px] font-semibold mb-1">
                                Branch Name / Title
                              </label>
                              <input
                                type="text"
                                placeholder={d.title}
                                value={curTitle}
                                onChange={(e) => updateActiveSectionSettings(`branchCard${id}Title`, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-white text-xs font-medium focus:ring-1 focus:ring-teal-500 focus:outline-none"
                              />
                            </div>

                            {/* Branch Location */}
                            <div>
                              <label className="block text-[10px] font-semibold mb-1 flex items-center gap-1 text-teal-400">
                                <MapPin className="w-3 h-3" /> Branch Location (Address / City)
                              </label>
                              <input
                                type="text"
                                placeholder={d.location}
                                value={curLocation}
                                onChange={(e) => updateActiveSectionSettings(`branchCard${id}Location`, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-white text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
                              />
                            </div>

                            {/* Branch Description */}
                            <div>
                              <label className="block text-slate-400 text-[10px] font-semibold mb-1">
                                Branch Description & Clinical Services
                              </label>
                              <textarea
                                rows={3}
                                placeholder={d.desc}
                                value={curDesc}
                                onChange={(e) => updateActiveSectionSettings(`branchCard${id}Desc`, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-white text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none leading-relaxed"
                              />
                            </div>

                            {/* Branch Image (img) with Preview & Presets */}
                            <div>
                              <label className="block text-slate-400 text-[10px] font-semibold mb-1 flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 text-teal-400" /> Branch Facility Image (img)
                              </label>
                              <input
                                type="text"
                                placeholder={d.img}
                                value={curImg}
                                onChange={(e) => updateActiveSectionSettings(`branchCard${id}Img`, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-white text-xs font-mono focus:ring-1 focus:ring-teal-500 focus:outline-none"
                              />

                              {/* Image Preview & Preset Selector */}
                              <div className="mt-2 flex items-center gap-3">
                                {curImg && (
                                  <img
                                    src={curImg}
                                    alt={`Branch ${id}`}
                                    className="w-16 h-12 object-cover rounded-lg border border-slate-700 shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80';
                                    }}
                                  />
                                )}
                                <div className="flex-1 space-y-1">
                                  <span className="text-[9px] text-slate-500 block uppercase font-mono">Photo Presets:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {[
                                      { name: 'Campus 1', url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80' },
                                      { name: 'Campus 2', url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80' },
                                      { name: 'Campus 3', url: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80' },
                                      { name: 'Campus 4', url: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80' },
                                    ].map((preset, pIdx) => (
                                      <button
                                        key={pIdx}
                                        type="button"
                                        onClick={() => updateActiveSectionSettings(`branchCard${id}Img`, preset.url)}
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-teal-900/60 hover:text-teal-300 text-slate-400 border border-slate-700 transition-colors"
                                      >
                                        {preset.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Additional info: Phone & Route link */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <div>
                                <label className="block text-slate-400 text-[10px] font-semibold mb-1">Phone</label>
                                <input
                                  type="text"
                                  placeholder={d.phone}
                                  value={curPhone}
                                  onChange={(e) => updateActiveSectionSettings(`branchCard${id}Phone`, e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-[11px]"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-400 text-[10px] font-semibold mb-1">Link URL</label>
                                <input
                                  type="text"
                                  placeholder={d.link}
                                  value={curLink}
                                  onChange={(e) => updateActiveSectionSettings(`branchCard${id}Link`, e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 px-2 py-1 rounded text-white text-[11px]"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
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
          <HospitalPublicWebsite hospitalId={website.hospitalId} customSections={sections} customWebsite={website} />
        </div>
      </Modal>
    </div>
  );
};
