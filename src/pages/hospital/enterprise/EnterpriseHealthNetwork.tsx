import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Network,
  Building2,
  FileText,
  Upload,
  Users,
  Bed,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Globe,
  Clock,
  Activity,
  Layers,
  Lock,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { EnterpriseBranchDocument, Hospital } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export const EnterpriseHealthNetwork: React.FC = () => {
  const navigate = useNavigate();
  const { currentHospital, user, switchHospital } = useAuth();
  const { showToast } = useNotification();

  const hospId = currentHospital?.id || user?.hospitalId || 'HOSP-001';
  const hosp = MockStorage.getHospitalById(hospId) || currentHospital;
  const org = hosp?.organizationId ? MockStorage.getOrganizationById(hosp.organizationId) : undefined;

  const [hospitals, setHospitals] = useState<Hospital[]>(() => MockStorage.getHospitals());
  const [enterpriseDoc, setEnterpriseDoc] = useState<EnterpriseBranchDocument | undefined>(() =>
    hosp?.id ? MockStorage.getEnterpriseBranchDocuments(hosp.id)[0] : undefined
  );
  const [isUploading, setIsUploading] = useState(false);

  const refreshData = () => {
    setHospitals(MockStorage.getHospitals());
    if (hosp?.id) {
      setEnterpriseDoc(MockStorage.getEnterpriseBranchDocuments(hosp.id)[0]);
    }
  };

  useEffect(() => {
    const handleSync = () => refreshData();
    window.addEventListener('pulse_storage_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [hosp?.id]);

  // Head Branch & Sub-Branches under this Network
  const headBranch = hosp?.isHeadBranch
    ? hosp
    : hospitals.find((h) => h.id === hosp?.headBranchId || (h.organizationId && h.organizationId === hosp?.organizationId && h.isHeadBranch)) || hosp;

  const subBranches = hospitals.filter(
    (h) =>
      h.headBranchId === headBranch?.id ||
      (headBranch?.organizationId && h.organizationId === headBranch.organizationId && h.id !== headBranch.id)
  );

  const networkHospitals = headBranch ? [headBranch, ...subBranches] : [];

  // Manifest File Upload Handler (Strictly <= 5 MB)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Sub-branch manifest document must be 5 MB or smaller.', 'error');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const newDoc: EnterpriseBranchDocument = {
        id: `ENT-DOC-${Date.now()}`,
        hospitalId: headBranch?.id || hospId,
        hospitalName: headBranch?.name || hosp?.name || 'Hospital Network',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'application/octet-stream',
        fileData: dataUrl,
        uploadedBy: user?.name || 'Network Admin',
        uploadedByEmail: user?.email || headBranch?.adminEmail || '',
        uploadedAt: new Date().toISOString(),
        status: 'pending_review',
        notes: `Proposed sub-branches manifest specification for ${headBranch?.name || hosp?.name}`,
      };

      MockStorage.saveEnterpriseBranchDocument(newDoc);
      setEnterpriseDoc(newDoc);
      setIsUploading(false);
      showToast(
        'Manifest Uploaded Successfully',
        `${file.name} (${(file.size / 1024).toFixed(1)} KB) transmitted to Super Admin desk for branch provisioning.`,
        'success'
      );
    };
    reader.onerror = () => {
      setIsUploading(false);
      showToast('Upload Error', 'Failed to read document file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSwitchToBranch = (branchId: string, branchName: string) => {
    switchHospital(branchId);
    showToast('Workspace Switched', `Now managing ${branchName}.`, 'success');
    navigate('/hospital/dashboard');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Enterprise Health Network"
        subtitle={`Centralized hospital network administration for ${headBranch?.name || hosp?.name}. Each facility operates with 100% isolated patient and doctor databases.`}
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Enterprise Health Network' },
        ]}
        badge={
          <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
            Enterprise Tier
          </span>
        }
      />

      {/* Enterprise Policy & Hierarchy Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Network Facilities</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">{networkHospitals.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">1 Head + {subBranches.length} Sub-Branches</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital Data Isolation</p>
            <p className="text-xl font-bold text-emerald-700 mt-1">100% Isolated</p>
            <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">Zero data sharing across branches</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Head Admin Privilege</p>
            <p className="text-xl font-bold text-indigo-700 mt-1">Universal Login</p>
            <p className="text-[10px] text-indigo-600 mt-0.5 font-medium">Log into all sub-branch portals</p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sub-Branch Manifest</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {enterpriseDoc ? (enterpriseDoc.status === 'provisioned' ? 'Provisioned' : 'Under Review') : 'Upload Pending'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Transmitted to Platform HQ Desk</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <FileText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sub-Branch Manifest Document Upload Section */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/20">
        <CardHeader
          title="Proposed Sub-Branch Manifest Specification"
          subtitle="Upload document containing complete details of all proposed sub-branches (locations, bed capacity, proposed directors)"
        />
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            When you upgrade to the <strong>Enterprise Health Network</strong> plan, your hospital acts as the <strong>Head Branch</strong>. Upload a document (max 5 MB) detailing your proposed sub-branches (e.g. Mumbai, Bangalore). This file is transmitted strictly to <strong>Platform HQ</strong>, where Super Admin and Super Admin Manager download and review the specification to provision the respective sub-branch facilities.
          </p>

          {enterpriseDoc && (
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-slate-900 truncate">{enterpriseDoc.fileName}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      enterpriseDoc.status === 'provisioned'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {enterpriseDoc.status === 'provisioned' ? 'Branches Provisioned by Super Admin' : 'Under Super Admin Review at Platform HQ'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {(enterpriseDoc.fileSize / 1024).toFixed(1)} KB &bull; Uploaded by {enterpriseDoc.uploadedBy} on {new Date(enterpriseDoc.uploadedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-purple-800 bg-white px-3 py-1.5 rounded-lg border border-purple-200 shadow-xs shrink-0">
                Transmitted to Platform HQ
              </div>
            </div>
          )}

          <label className="p-6 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/30 hover:bg-purple-50/70 transition-all flex flex-col items-center justify-center text-center cursor-pointer group">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-full mb-2 group-hover:scale-110 transition-transform shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">
              {enterpriseDoc ? 'Upload New / Replace Manifest File' : 'Upload Proposed Sub-Branch Manifest'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-1 max-w-md">
              Select document containing sub-branch specifications (PDF, Word, Excel, or Text &le; 5 MB).
            </p>
            <span className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600 text-white shadow-xs group-hover:bg-purple-700">
              <Upload className="w-3.5 h-3.5" />
              {isUploading ? 'Uploading...' : 'Select File (Max 5 MB)'}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="hidden"
              disabled={isUploading}
              onChange={handleFileUpload}
            />
          </label>
        </CardContent>
      </Card>

      {/* Sub-Branches Operations & Telemetry Table */}
      <Card>
        <CardHeader
          title="Sub-Branches Directory & Direct Workspace Access"
          subtitle="Each facility maintains 100% isolated patient and doctor databases. Head Branch Admin can log into any branch with their own credentials."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">Hospital Facility</th>
                <th className="px-4 py-3.5">Network Role</th>
                <th className="px-4 py-3.5">Branch Administrator</th>
                <th className="px-4 py-3.5">Facility Bed Capacity</th>
                <th className="px-4 py-3.5">Public Website</th>
                <th className="px-5 py-3.5 text-right">Direct Admin Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {networkHospitals.map((facility) => {
                const isCurrentActive = facility.id === currentHospital?.id;
                const isHead = facility.isHeadBranch || facility.id === headBranch?.id;

                return (
                  <tr key={facility.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={facility.logoUrl || facility.image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=80&auto=format&fit=crop&q=80'}
                          alt={facility.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{facility.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {facility.city}, {facility.state} &bull; <span className="font-mono text-purple-600 font-semibold">{facility.branchCode || facility.id}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {isHead ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                          Head Branch
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                          Sub-Branch ({facility.branchCode || 'SUB'})
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      <p className="font-semibold text-slate-900">
                        {isHead ? `${user?.name || facility.adminName} (Head Admin)` : facility.adminName || 'Sub-Branch Admin'}
                      </p>
                      <p className="text-[11px] text-slate-500">{facility.adminEmail}</p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-900">{facility.totalBeds || 50} Inpatient Beds</p>
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                        Isolated Local Facility Capacity
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      {facility.websiteUrl ? (
                        <a
                          href={facility.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-1 hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Visit Website</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Pending Deployment</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {isCurrentActive ? (
                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active Workspace
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleSwitchToBranch(facility.id, facility.name)}
                          rightIcon={<ArrowRight className="w-3 h-3" />}
                        >
                          Switch to Branch
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

