import React, { useState } from 'react';
import {
  Clock,
  CheckCircle2,
  Calendar,
  Plus,
  PhoneCall,
  Mail,
  MessageSquare,
  Video,
  Building2,
  AlertCircle,
  Filter,
  Search,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { LeadFollowUp, FollowUpType } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export const SalesFollowUps: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [followUps, setFollowUps] = useState<LeadFollowUp[]>(() => MockStorage.getLeadFollowUps(user?.id));
  const leads = MockStorage.getSalesLeads(user?.id);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [leadSearchQuery, setLeadSearchQuery] = useState<string>('');

  const filteredLeads = leads.filter(
    (l) =>
      l.hospitalName.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
      l.contactPerson.toLowerCase().includes(leadSearchQuery.toLowerCase())
  );

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    leadId: leads[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM',
    type: 'Phone Call' as FollowUpType,
    notes: '',
  });

  const refreshFollowUps = () => {
    setFollowUps(MockStorage.getLeadFollowUps(user?.id));
  };

  const handleOpenSchedule = () => {
    setForm({
      leadId: leads[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM',
      type: 'Phone Call',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSaveFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    const lead = leads.find((l) => l.id === form.leadId);

    if (!lead || !user) {
      showToast('Error', 'Please select a lead.', 'error');
      return;
    }

    MockStorage.saveLeadFollowUp({
      id: `FLP-${Date.now().toString().slice(-4)}`,
      leadId: lead.id,
      leadHospitalName: lead.hospitalName,
      leadContactPerson: lead.contactPerson,
      assignedTo: user.id,
      date: form.date,
      time: form.time,
      type: form.type,
      notes: form.notes,
      status: 'Pending',
      reminder: true,
    });

    showToast('Follow-up Scheduled', `Follow-up set for ${lead.hospitalName}.`);
    setIsModalOpen(false);
    refreshFollowUps();
  };

  const handleMarkCompleted = (id: string) => {
    MockStorage.updateFollowUpStatus(id, 'Completed');
    showToast('Follow-up Completed', 'Task marked as completed.');
    refreshFollowUps();
  };

  const handleReschedule = (id: string) => {
    MockStorage.updateFollowUpStatus(id, 'Rescheduled');
    showToast('Follow-up Rescheduled', 'Follow-up marked for reschedule.');
    refreshFollowUps();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filtered = followUps.filter((f) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'Today'
        ? f.date === todayStr && f.status === 'Pending'
        : filterStatus === 'Overdue'
        ? f.date < todayStr && f.status === 'Pending'
        : f.status === filterStatus;

    const matchesType = filterType === 'all' || f.type === filterType;

    return matchesStatus && matchesType;
  });

  const todayCount = followUps.filter((f) => f.date === todayStr && f.status === 'Pending').length;
  const overdueCount = followUps.filter((f) => f.date < todayStr && f.status === 'Pending').length;
  const completedCount = followUps.filter((f) => f.status === 'Completed').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <PageHeader
        title="Follow-ups & Reminder Schedule"
        subtitle="Track upcoming sales call tasks, demo appointments, and follow-up activities."
        breadcrumbs={[{ label: 'Sales CRM', href: '/sales/dashboard' }, { label: 'Follow-ups' }]}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenSchedule} leftIcon={<Plus className="w-4 h-4" />}>
            + Schedule Follow-up
          </Button>
        }
      />

      {/* Operational Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Follow-ups</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{todayCount}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Follow-ups</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{overdueCount}</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Tasks</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{completedCount}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="all">All Follow-ups</option>
              <option value="Today">Due Today</option>
              <option value="Overdue">Overdue</option>
              <option value="Pending">Pending Future</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
            >
              <option value="all">All Activity Types</option>
              <option value="Phone Call">Phone Call</option>
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Meeting">Meeting</option>
              <option value="Product Demo">Product Demo</option>
              <option value="Site Visit">Site Visit</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups List Table */}
      <Card>
        <CardHeader
          title="Scheduled Follow-up Reminders"
          subtitle={`${filtered.length} follow-up tasks scheduled`}
        />
        <CardContent className="p-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Hospital Lead</th>
                  <th className="px-4 py-3">Scheduled Date & Time</th>
                  <th className="px-4 py-3">Follow-up Type</th>
                  <th className="px-4 py-3">Notes & Instructions</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No follow-up tasks found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((f) => {
                    const isOverdue = f.date < todayStr && f.status === 'Pending';
                    const isToday = f.date === todayStr && f.status === 'Pending';

                    return (
                      <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-slate-900">{f.leadHospitalName || 'Hospital Lead'}</p>
                          <p className="text-[11px] text-slate-500">{f.leadContactPerson || 'Contact'}</p>
                        </td>

                        <td className="px-4 py-3.5 font-medium">
                          <p className={isOverdue ? 'text-rose-600 font-bold' : isToday ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                            📅 {f.date} {f.time ? `at ${f.time}` : ''}
                          </p>
                          {isOverdue && <span className="text-[9px] bg-rose-100 text-rose-700 px-1 rounded font-bold">OVERDUE</span>}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                            {f.type}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                          {f.notes || 'No detailed instructions provided.'}
                        </td>

                        <td className="px-4 py-3.5">
                          <Badge variant={f.status === 'Completed' ? 'success' : isOverdue ? 'error' : 'warning'}>
                            {f.status}
                          </Badge>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          {f.status === 'Pending' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleMarkCompleted(f.id)}
                                className="border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                              >
                                Mark Completed
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => handleReschedule(f.id)}
                              >
                                Reschedule
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL: Schedule Followup */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Follow-up"
        subtitle="Set call or meeting reminder for a hospital lead"
        maxWidth="md"
      >
        <form onSubmit={handleSaveFollowUp} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Select Hospital Lead *</label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search lead by hospital name or contact..."
                value={leadSearchQuery}
                onChange={(e) => setLeadSearchQuery(e.target.value)}
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
              {filteredLeads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.hospitalName} ({l.contactPerson}) — {l.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Follow-up Date *"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <Input
              label="Follow-up Time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              placeholder="e.g. 10:30 AM"
            />
          </div>

          <Select
            label="Follow-up Type *"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as any })}
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
            label="Follow-up Notes / Instructions"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Key discussion points or specific agenda..."
            rows={3}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Schedule Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
