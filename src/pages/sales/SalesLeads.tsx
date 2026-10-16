import React, { useState } from 'react';
import {
  Target,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  Clock,
  ArrowRight,
  ChevronRight,
  FileText,
  UserCheck,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { SalesLead, LeadStatus, LeadSource, SubscriptionPlanTier } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export const SalesLeads: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [leads, setLeads] = useState<SalesLead[]>(() => MockStorage.getSalesLeads(user?.id));
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Active Selections
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [editingLead, setEditingLead] = useState<SalesLead | null>(null);
  const [leadToDeleteId, setTestToDeleteId] = useState<string | null>(null);

  // Lead Form State
  const [leadForm, setLeadForm] = useState({
    hospitalName: '',
    contactPerson: '',
    designation: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    country: 'United States',
    hospitalType: 'General',
    bedCount: 50,
    leadSource: 'Website' as LeadSource,
    interestedPlan: 'standard' as SubscriptionPlanTier,
    expectedDecisionDate: '',
    notes: '',
  });

  // Follow Up Form State
  const [followUpForm, setFollowUpForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    type: 'Phone Call' as any,
    notes: '',
  });

  // Activity Log State
  const [activityForm, setActivityForm] = useState({
    type: 'Call' as any,
    description: '',
  });

  const refreshLeads = () => {
    setLeads(MockStorage.getSalesLeads(user?.id));
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'all' || lead.leadSource === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  // Handlers
  const handleOpenCreate = () => {
    setEditingLead(null);
    setLeadForm({
      hospitalName: '',
      contactPerson: '',
      designation: '',
      phone: '',
      email: '',
      city: '',
      state: '',
      country: 'United States',
      hospitalType: 'General',
      bedCount: 50,
      leadSource: 'Website',
      interestedPlan: 'standard',
      expectedDecisionDate: '',
      notes: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (lead: SalesLead) => {
    setEditingLead(lead);
    setLeadForm({
      hospitalName: lead.hospitalName,
      contactPerson: lead.contactPerson,
      designation: lead.designation || '',
      phone: lead.phone,
      email: lead.email,
      city: lead.city || '',
      state: lead.state || '',
      country: lead.country || 'United States',
      hospitalType: lead.hospitalType || 'General',
      bedCount: lead.bedCount || 50,
      leadSource: lead.leadSource,
      interestedPlan: (lead.interestedPlan as SubscriptionPlanTier) || 'standard',
      expectedDecisionDate: lead.expectedDecisionDate || '',
      notes: lead.notes || '',
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();

    if (!leadForm.hospitalName || !leadForm.contactPerson || !leadForm.phone || !leadForm.email || !leadForm.leadSource) {
      showToast('Validation Error', 'Hospital Name, Contact Person, Phone, Email, and Lead Source are required.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadForm.email)) {
      showToast('Validation Error', 'Please enter a valid email address.', 'error');
      return;
    }

    const newLead: SalesLead = {
      id: editingLead ? editingLead.id : `LEAD-${Math.floor(1000 + Math.random() * 9000)}`,
      hospitalName: leadForm.hospitalName,
      contactPerson: leadForm.contactPerson,
      designation: leadForm.designation,
      phone: leadForm.phone,
      email: leadForm.email,
      city: leadForm.city,
      state: leadForm.state,
      country: leadForm.country,
      hospitalType: leadForm.hospitalType,
      bedCount: Number(leadForm.bedCount),
      leadSource: leadForm.leadSource,
      interestedPlan: leadForm.interestedPlan,
      status: editingLead ? editingLead.status : 'New',
      assignedSalesExecutiveId: user?.id || 'USR-SALES-01',
      assignedSalesExecutiveName: user?.name || 'Sales Executive',
      expectedDecisionDate: leadForm.expectedDecisionDate,
      notes: leadForm.notes,
      createdAt: editingLead ? editingLead.createdAt : new Date().toISOString().split('T')[0],
    };

    MockStorage.saveSalesLead(newLead);
    showToast(
      editingLead ? 'Lead Updated' : 'Lead Created',
      `Lead for ${newLead.hospitalName} saved in queue.`
    );
    setIsCreateModalOpen(false);
    refreshLeads();
  };

  const handleStatusChange = (leadId: string, status: LeadStatus) => {
    MockStorage.updateLeadStatus(leadId, status);
    showToast('Status Updated', `Lead status changed to ${status}.`);
    refreshLeads();
  };

  const handleOpenConvertModal = (lead: SalesLead) => {
    setSelectedLead(lead);
    setIsConvertModalOpen(true);
  };

  const handleConfirmConvert = () => {
    if (selectedLead && user) {
      const res = MockStorage.convertLeadToCustomer(selectedLead.id, user);
      if (res.success) {
        showToast('Lead Converted Successfully!', res.message, 'success');
        setIsConvertModalOpen(false);
        refreshLeads();
      } else {
        showToast('Conversion Failed', res.message, 'error');
      }
    }
  };

  const handleOpenFollowUp = (lead: SalesLead) => {
    setSelectedLead(lead);
    setFollowUpForm({
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      type: 'Phone Call',
      notes: '',
    });
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLead && user) {
      MockStorage.saveLeadFollowUp({
        id: `FLP-${Date.now().toString().slice(-4)}`,
        leadId: selectedLead.id,
        leadHospitalName: selectedLead.hospitalName,
        leadContactPerson: selectedLead.contactPerson,
        assignedTo: user.id,
        date: followUpForm.date,
        time: followUpForm.time,
        type: followUpForm.type,
        notes: followUpForm.notes,
        status: 'Pending',
        reminder: true,
      });
      showToast('Follow-up Scheduled', `Follow-up set for ${selectedLead.hospitalName} on ${followUpForm.date}.`);
      setIsFollowUpModalOpen(false);
      refreshLeads();
    }
  };

  const handleOpenActivity = (lead: SalesLead) => {
    setSelectedLead(lead);
    setActivityForm({ type: 'Call', description: '' });
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLead && user) {
      MockStorage.logLeadActivity({
        id: `ACT-${Date.now().toString().slice(-4)}`,
        leadId: selectedLead.id,
        type: activityForm.type,
        description: activityForm.description,
        createdBy: user.name,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
      showToast('Activity Logged', 'Sales activity added to timeline.');
      setIsActivityModalOpen(false);
    }
  };

  const handleViewLeadDetail = (lead: SalesLead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
  };

  const handleDeleteLead = (id: string) => {
    setTestToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (leadToDeleteId) {
      MockStorage.deleteSalesLead(leadToDeleteId);
      showToast('Lead Deleted', 'Lead record removed.');
      setIsDeleteConfirmOpen(false);
      refreshLeads();
    }
  };

  const kanbanStatuses: LeadStatus[] = [
    'New',
    'Contacted',
    'Qualified',
    'Demo Scheduled',
    'Demo Completed',
    'Proposal Sent',
    'Negotiation',
    'Converted',
    'Lost',
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <PageHeader
        title="Leads Pipeline Management"
        subtitle="Manage hospital leads, track qualification stages, schedule follow-ups, and convert qualified leads to SaaS customers."
        breadcrumbs={[{ label: 'Sales CRM', href: '/sales/dashboard' }, { label: 'Leads' }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-slate-200 p-1 rounded-lg flex items-center gap-1 text-xs font-semibold text-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-md transition-all ${viewMode === 'table' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:text-slate-900'}`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'hover:text-slate-900'}`}
              >
                Kanban Pipeline
              </button>
            </div>
            <Button variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
              + Create Lead
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search hospital, contact, lead ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="all">All Lead Statuses</option>
              {kanbanStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="all">All Lead Sources</option>
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Direct Inquiry">Direct Inquiry</option>
              <option value="Exhibition/Event">Exhibition/Event</option>
              <option value="Cold Outreach">Cold Outreach</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <Card>
          <CardHeader
            title="Hospital Leads Directory"
            subtitle={`${filteredLeads.length} leads assigned to your queue`}
          />
          <CardContent className="p-4">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">Hospital & Contact</th>
                    <th className="px-4 py-3">Location & Spec</th>
                    <th className="px-4 py-3">Source & Plan</th>
                    <th className="px-4 py-3">Next Follow-up</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No leads found matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{lead.hospitalName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-slate-500">
                            <span className="font-medium">{lead.contactPerson}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-indigo-600">{lead.phone}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-slate-700">
                          <p>{lead.city || 'N/A'}, {lead.state || ''}</p>
                          <p className="text-[10px] text-slate-400">{lead.bedCount || 50} Beds • {lead.hospitalType || 'General'}</p>
                        </td>

                        <td className="px-4 py-3.5">
                          <p className="font-medium text-slate-800">{lead.leadSource}</p>
                          <span className="text-[10px] text-indigo-600 font-bold capitalize">{lead.interestedPlan || 'Trial'}</span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600">
                          {lead.nextFollowUpDate ? (
                            <span className="font-medium text-slate-800">📅 {lead.nextFollowUpDate}</span>
                          ) : (
                            <span className="text-slate-400 italic">None Scheduled</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5">
                          <Select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                            className="text-xs py-1 px-2 border-slate-300 rounded font-semibold"
                          >
                            {kanbanStatuses.map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </Select>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="xs" onClick={() => handleViewLeadDetail(lead)} title="View Detail">
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => handleOpenFollowUp(lead)} title="Schedule Follow-up">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => handleOpenActivity(lead)} title="Add Activity Log">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => handleOpenEdit(lead)} title="Edit Lead">
                              <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                            </Button>

                            {lead.status !== 'Converted' && (
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleOpenConvertModal(lead)}
                                className="border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-bold"
                              >
                                Convert
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KANBAN PIPELINE VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {kanbanStatuses.map((status) => {
            const statusLeads = filteredLeads.filter((l) => l.status === status);
            return (
              <div key={status} className="w-72 shrink-0 bg-slate-100/70 rounded-xl p-3 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">{status}</span>
                  <Badge variant="neutral">{statusLeads.length}</Badge>
                </div>

                <div className="space-y-3 min-h-[300px]">
                  {statusLeads.map((lead) => (
                    <div key={lead.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition-all">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-xs text-slate-900 leading-tight">{lead.hospitalName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{lead.id}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{lead.contactPerson} • {lead.phone}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px]">
                        <span className="font-medium text-indigo-600 uppercase">{lead.interestedPlan || 'Trial'}</span>
                        {lead.status !== 'Converted' ? (
                          <button
                            onClick={() => handleOpenConvertModal(lead)}
                            className="font-bold text-emerald-600 hover:underline"
                          >
                            Convert →
                          </button>
                        ) : (
                          <span className="font-bold text-emerald-600">Converted ✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Create / Edit Lead */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingLead ? 'Edit Sales Lead' : 'Create New Sales Lead'}
        subtitle="Record a prospective hospital customer inquiry"
        maxWidth="md"
      >
        <form onSubmit={handleSaveLead} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hospital Name *"
              value={leadForm.hospitalName}
              onChange={(e) => setLeadForm({ ...leadForm, hospitalName: e.target.value })}
              placeholder="e.g. St. Jude Heart Center"
              required
            />
            <Input
              label="Contact Person *"
              value={leadForm.contactPerson}
              onChange={(e) => setLeadForm({ ...leadForm, contactPerson: e.target.value })}
              placeholder="e.g. Dr. Robert Harrison"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Designation"
              value={leadForm.designation}
              onChange={(e) => setLeadForm({ ...leadForm, designation: e.target.value })}
              placeholder="e.g. Medical Director"
            />
            <Input
              label="Phone Number *"
              value={leadForm.phone}
              onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              required
            />
            <Input
              label="Email Address *"
              type="email"
              value={leadForm.email}
              onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
              placeholder="contact@hospital.com"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="City"
              value={leadForm.city}
              onChange={(e) => setLeadForm({ ...leadForm, city: e.target.value })}
              placeholder="New York"
            />
            <Input
              label="State"
              value={leadForm.state}
              onChange={(e) => setLeadForm({ ...leadForm, state: e.target.value })}
              placeholder="NY"
            />
            <Input
              label="Number of Beds"
              type="number"
              value={leadForm.bedCount}
              onChange={(e) => setLeadForm({ ...leadForm, bedCount: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Lead Source *"
              value={leadForm.leadSource}
              onChange={(e) => setLeadForm({ ...leadForm, leadSource: e.target.value as LeadSource })}
              required
            >
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Google Ads">Google Ads</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Direct Inquiry">Direct Inquiry</option>
              <option value="Exhibition/Event">Exhibition/Event</option>
              <option value="Cold Outreach">Cold Outreach</option>
              <option value="Other">Other</option>
            </Select>

            <Select
              label="Interested Plan *"
              value={leadForm.interestedPlan}
              onChange={(e) => setLeadForm({ ...leadForm, interestedPlan: e.target.value as SubscriptionPlanTier })}
              required
            >
              {MockStorage.getPlans().map((plan) => (
                <option key={plan.id} value={plan.tier}>
                  {plan.name} ({plan.priceMonthly === 0 ? `${plan.name} (₹0)` : `₹${plan.priceMonthly.toLocaleString('en-IN')}/mo`})
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Expected Decision Date"
            type="date"
            value={leadForm.expectedDecisionDate}
            onChange={(e) => setLeadForm({ ...leadForm, expectedDecisionDate: e.target.value })}
          />

          <Textarea
            label="Notes / Special Requirements"
            value={leadForm.notes}
            onChange={(e) => setLeadForm({ ...leadForm, notes: e.target.value })}
            placeholder="Key discussion points or specific hospital requirements..."
            rows={2}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Lead Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Lead Conversion Modal */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Lead to Hospital Customer"
        subtitle="Initiate customer onboarding and hospital admin provision"
        maxWidth="md"
      >
        {selectedLead && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <p className="font-bold text-sm">Convert lead & submit to Super Admin?</p>
              <p>This will convert the lead into a Customer record and notify the Super Admin. The Super Admin will review the converted customer, select the subscription plan, and onboard the hospital into the Network & Facilities table.</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Hospital Name:</span>
                <span className="font-bold text-slate-900">{selectedLead.hospitalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Person / Admin:</span>
                <span className="font-bold text-slate-900">{selectedLead.contactPerson}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Address:</span>
                <span className="font-mono text-slate-800">{selectedLead.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone Number:</span>
                <span className="font-mono text-slate-800">{selectedLead.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Interested Plan:</span>
                <span className="font-bold text-indigo-700 capitalize">{selectedLead.interestedPlan || 'Trial'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsConvertModalOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" size="sm" onClick={handleConfirmConvert} className="bg-emerald-600 hover:bg-emerald-700">
                Confirm Lead Conversion
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: Add Follow-up */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Schedule Follow-up"
        subtitle={`Schedule reminder for ${selectedLead?.hospitalName}`}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveFollowUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Follow-up Date *"
              type="date"
              value={followUpForm.date}
              onChange={(e) => setFollowUpForm({ ...followUpForm, date: e.target.value })}
              required
            />
            <Input
              label="Follow-up Time"
              value={followUpForm.time}
              onChange={(e) => setFollowUpForm({ ...followUpForm, time: e.target.value })}
              placeholder="e.g. 10:30 AM"
            />
          </div>

          <Select
            label="Follow-up Type *"
            value={followUpForm.type}
            onChange={(e) => setFollowUpForm({ ...followUpForm, type: e.target.value as any })}
            required
          >
            <option value="Phone Call">Phone Call</option>
            <option value="Email">Email</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Meeting">Meeting</option>
            <option value="Product Demo">Product Demo</option>
            <option value="Site Visit">Site Visit</option>
            <option value="Other">Other</option>
          </Select>

          <Textarea
            label="Follow-up Instructions / Notes"
            value={followUpForm.notes}
            onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })}
            placeholder="What needs to be discussed during this follow up..."
            rows={2}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsFollowUpModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule Follow-up
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: Add Activity Log */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Log Sales Activity"
        subtitle={`Record interaction with ${selectedLead?.hospitalName}`}
        maxWidth="sm"
      >
        <form onSubmit={handleSaveActivity} className="space-y-4">
          <Select
            label="Activity Type *"
            value={activityForm.type}
            onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as any })}
            required
          >
            <option value="Call">Call</option>
            <option value="Email">Email</option>
            <option value="Meeting">Meeting</option>
            <option value="Demo">Demo</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Note">Note</option>
            <option value="Proposal">Proposal</option>
            <option value="Follow-up">Follow-up</option>
          </Select>

          <Textarea
            label="Activity Description *"
            value={activityForm.description}
            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            placeholder="e.g. Discussed hospital HMS requirements with administrator."
            required
            rows={3}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsActivityModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Record Activity
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: Lead Detail Drawer/View */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedLead?.hospitalName || 'Lead Details'}
        subtitle={`Lead Ref: ${selectedLead?.id}`}
        maxWidth="lg"
      >
        {selectedLead && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Contact Person:</span>
                <span className="font-bold text-slate-900">{selectedLead.contactPerson} ({selectedLead.designation || 'Contact'})</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Phone & Email:</span>
                <span className="font-mono text-slate-800">{selectedLead.phone} • {selectedLead.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Location & Size:</span>
                <span className="text-slate-800">{selectedLead.city || 'N/A'}, {selectedLead.state || ''} — {selectedLead.bedCount || 50} Beds</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Lead Source & Plan:</span>
                <span className="font-semibold text-indigo-700">{selectedLead.leadSource} (Interested: {selectedLead.interestedPlan})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <Badge variant={selectedLead.status === 'Converted' ? 'success' : 'warning'}>{selectedLead.status}</Badge>
              </div>
            </div>

            {selectedLead.notes && (
              <div>
                <p className="font-semibold text-slate-700 mb-1">Lead Notes:</p>
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-600">
                  {selectedLead.notes}
                </div>
              </div>
            )}

            {/* Activity History */}
            <div>
              <p className="font-semibold text-slate-700 mb-2">Activity Timeline:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {MockStorage.getLeadActivities(selectedLead.id).length === 0 ? (
                  <p className="text-slate-400 italic">No activities logged yet.</p>
                ) : (
                  MockStorage.getLeadActivities(selectedLead.id).map((act) => (
                    <div key={act.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{act.type}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{act.createdAt}</span>
                      </div>
                      <p className="text-slate-600">{act.description}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close Detail
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Lead Record"
        message="Are you sure you want to remove this lead? This action cannot be undone."
        confirmText="Delete Lead"
        variant="danger"
      />
    </div>
  );
};
