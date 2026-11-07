import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Building2,
  Download,
  Plus,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Lock,
  Layers,
  Network,
  Eye,
  Check,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { EnterpriseBranchDocument, Hospital } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useNotification } from '../../../context/NotificationContext';
import { useAuth } from '../../../context/AuthContext';
import { OnboardSubBranchModal } from '../../../components/platform/OnboardSubBranchModal';

export const EnterpriseManifests: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isPlatformAdmin = user?.role === 'super_admin' || user?.role === 'super_admin_manager';

  const [documents, setDocuments] = useState<EnterpriseBranchDocument[]>(() =>
    MockStorage.getEnterpriseBranchDocuments()
  );
  const [hospitals, setHospitals] = useState<Hospital[]>(() => MockStorage.getHospitals());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sub-Branch Onboarding Modal State
  const [selectedDocForProvision, setSelectedDocForProvision] = useState<EnterpriseBranchDocument | null>(null);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

  const refreshData = () => {
    setDocuments(MockStorage.getEnterpriseBranchDocuments());
    setHospitals(MockStorage.getHospitals());
  };

  useEffect(() => {
    const handleSync = () => refreshData();
    window.addEventListener('pulse_storage_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('pulse_storage_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const pendingCount = documents.filter((d) => d.status === 'pending_review').length;
  const provisionedCount = documents.filter((d) => d.status === 'provisioned').length;

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.uploadedBy && d.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownloadFile = (doc: EnterpriseBranchDocument) => {
    if (!doc.fileData) {
      showToast('Download Error', 'No file data stored for this document.', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download Started', `Downloading manifest specification: ${doc.fileName}`, 'success');
  };

  const handleOpenProvisionModal = (doc?: EnterpriseBranchDocument) => {
    if (!isSuperAdmin) {
      showToast('Access Denied', 'Super Admin Manager is restricted from onboarding hospital facilities. Only Super Administrator can onboard sub-branches.', 'error');
      return;
    }
    setSelectedDocForProvision(doc || null);
    setIsOnboardModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Enterprise Sub-Branch Manifests"
        subtitle="Review uploaded sub-branch specifications from Enterprise hospital networks, download manifest files, and onboard sub-branch facilities."
        breadcrumbs={[
          { label: 'Platform HQ', href: '/platform/dashboard' },
          { label: 'Enterprise Manifests' },
        ]}
        actions={
          isSuperAdmin ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenProvisionModal()}
              leftIcon={<Building2 className="w-4 h-4" />}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              Manually Onboard Sub-Branch
            </Button>
          ) : undefined
        }
      />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Received</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{documents.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Review</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Provisioned</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{provisionedCount}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Network Head Branches</p>
            <p className="text-xl font-bold text-indigo-600 mt-1">
              {hospitals.filter((h) => h.isHeadBranch).length}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Information Banner */}
      <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-700 shrink-0 mt-0.5">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-purple-950">
              Super Admin Sub-Branch Processing & Onboarding Desk
            </h3>
            <p className="text-xs text-purple-800 mt-0.5 leading-relaxed max-w-3xl">
              When an enterprise hospital uploads its proposed branch specification document (max 5 MB), it arrives directly here. Download the file to inspect the locations, bed counts, and branch director names, then click <strong>Provision Sub-Branch</strong> to create the branch hospital, generate its public website, and assign its isolated Branch Admin.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-purple-200 text-purple-800 text-xs font-bold shadow-xs">
          <ShieldCheck className="w-4 h-4 text-purple-600" />
          <span>Super Admin & Manager Access Only</span>
        </div>
      </div>

      {/* Document List Card */}
      <Card>
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by hospital name, file, or uploader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-1.5"
            >
              <option value="all">All Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="provisioned">Branches Provisioned</option>
            </Select>
          </div>
        </div>

        {filteredDocs.length === 0 ? (
          <EmptyState
            title="No Sub-Branch Manifests Found"
            description="When hospital networks upgrade to Enterprise Health Network and upload their proposed branch documents, they will appear here."
            actionText="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Hospital Network (Head Branch)</th>
                  <th className="px-4 py-3.5">Uploaded Manifest File</th>
                  <th className="px-4 py-3.5">Uploaded By</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Linked Sub-Branches</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const linkedBranches = hospitals.filter(
                    (h) => doc.provisionedBranchIds && doc.provisionedBranchIds.includes(h.id)
                  );

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{doc.hospitalName}</p>
                            <span className="inline-block mt-0.5 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-200">
                              Head Branch
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate max-w-xs">{doc.fileName}</p>
                            <p className="text-[10px] text-slate-500">
                              {(doc.fileSize / 1024).toFixed(1)} KB • {new Date(doc.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        <p className="font-medium text-slate-900">{doc.uploadedBy}</p>
                        <p className="text-[11px] text-slate-500">{doc.uploadedByEmail || 'admin@hospital.org'}</p>
                      </td>

                      <td className="px-4 py-4">
                        {doc.status === 'pending_review' && (
                          <Badge variant="warning" dot>Pending Review</Badge>
                        )}
                        {doc.status === 'provisioned' && (
                          <Badge variant="success" dot>Branches Provisioned</Badge>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {linkedBranches.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {linkedBranches.map((b) => (
                              <span
                                key={b.id}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                              >
                                {b.name} ({b.branchCode || b.id})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No sub-branches created yet</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleDownloadFile(doc)}
                            leftIcon={<Download className="w-3.5 h-3.5 text-slate-600" />}
                            title="Download manifest file to your computer"
                          >
                            Download File
                          </Button>
                          {isSuperAdmin ? (
                            <Button
                              variant="coral"
                              size="xs"
                              onClick={() => handleOpenProvisionModal(doc)}
                              leftIcon={<Plus className="w-3.5 h-3.5" />}
                            >
                              Provision Sub-Branch
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium italic">
                              Super Admin Required
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Sub-Branch Onboarding Modal */}
      <OnboardSubBranchModal
        isOpen={isOnboardModalOpen}
        onClose={() => {
          setIsOnboardModalOpen(false);
          setSelectedDocForProvision(null);
        }}
        preSelectedHeadHospitalId={selectedDocForProvision?.hospitalId}
        linkedDocId={selectedDocForProvision?.id}
        onSuccess={() => {
          refreshData();
        }}
      />
    </div>
  );
};

