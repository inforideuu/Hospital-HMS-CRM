import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  Search,
  Filter,
  User,
  Building2,
  Plus,
  RefreshCw,
  Tag,
  Mail,
  ShieldAlert,
  Calendar,
  X,
  FileText,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
const API_BASE_URL = 'http://127.0.0.1:8000/api';

const SupportTicketApi = {
  async getTickets(params?: { hospital_id?: string; status?: string; priority?: string; search?: string }) {
    try {
      let url = `${API_BASE_URL}/support-tickets/`;
      if (params) {
        const q = new URLSearchParams();
        if (params.hospital_id) q.append('hospital_id', params.hospital_id);
        if (params.status && params.status !== 'all') q.append('status', params.status);
        if (params.priority && params.priority !== 'all') q.append('priority', params.priority);
        if (params.search) q.append('search', params.search);
        if (q.toString()) url += `?${q.toString()}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch support tickets');
      return await res.json();
    } catch {
      return null;
    }
  },

  async createTicket(ticketData: any) {
    try {
      const res = await fetch(`${API_BASE_URL}/support-tickets/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });
      if (!res.ok) throw new Error('Failed to create support ticket');
      return await res.json();
    } catch {
      return null;
    }
  },

  async addReply(id: string, message: string, sender: string, senderRole: string = 'platform_support') {
    try {
      const res = await fetch(`${API_BASE_URL}/support-tickets/${id}/add_reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sender, sender_role: senderRole }),
      });
      if (!res.ok) throw new Error('Failed to add ticket reply');
      return await res.json();
    } catch {
      return null;
    }
  },

  async updateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/support-tickets/${id}/update_status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update ticket status');
      return await res.json();
    } catch {
      return null;
    }
  },
};
import { MockStorage } from '../../../services/mockStorage';
import { SupportTicket, Hospital } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { Input, Textarea } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/ui/EmptyState';

export const SupportCenter: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();

  const [tickets, setTickets] = useState<SupportTicket[]>(() => MockStorage.getSupportTickets());
  const [hospitals, setHospitals] = useState<Hospital[]>(() => MockStorage.getHospitals());
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [hospitalFilter, setHospitalFilter] = useState('all');

  // New Escalation Modal
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newTicketForm, setNewTicketForm] = useState<{
    hospitalId: string;
    title: string;
    description: string;
    category: SupportTicket['category'];
    priority: SupportTicket['priority'];
    requesterName: string;
    requesterEmail: string;
  }>({
    hospitalId: '',
    title: '',
    description: '',
    category: 'Technical',
    priority: 'medium',
    requesterName: '',
    requesterEmail: '',
  });

  // Load and synchronize data from Django Backend and Local Cache
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const liveHospitals = MockStorage.getHospitals();
      setHospitals(liveHospitals);

      const backendTickets = await SupportTicketApi.getTickets();
      if (backendTickets && Array.isArray(backendTickets)) {
        if (backendTickets.length === 0) {
          localStorage.setItem('pulse_tickets', JSON.stringify([]));
          setTickets([]);
        } else {
          const mapped: SupportTicket[] = backendTickets.map((t: any) => ({
            id: t.id,
            hospitalId: t.hospital || t.hospital_id || t.hospitalId || 'hosp-1',
            hospitalName: t.hospital_name || t.hospitalName || 'Healthcare Facility',
            title: t.title,
            description: t.description || '',
            category: t.category || 'Technical',
            priority: t.priority || 'medium',
            status: t.status || 'open',
            requesterName: t.requester_name || t.requesterName || 'Hospital Administrator',
            requesterEmail: t.requester_email || t.requesterEmail || '',
            assignedTo: t.assigned_to || t.assignedTo || 'Platform Operations Support',
            createdAt: t.created_at || t.createdAt || new Date().toISOString(),
            updatedAt: t.updated_at || t.updatedAt || new Date().toISOString(),
            messages: Array.isArray(t.messages)
              ? t.messages.map((m: any) => ({
                  id: m.id,
                  sender: m.sender,
                  senderRole: m.senderRole || m.sender_role || 'platform_support',
                  avatar: m.avatar,
                  message: m.message,
                  timestamp: m.timestamp,
                }))
              : [],
          }));
          localStorage.setItem('pulse_tickets', JSON.stringify(mapped));
          setTickets(mapped);
        }
      } else {
        setTickets(MockStorage.getSupportTickets());
      }
    } catch {
      setTickets(MockStorage.getSupportTickets());
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('pulse_storage_updated', refreshData);
    return () => window.removeEventListener('pulse_storage_updated', refreshData);
  }, []);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.hospitalName.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.requesterName.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      const matchesHospital = hospitalFilter === 'all' || t.hospitalId === hospitalFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesHospital;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter, hospitalFilter]);

  // Set selected ticket reliably
  useEffect(() => {
    if (filteredTickets.length > 0) {
      const exists = filteredTickets.some((t) => t.id === selectedTicketId);
      if (!exists) {
        setSelectedTicketId(filteredTickets[0].id);
      }
    } else {
      setSelectedTicketId('');
    }
  }, [filteredTickets, selectedTicketId]);

  const selectedTicket = useMemo(() => {
    return tickets.find((t) => t.id === selectedTicketId) || filteredTickets[0] || null;
  }, [tickets, selectedTicketId, filteredTickets]);

  // Metrics computation
  const metrics = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      inProgress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
    };
  }, [tickets]);

  // Handle Send Reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || isSubmittingReply) return;

    setIsSubmittingReply(true);
    const senderName = user?.name ? `${user.name} (Platform Support)` : 'Platform Support Operations';
    const messageContent = replyText.trim();

    try {
      // 1. Dispatch locally with MockStorage and dispatch storage update
      MockStorage.addTicketReply(selectedTicket.id, messageContent, senderName, 'platform_support');

      // 2. Direct API call to Django backend
      await SupportTicketApi.addReply(selectedTicket.id, messageContent, senderName, 'platform_support');

      setReplyText('');
      showToast('Reply Dispatched', 'Official resolution message dispatched to hospital tenant administrators.');
      await refreshData();
    } catch {
      showToast('Reply Dispatched', 'Official reply updated in ticket thread.');
      await refreshData();
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle Status Change
  const handleStatusChange = async (ticketId: string, newStatus: SupportTicket['status']) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;

    const updated = {
      ...target,
      status: newStatus,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    MockStorage.saveSupportTicket(updated);
    await SupportTicketApi.updateStatus(ticketId, newStatus);
    showToast('Status Updated', `Ticket ${ticketId} status changed to ${newStatus.replace('_', ' ').toUpperCase()}`);
    await refreshData();
  };

  // Open Log Escalation Modal
  const handleOpenEscalationModal = () => {
    const defaultHosp = hospitals[0];
    setNewTicketForm({
      hospitalId: defaultHosp?.id || '',
      title: '',
      description: '',
      category: 'Technical',
      priority: 'medium',
      requesterName: defaultHosp?.adminName || 'Hospital Administrator',
      requesterEmail: defaultHosp?.adminEmail || defaultHosp?.email || 'admin@hospital.org',
    });
    setIsEscalationModalOpen(true);
  };

  // Handle Hospital Selection in New Ticket Form
  const handleModalHospitalChange = (hospitalId: string) => {
    const matched = hospitals.find((h) => h.id === hospitalId);
    setNewTicketForm((prev) => ({
      ...prev,
      hospitalId,
      requesterName: matched?.adminName || prev.requesterName,
      requesterEmail: matched?.adminEmail || matched?.email || prev.requesterEmail,
    }));
  };

  // Submit New Escalation Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.title.trim() || !newTicketForm.hospitalId) {
      showToast('Missing Fields', 'Please select a hospital facility and provide an escalation title.');
      return;
    }

    setIsCreatingTicket(true);
    const targetHospital = hospitals.find((h) => h.id === newTicketForm.hospitalId);
    const newId = `TICK-${Math.floor(100 + Math.random() * 900)}`;
    const nowTimestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const initialMessages: SupportTicket['messages'] = [];
    if (newTicketForm.description.trim()) {
      initialMessages.push({
        id: `msg-${Date.now()}`,
        sender: newTicketForm.requesterName || 'Hospital Administrator',
        senderRole: 'hospital',
        message: newTicketForm.description.trim(),
        timestamp: nowTimestamp,
      });
    }

    const createdTicket: SupportTicket = {
      id: newId,
      hospitalId: newTicketForm.hospitalId,
      hospitalName: targetHospital?.name || 'Healthcare Facility',
      title: newTicketForm.title.trim(),
      description: newTicketForm.description.trim(),
      category: newTicketForm.category,
      priority: newTicketForm.priority,
      status: 'open',
      requesterName: newTicketForm.requesterName.trim() || 'Hospital Administrator',
      requesterEmail: newTicketForm.requesterEmail.trim(),
      assignedTo: 'Platform Operations Support',
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
      messages: initialMessages,
    };

    try {
      // 1. Save in local storage
      MockStorage.saveSupportTicket(createdTicket);

      // 2. Persist to Django backend
      await SupportTicketApi.createTicket({
        id: newId,
        hospital: createdTicket.hospitalId,
        hospital_name: createdTicket.hospitalName,
        title: createdTicket.title,
        description: createdTicket.description,
        category: createdTicket.category,
        priority: createdTicket.priority,
        status: createdTicket.status,
        requester_name: createdTicket.requesterName,
        requester_email: createdTicket.requesterEmail,
        assigned_to: createdTicket.assignedTo,
        messages: createdTicket.messages,
      });

      showToast('Escalation Logged', `Ticket ${newId} created successfully for ${createdTicket.hospitalName}.`);
      setIsEscalationModalOpen(false);
      setSelectedTicketId(newId);
      await refreshData();
    } catch {
      showToast('Escalation Logged', `Ticket ${newId} registered in support queue.`);
      setIsEscalationModalOpen(false);
      setSelectedTicketId(newId);
      await refreshData();
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || priorityFilter !== 'all' || hospitalFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setHospitalFilter('all');
  };

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            <ShieldAlert className="w-2.5 h-2.5" /> Urgent
          </span>
        );
      case 'high':
        return (
          <Badge variant="error" size="sm">
            High Priority
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="warning" size="sm">
            Medium
          </Badge>
        );
      case 'low':
      default:
        return (
          <Badge variant="neutral" size="sm">
            Low
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="indigo" size="sm">Open</Badge>;
      case 'in_progress':
        return <Badge variant="warning" size="sm">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success" size="sm">Resolved</Badge>;
      case 'closed':
        return <Badge variant="neutral" size="sm">Closed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Support Desk & Tenant Escalations"
        subtitle="Manage hospital integration issues, billing inquiries, and live multi-tenant resolution threads."
        breadcrumbs={[{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Support Desk' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
              onClick={refreshData}
              disabled={isRefreshing}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenEscalationModal}
            >
              Log Tenant Escalation
            </Button>
          </div>
        }
      />

      {/* Ticket Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Tickets</p>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.total}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across all hospital tenants</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Open</p>
            <AlertCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 mt-2">{metrics.open}</p>
          <p className="text-[11px] text-indigo-500/80 mt-1">Awaiting resolution</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">In Progress</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{metrics.inProgress}</p>
          <p className="text-[11px] text-amber-500/80 mt-1">Active investigations</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Resolved</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{metrics.resolved}</p>
          <p className="text-[11px] text-emerald-600/80 mt-1">Successfully resolved</p>
        </div>
      </div>

      {/* Master Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left Column: Ticket List & Dynamic Search/Filters */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            {/* Filter Controls Header */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ticket ID, title, hospital or requester..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={hospitalFilter}
                  onChange={(e) => setHospitalFilter(e.target.value)}
                  className="text-xs py-1"
                >
                  <option value="all">All Hospitals</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </Select>

                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs py-1"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Select>

                <Select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs py-1"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Showing <strong className="text-slate-700">{filteredTickets.length}</strong> of {tickets.length} tickets
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            {/* Ticket List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[580px]">
              {filteredTickets.length === 0 ? (
                <div className="py-12">
                  <EmptyState
                    title="No Matching Tickets"
                    description={
                      hasActiveFilters
                        ? 'No escalations match your current filter criteria. Try adjusting or resetting filters.'
                        : 'No tenant escalations currently recorded. You can log a new hospital ticket above.'
                    }
                    actionText={hasActiveFilters ? 'Clear Filters' : 'Log New Escalation'}
                    onAction={hasActiveFilters ? clearFilters : handleOpenEscalationModal}
                  />
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full text-left p-4 transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-indigo-50/70 border-l-4 border-indigo-600 shadow-xs'
                          : 'hover:bg-slate-50/80 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {t.id}
                          </span>
                          {getStatusBadge(t.status)}
                        </div>
                        {getPriorityBadge(t.priority)}
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1 leading-snug">{t.title}</h4>
                      
                      <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{t.hospitalName}</span>
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                          <Tag className="w-2.5 h-2.5" /> {t.category}
                        </span>
                        <span>{t.updatedAt || t.createdAt}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Active Ticket Thread & Reply Form */}
        <div className="lg:col-span-7 flex flex-col">
          {selectedTicket ? (
            <Card className="flex-1 flex flex-col justify-between overflow-hidden">
              <div>
                {/* Active Ticket Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                          {selectedTicket.id}
                        </span>
                        {getPriorityBadge(selectedTicket.priority)}
                        <Badge variant="neutral" size="sm">
                          {selectedTicket.category}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 mt-1">{selectedTicket.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <strong className="text-slate-700">{selectedTicket.hospitalName}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedTicket.requesterName}</span>
                        </span>
                        {selectedTicket.requesterEmail && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Mail className="w-3 h-3" />
                            {selectedTicket.requesterEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status Changer */}
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status:</label>
                      <Select
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as SupportTicket['status'])}
                        className="text-xs py-1.5 min-w-[130px] font-semibold"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </Select>
                    </div>
                  </div>

                  {/* Initial Description if present */}
                  {selectedTicket.description && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200/70 text-xs text-slate-600">
                      <p className="font-semibold text-slate-800 mb-1 flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" /> Issue Details:
                      </p>
                      <p className="whitespace-pre-line leading-relaxed">{selectedTicket.description}</p>
                    </div>
                  )}
                </div>

                {/* Conversation Thread */}
                <div className="p-5 overflow-y-auto max-h-[380px] space-y-4">
                  {selectedTicket.messages.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      <MessageSquare className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                      No thread replies logged yet. Use the dispatch form below to communicate with the hospital administrators.
                    </div>
                  ) : (
                    selectedTicket.messages.map((m) => {
                      const isSupport = m.senderRole === 'platform_support';
                      return (
                        <div
                          key={m.id}
                          className={`flex gap-3 max-w-[88%] ${isSupport ? 'ml-auto flex-row-reverse' : ''}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                              isSupport ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isSupport ? 'HQ' : 'H'}
                          </div>
                          <div
                            className={`p-3.5 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                              isSupport
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 text-[10px] opacity-80">
                              <span className="font-semibold">{m.sender}</span>
                              <span>{m.timestamp}</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 bg-slate-50/70">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Dispatch official resolution response as ${user?.name || 'Platform Support Operations'}...`}
                  rows={2}
                  className="bg-white text-xs"
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2.5 pt-1">
                  <span className="text-[11px] text-slate-400">
                    Replies transmit notifications directly to hospital tenant administrators.
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedTicket.status !== 'resolved' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!replyText.trim() || isSubmittingReply}
                        onClick={async () => {
                          if (!replyText.trim()) return;
                          await handleSendReply({ preventDefault: () => {} } as any);
                          await handleStatusChange(selectedTicket.id, 'resolved');
                        }}
                      >
                        Reply & Mark Resolved
                      </Button>
                    )}
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={!replyText.trim() || isSubmittingReply}
                      rightIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      {isSubmittingReply ? 'Dispatching...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center min-h-[400px]">
              <div className="text-center p-8 max-w-sm">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800">No Escalation Selected</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Choose a ticket from the left panel to review thread history or log a new tenant ticket.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={handleOpenEscalationModal}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Log Tenant Escalation
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Log Tenant Escalation Modal */}
      <Modal
        isOpen={isEscalationModalOpen}
        onClose={() => setIsEscalationModalOpen(false)}
        title="Log Tenant Escalation / Support Ticket"
        subtitle="Open an official tracking thread for a registered hospital facility."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTicket} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Hospital Facility *</label>
            <Select
              value={newTicketForm.hospitalId}
              onChange={(e) => handleModalHospitalChange(e.target.value)}
              required
            >
              <option value="" disabled>Select Hospital Facility</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.id})
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category *</label>
              <Select
                value={newTicketForm.category}
                onChange={(e) => setNewTicketForm((prev) => ({ ...prev, category: e.target.value as SupportTicket['category'] }))}
              >
                <option value="Technical">Technical Issue</option>
                <option value="Billing">Billing & Subscription</option>
                <option value="Clinical Workflow">Clinical Workflow</option>
                <option value="Integration">Integration / HL7 / API</option>
                <option value="Feature Request">Feature Request</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority Level *</label>
              <Select
                value={newTicketForm.priority}
                onChange={(e) => setNewTicketForm((prev) => ({ ...prev, priority: e.target.value as SupportTicket['priority'] }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </div>

          <Input
            label="Escalation Subject / Title *"
            placeholder="e.g., HL7 Gateway Batch Synchronization Timeout"
            value={newTicketForm.title}
            onChange={(e) => setNewTicketForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Requester / Contact Name"
              placeholder="e.g., Dr. Arthur Vance"
              value={newTicketForm.requesterName}
              onChange={(e) => setNewTicketForm((prev) => ({ ...prev, requesterName: e.target.value }))}
            />
            <Input
              label="Requester Email"
              type="email"
              placeholder="e.g., admin@apexmedical.org"
              value={newTicketForm.requesterEmail}
              onChange={(e) => setNewTicketForm((prev) => ({ ...prev, requesterEmail: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Detailed Description / Problem Narrative</label>
            <Textarea
              placeholder="Provide complete breakdown of the error, affected department or module, and urgency context..."
              rows={4}
              value={newTicketForm.description}
              onChange={(e) => setNewTicketForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEscalationModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isCreatingTicket || !newTicketForm.title.trim()}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {isCreatingTicket ? 'Registering Ticket...' : 'Register Escalation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
