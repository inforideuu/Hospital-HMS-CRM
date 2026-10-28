import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  HelpCircle,
  Plus,
  Search,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  X,
  Building2,
  User,
  Mail,
  FileText,
  RefreshCw,
  Tag,
  ShieldCheck,
  Eye,
  Trash2,
  Upload,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { MockStorage } from '../../../services/mockStorage';
import { SupportTicket } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/ui/EmptyState';

export const HospitalSupportManagement: React.FC = () => {
  const { currentHospital, user } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || user?.hospitalId || 'HOSP-001';
  const hospName = currentHospital?.name || 'Healthcare Facility';

  const [tickets, setTickets] = useState<SupportTicket[]>(() => MockStorage.getSupportTickets(hospId));
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Raise Ticket Modal State
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState<{
    title: string;
    category: SupportTicket['category'];
    priority: SupportTicket['priority'];
    description: string;
    requesterName: string;
    requesterEmail: string;
    screenshotUrl: string;
    attachmentName: string;
  }>({
    title: '',
    category: 'Technical',
    priority: 'medium',
    description: '',
    requesterName: user?.name || 'Hospital Administrator',
    requesterEmail: user?.email || '',
    screenshotUrl: '',
    attachmentName: '',
  });

  // Image full preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    setIsRefreshing(true);
    const updated = MockStorage.getSupportTickets(hospId);
    setTickets(updated);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('pulse_storage_updated', refreshData);
    return () => window.removeEventListener('pulse_storage_updated', refreshData);
  }, [hospId]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter]);

  // Keep a selected ticket
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

  // Metrics
  const metrics = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      inProgress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length,
    };
  }, [tickets]);

  // Screenshot File Handler (Convert to Base64 data URL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Invalid File Type', 'Please upload an image file (PNG, JPG, JPEG, WebP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Screenshot must be under 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      setTicketForm((prev) => ({
        ...prev,
        screenshotUrl: result,
        attachmentName: file.name,
      }));
      showToast('Screenshot Attached', `${file.name} ready to submit.`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveScreenshot = () => {
    setTicketForm((prev) => ({
      ...prev,
      screenshotUrl: '',
      attachmentName: '',
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Open raise ticket modal
  const handleOpenRaiseModal = () => {
    setTicketForm({
      title: '',
      category: 'Technical',
      priority: 'medium',
      description: '',
      requesterName: user?.name || 'Hospital Administrator',
      requesterEmail: user?.email || '',
      screenshotUrl: '',
      attachmentName: '',
    });
    setIsRaiseModalOpen(true);
  };

  // Submit Ticket
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.title.trim() || !ticketForm.description.trim()) {
      showToast('Required Fields Missing', 'Please enter an issue title and description.', 'error');
      return;
    }

    setIsSubmittingTicket(true);

    const ticketId = `TICK-${Date.now().toString().slice(-6)}`;
    const nowISO = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newTicket: SupportTicket = {
      id: ticketId,
      hospitalId: hospId,
      hospitalName: hospName,
      title: ticketForm.title.trim(),
      description: ticketForm.description.trim(),
      category: ticketForm.category,
      priority: ticketForm.priority,
      status: 'open',
      requesterName: ticketForm.requesterName.trim() || user?.name || 'Hospital Administrator',
      requesterEmail: ticketForm.requesterEmail.trim() || user?.email || '',
      assignedTo: 'Platform Engineering & Support Desk',
      createdAt: nowISO,
      updatedAt: nowISO,
      screenshotUrl: ticketForm.screenshotUrl || undefined,
      attachmentName: ticketForm.attachmentName || undefined,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: ticketForm.requesterName.trim() || user?.name || 'Hospital Administrator',
          senderRole: 'hospital',
          message: ticketForm.description.trim(),
          timestamp: nowISO,
          screenshotUrl: ticketForm.screenshotUrl || undefined,
        },
      ],
    };

    MockStorage.saveSupportTicket(newTicket);
    setIsSubmittingTicket(false);
    setIsRaiseModalOpen(false);
    setSelectedTicketId(newTicket.id);
    refreshData();

    showToast(
      'Support Ticket Raised',
      `Ticket #${newTicket.id} has been submitted to Platform HQ. Our engineering team has been notified.`,
      'success'
    );
  };

  // Send Message Reply
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || isSubmittingReply) return;

    setIsSubmittingReply(true);
    const sender = user?.name || 'Hospital Administrator';

    MockStorage.addTicketReply(selectedTicket.id, replyText.trim(), sender, 'hospital');
    setReplyText('');
    setIsSubmittingReply(false);
    refreshData();
    showToast('Reply Dispatched', 'Your message was added to the support thread.', 'success');
  };

  const getPriorityBadge = (priority: SupportTicket['priority']) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="error" size="sm">Urgent Escalation</Badge>;
      case 'high':
        return <Badge variant="warning" size="sm">High Priority</Badge>;
      case 'medium':
        return <Badge variant="indigo" size="sm">Medium</Badge>;
      case 'low':
      default:
        return <Badge variant="neutral" size="sm">Low</Badge>;
    }
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'open':
        return <Badge variant="warning" size="sm">Submitted / Open</Badge>;
      case 'in_progress':
        return <Badge variant="purple" size="sm">Under Investigation</Badge>;
      case 'resolved':
        return <Badge variant="success" size="sm">Resolved</Badge>;
      case 'closed':
        return <Badge variant="neutral" size="sm">Closed</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Help & Support Desk"
        subtitle={`Direct technical escalation desk for ${hospName}. Report system issues, request clinical workflow help, or inquiry about subscription billing.`}
        breadcrumbs={[
          { label: 'Hospital HMS', href: '/hospital/dashboard' },
          { label: 'Help & Support' },
        ]}
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
              onClick={handleOpenRaiseModal}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
            >
              Raise Support Ticket
            </Button>
          </div>
        }
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Tickets</p>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{metrics.total}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Awaiting Platform Review</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">{metrics.open}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">In Progress by HQ</p>
            <AlertCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-700 mt-2">{metrics.inProgress}</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Resolved</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">{metrics.resolved}</p>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4">
            <div className="space-y-3">
              <Input
                placeholder="Search tickets by ID, title, category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />

              <div className="grid grid-cols-2 gap-2">
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="open">Open / Submitted</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </Select>

                <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </Select>
              </div>
            </div>

            <div className="mt-4 divide-y divide-slate-100 max-h-[600px] overflow-y-auto pr-1">
              {filteredTickets.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    icon={<HelpCircle className="w-8 h-8 text-slate-400" />}
                    title="No Support Tickets Found"
                    description="You currently have no raised support tickets matching your filters."
                    actionText="Raise a Ticket"
                    onAction={handleOpenRaiseModal}
                  />
                </div>
              ) : (
                filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full text-left p-3.5 rounded-xl transition-all cursor-pointer relative my-1 ${
                        isSelected
                          ? 'bg-indigo-50/80 border-2 border-indigo-600 shadow-xs'
                          : 'hover:bg-slate-50 border border-slate-200/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {t.id}
                          </span>
                          {getStatusBadge(t.status)}
                        </div>
                        {getPriorityBadge(t.priority)}
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1 leading-snug">{t.title}</h4>

                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                          <Tag className="w-2.5 h-2.5 text-slate-400" /> {t.category}
                        </span>
                        {t.screenshotUrl && (
                          <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                            <ImageIcon className="w-2.5 h-2.5" /> Screenshot
                          </span>
                        )}
                        <span>{t.updatedAt || t.createdAt}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Ticket Conversation Thread */}
        <div className="lg:col-span-7 flex flex-col">
          {selectedTicket ? (
            <Card className="flex-1 flex flex-col justify-between overflow-hidden">
              <div>
                {/* Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-bold">
                          {selectedTicket.id}
                        </span>
                        {getPriorityBadge(selectedTicket.priority)}
                        <Badge variant="neutral" size="sm">{selectedTicket.category}</Badge>
                        {getStatusBadge(selectedTicket.status)}
                      </div>
                      <h3 className="font-bold text-base text-slate-900 mt-1">{selectedTicket.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>Raised by: <strong>{selectedTicket.requesterName}</strong></span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedTicket.createdAt}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned Support Desk:</span>
                      <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 inline-block mt-0.5">
                        {selectedTicket.assignedTo || 'Platform Operations HQ'}
                      </span>
                    </div>
                  </div>

                  {/* Initial Problem Description */}
                  {selectedTicket.description && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5 shadow-2xs">
                      <p className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-slate-500">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" /> Problem Description:
                      </p>
                      <p className="whitespace-pre-line leading-relaxed">{selectedTicket.description}</p>
                    </div>
                  )}

                  {/* Attached Screenshot Evidence (if provided) */}
                  {selectedTicket.screenshotUrl && (
                    <div className="mt-3 p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-indigo-950 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-indigo-600" />
                          Attached Diagnostic Evidence / Screenshot:
                        </p>
                        <span className="text-[10px] text-indigo-600 font-mono">
                          {selectedTicket.attachmentName || 'screenshot.png'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => setPreviewImageUrl(selectedTicket.screenshotUrl || null)}
                          className="relative group cursor-pointer border border-indigo-200 rounded-lg overflow-hidden max-w-xs shadow-xs hover:border-indigo-400 transition-all"
                        >
                          <img
                            src={selectedTicket.screenshotUrl}
                            alt="Attached Error Screenshot"
                            className="max-h-36 w-auto object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Eye className="w-3.5 h-3.5" /> Click to view full image
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          This screenshot was forwarded to the platform engineering team for diagnostic troubleshooting.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Conversation Thread */}
                <div className="p-5 overflow-y-auto max-h-[360px] space-y-3.5">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Live Support Conversation Thread
                    </span>
                  </div>

                  {selectedTicket.messages.map((m) => {
                    const isHospital = m.senderRole === 'hospital';
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 max-w-[85%] ${isHospital ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                            isHospital ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-teal-400'
                          }`}
                        >
                          {isHospital ? 'You' : 'HQ'}
                        </div>
                        <div
                          className={`p-3.5 rounded-2xl text-xs space-y-1 shadow-xs ${
                            isHospital
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 text-[10px] opacity-80">
                            <span className="font-semibold">{m.sender}</span>
                            <span>{m.timestamp}</span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>
                          {m.screenshotUrl && (
                            <img
                              src={m.screenshotUrl}
                              alt="Attached"
                              onClick={() => setPreviewImageUrl(m.screenshotUrl || null)}
                              className="mt-2 max-h-32 rounded border border-white/30 cursor-pointer"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-200 bg-slate-50/70">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a follow-up message to the platform engineering team..."
                  rows={2}
                  className="w-full text-xs"
                />
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[11px] text-slate-500">
                    Your reply is sent directly to Platform Super Admin Support.
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                    disabled={!replyText.trim() || isSubmittingReply}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Send Reply
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <EmptyState
                icon={<HelpCircle className="w-12 h-12 text-slate-300" />}
                title="Select a Support Ticket"
                description="Select a ticket from the left panel to review message history, or raise a new ticket."
                actionText="Raise Support Ticket"
                onAction={handleOpenRaiseModal}
              />
            </Card>
          )}
        </div>
      </div>

      {/* Raise Support Ticket Modal */}
      <Modal
        isOpen={isRaiseModalOpen}
        onClose={() => setIsRaiseModalOpen(false)}
        title="Raise Support Ticket to Platform HQ"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitTicket} className="space-y-4">
          <div className="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-[10px] uppercase font-bold text-indigo-700">Reporting Facility</p>
                <p className="text-xs font-bold text-slate-900">{hospName} ({hospId})</p>
              </div>
            </div>
            <span className="text-[10px] bg-white text-indigo-800 font-semibold px-2 py-0.5 rounded border border-indigo-200">
              Multi-Tenant Cloud HMS
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Requester Name *"
              value={ticketForm.requesterName}
              onChange={(e) => setTicketForm({ ...ticketForm, requesterName: e.target.value })}
              required
            />
            <Input
              label="Contact Email Address *"
              type="email"
              value={ticketForm.requesterEmail}
              onChange={(e) => setTicketForm({ ...ticketForm, requesterEmail: e.target.value })}
              required
            />
          </div>

          <Input
            label="Issue Subject / Short Summary *"
            placeholder="e.g. Bed occupancy calculation incorrect on discharge"
            value={ticketForm.title}
            onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Problem Category *"
              value={ticketForm.category}
              onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as SupportTicket['category'] })}
            >
              <option value="Technical">Technical (Bug, Software Error, Crash)</option>
              <option value="Billing">Billing & Subscription (Invoicing, Taxes, Plan)</option>
              <option value="Clinical Workflow">Clinical Workflow (EHR, OPD, IPD, Beds, Pharmacy)</option>
              <option value="Integration">Integration (Lab Devices, SMS/Email, POS)</option>
              <option value="Feature Request">Feature Request (Enhancement or New Module)</option>
            </Select>

            <Select
              label="Urgency / Severity Level *"
              value={ticketForm.priority}
              onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as SupportTicket['priority'] })}
            >
              <option value="low">Low - Minor inquiry or cosmetic issue</option>
              <option value="medium">Medium - Standard non-blocking workflow issue</option>
              <option value="high">High - Important workflow interrupted</option>
              <option value="urgent">Urgent - Critical blocker / patient care halted</option>
            </Select>
          </div>

          <div>
            <Textarea
              label="Detailed Problem Description *"
              placeholder="Please provide details of what happened, steps to reproduce, affected patient/bed/invoice numbers, and any error messages displayed..."
              rows={4}
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              required
            />
          </div>

          {/* Screenshot Upload Option (Optional) */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                Upload Error Screenshot (Optional)
              </label>
              <span className="text-[10px] text-slate-400">PNG, JPG, WebP up to 5MB</span>
            </div>

            {!ticketForm.screenshotUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl bg-white text-center cursor-pointer transition-colors"
              >
                <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">Click to upload screenshot</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Attaching an image helps platform engineers resolve your issue much faster.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={ticketForm.screenshotUrl}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-md border border-slate-200"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-xs">{ticketForm.attachmentName || 'screenshot.png'}</p>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Screenshot Attached
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveScreenshot}
                  className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Remove screenshot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRaiseModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingTicket}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Submit Ticket to Support Desk
            </Button>
          </div>
        </form>
      </Modal>

      {/* Full-resolution Screenshot Preview Modal */}
      {previewImageUrl && (
        <Modal
          isOpen={Boolean(previewImageUrl)}
          onClose={() => setPreviewImageUrl(null)}
          title="Attached Error Screenshot"
          maxWidth="4xl"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-center bg-slate-900 rounded-xl p-2 max-h-[75vh] overflow-auto">
              <img
                src={previewImageUrl}
                alt="Full resolution preview"
                className="max-h-[70vh] w-auto object-contain rounded"
              />
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setPreviewImageUrl(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default HospitalSupportManagement;
