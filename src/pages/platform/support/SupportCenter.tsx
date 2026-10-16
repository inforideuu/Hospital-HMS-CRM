import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  User,
  Building2,
  Paperclip,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { SupportTicket } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Input';

export const SupportCenter: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const [tickets, setTickets] = useState<SupportTicket[]>(() => MockStorage.getSupportTickets());
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [replyText, setReplyText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const refreshData = () => {
    setTickets(MockStorage.getSupportTickets());
  };

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    MockStorage.addTicketReply(
      selectedTicket.id,
      replyText,
      `${user?.name || 'David Thorne'} (PulseCore Support)`,
      'platform_support'
    );
    setReplyText('');
    showToast('Reply Dispatched', 'Hospital administrator notified via SaaS notification pipeline.');
    refreshData();
  };

  const handleStatusChange = (ticketId: string, newStatus: SupportTicket['status']) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (target) {
      target.status = newStatus;
      MockStorage.saveSupportTicket(target);
      showToast('Ticket Updated', `Ticket status set to ${newStatus.toUpperCase()}`);
      refreshData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Support Desk & Tenant Escalations"
        subtitle="Review high-priority hospital integration issues, billing inquiries, and live ticket resolution threads."
        breadcrumbs={[{ label: 'Platform HQ', href: '/platform/dashboard' }, { label: 'Support Desk' }]}
      />

      {/* Ticket Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold uppercase">Total Tickets</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{tickets.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold uppercase">Open</p>
          <p className="text-xl font-bold text-indigo-600 mt-1">
            {tickets.filter((t) => t.status === 'open').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold uppercase">In Progress</p>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {tickets.filter((t) => t.status === 'in_progress').length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs">
          <p className="text-xs text-slate-500 font-semibold uppercase">Resolved</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {tickets.filter((t) => t.status === 'resolved').length}
          </p>
        </div>
      </div>

      {/* Master Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[550px]">
        {/* Left Ticket List */}
        <div className="lg:col-span-5 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <div className="p-3 border-b border-slate-100 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tickets or hospital..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs py-1"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[500px]">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer ${
                      isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[10px] text-slate-400">{t.id}</span>
                      {t.priority === 'high' && <Badge variant="error" size="sm">High Priority</Badge>}
                      {t.priority === 'medium' && <Badge variant="warning" size="sm">Medium</Badge>}
                      {t.priority === 'low' && <Badge variant="neutral" size="sm">Low</Badge>}
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{t.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{t.hospitalName}</span>
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                      <span>{t.category}</span>
                      <span>{t.updatedAt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right Active Ticket Thread & Reply Box */}
        <div className="lg:col-span-7 flex flex-col">
          {selectedTicket ? (
            <Card className="flex-1 flex flex-col justify-between">
              <div>
                {/* Ticket Header */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-indigo-600 font-bold">{selectedTicket.id}</span>
                      <h3 className="font-bold text-sm text-slate-900">{selectedTicket.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Raised by <span className="font-semibold text-slate-700">{selectedTicket.requesterName}</span> ({selectedTicket.hospitalName})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as any)}
                      className="text-xs py-1"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </Select>
                  </div>
                </div>

                {/* Messages Thread */}
                <div className="p-5 overflow-y-auto max-h-[350px] space-y-4">
                  {selectedTicket.messages.map((m) => {
                    const isSupport = m.senderRole === 'platform_support';
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 max-w-[85%] ${isSupport ? 'ml-auto flex-row-reverse' : ''}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            isSupport ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isSupport ? 'HQ' : 'H'}
                        </div>
                        <div
                          className={`p-3.5 rounded-2xl text-xs space-y-1 ${
                            isSupport
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-slate-100 text-slate-800 rounded-tl-none'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4 text-[10px] opacity-80">
                            <span className="font-semibold">{m.sender}</span>
                            <span>{m.timestamp}</span>
                          </div>
                          <p className="leading-relaxed">{m.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reply Input Form */}
              <form onSubmit={handleSendReply} className="p-4 border-t border-slate-100 bg-slate-50/50">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official support reply to the hospital administrator..."
                  rows={2}
                />
                <div className="flex items-center justify-between mt-2 pt-2">
                  <span className="text-[11px] text-slate-400">
                    Pressing Send transmits notification & updates the ticket thread.
                  </span>
                  <Button type="submit" variant="primary" size="sm" rightIcon={<Send className="w-3.5 h-3.5" />}>
                    Send Reply
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <p className="text-xs text-slate-400">Select a ticket from the left to review the conversation thread.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
