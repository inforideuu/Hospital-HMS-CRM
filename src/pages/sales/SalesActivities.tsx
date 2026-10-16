import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  PhoneCall,
  Mail,
  MessageSquare,
  Video,
  FileText,
  Clock,
  User,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { LeadActivity, ActivityType } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export const SalesActivities: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [activities, setActivities] = useState<LeadActivity[]>(() => MockStorage.getLeadActivities());
  const leads = MockStorage.getSalesLeads(user?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [leadModalSearch, setLeadModalSearch] = useState('');

  const filteredModalLeads = leads.filter(
    (l) =>
      l.hospitalName.toLowerCase().includes(leadModalSearch.toLowerCase()) ||
      l.contactPerson.toLowerCase().includes(leadModalSearch.toLowerCase())
  );

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    leadId: leads[0]?.id || '',
    type: 'Call' as ActivityType,
    description: '',
  });

  const refreshActivities = () => {
    setActivities(MockStorage.getLeadActivities());
  };

  const handleOpenAdd = () => {
    setForm({
      leadId: leads[0]?.id || '',
      type: 'Call',
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveActivity = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find((l) => l.id === form.leadId);

    if (!lead || !user) {
      showToast('Error', 'Please select a lead.', 'error');
      return;
    }

    MockStorage.logLeadActivity({
      id: `ACT-${Date.now().toString().slice(-4)}`,
      leadId: lead.id,
      type: form.type,
      description: form.description,
      createdBy: user.name,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    });

    showToast('Activity Recorded', `Logged activity for ${lead.hospitalName}.`);
    setIsModalOpen(false);
    refreshActivities();
  };

  const filtered = activities.filter((act) => {
    const lead = MockStorage.getSalesLeadById(act.leadId);
    const leadName = lead?.hospitalName || '';

    const matchesSearch =
      act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.createdBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || act.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <PageHeader
        title="Sales Activity Timeline"
        subtitle="Chronological record of calls, emails, demos, proposals, and lead interactions."
        breadcrumbs={[{ label: 'Sales CRM', href: '/sales/dashboard' }, { label: 'Activities' }]}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            + Log Activity
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search activity description, lead hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="all">All Activity Types</option>
              <option value="Call">Call</option>
              <option value="Email">Email</option>
              <option value="Meeting">Meeting</option>
              <option value="Demo">Demo</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Note">Note</option>
              <option value="Proposal">Proposal</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline List */}
      <Card>
        <CardHeader
          title="Recent Lead Interactions"
          subtitle={`${filtered.length} activities logged`}
        />
        <CardContent className="p-4">
          <div className="space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No activity records found.
              </div>
            ) : (
              filtered.map((act) => {
                const lead = MockStorage.getSalesLeadById(act.leadId);

                return (
                  <div key={act.id} className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl flex items-start gap-4">
                    <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-indigo-600 shadow-2xs shrink-0">
                      {act.type === 'Call' && <PhoneCall className="w-5 h-5 text-blue-600" />}
                      {act.type === 'Email' && <Mail className="w-5 h-5 text-purple-600" />}
                      {act.type === 'Meeting' && <Briefcase className="w-5 h-5 text-teal-600" />}
                      {act.type === 'Demo' && <Video className="w-5 h-5 text-amber-600" />}
                      {act.type === 'Proposal' && <FileText className="w-5 h-5 text-indigo-600" />}
                      {act.type !== 'Call' && act.type !== 'Email' && act.type !== 'Meeting' && act.type !== 'Demo' && act.type !== 'Proposal' && (
                        <MessageSquare className="w-5 h-5 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 space-y-1 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{lead?.hospitalName || 'Hospital Lead'}</span>
                          <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold text-[10px]">
                            {act.type}
                          </span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{act.createdAt}</span>
                      </div>

                      <p className="text-slate-700 text-xs leading-relaxed">{act.description}</p>
                      
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                        <User className="w-3 h-3" />
                        <span>Recorded by {act.createdBy}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* MODAL: Log Activity */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Sales Activity"
        subtitle="Add a new lead interaction record"
        maxWidth="md"
      >
        <form onSubmit={handleSaveActivity} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Select Hospital Lead *</label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search lead by hospital name or contact..."
                value={leadModalSearch}
                onChange={(e) => setLeadModalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>
            <select
              value={form.leadId}
              onChange={(e) => setForm({ ...form, leadId: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
              required
            >
              <option value="">-- Select a Lead --</option>
              {filteredModalLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.hospitalName} ({l.contactPerson})
                </option>
              ))}
            </select>
          </div>

          <Select
            label="Activity Type *"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as ActivityType })}
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
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Detailed interaction notes..."
            required
            rows={3}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Record Activity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
