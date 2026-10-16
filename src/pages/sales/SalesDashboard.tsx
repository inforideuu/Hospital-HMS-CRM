import React from 'react';
import {
  Target,
  UserPlus,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  Calendar,
  ArrowRight,
  PhoneCall,
  Mail,
  Video,
  FileText,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MockStorage } from '../../services/mockStorage';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const SalesDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const leads = MockStorage.getSalesLeads(user?.id);
  const followUps = MockStorage.getLeadFollowUps(user?.id);
  const customers = MockStorage.getConvertedCustomers(user?.id);
  const activities = MockStorage.getLeadActivities();

  // Metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'New').length;
  const qualifiedLeads = leads.filter((l) => l.status === 'Qualified').length;
  const followUpsDueToday = followUps.filter((f) => f.status === 'Pending').length;
  const demosScheduled = leads.filter((l) => l.status === 'Demo Scheduled').length;
  const proposalsSent = leads.filter((l) => l.status === 'Proposal Sent').length;
  const convertedCount = leads.filter((l) => l.status === 'Converted').length;
  const lostCount = leads.filter((l) => l.status === 'Lost').length;

  // Pipeline breakdown
  const pipelineStages = [
    { label: 'New', count: newLeads, color: 'bg-blue-500' },
    { label: 'Contacted', count: leads.filter((l) => l.status === 'Contacted').length, color: 'bg-cyan-500' },
    { label: 'Qualified', count: qualifiedLeads, color: 'bg-teal-500' },
    { label: 'Demo Scheduled', count: demosScheduled, color: 'bg-indigo-500' },
    { label: 'Demo Completed', count: leads.filter((l) => l.status === 'Demo Completed').length, color: 'bg-purple-500' },
    { label: 'Proposal Sent', count: proposalsSent, color: 'bg-amber-500' },
    { label: 'Negotiation', count: leads.filter((l) => l.status === 'Negotiation').length, color: 'bg-orange-500' },
    { label: 'Converted', count: convertedCount, color: 'bg-emerald-500' },
    { label: 'Lost', count: lostCount, color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Sales & Business Development Portal"
        subtitle={`Welcome back, ${user?.name || 'Sales Executive'}. Manage your SaaS hospital lead acquisition and conversion workflow.`}
        breadcrumbs={[{ label: 'Sales CRM', href: '/sales/dashboard' }, { label: 'Dashboard' }]}
        actions={
          <Button variant="primary" size="sm" onClick={() => navigate('/sales/leads')} leftIcon={<Target className="w-4 h-4" />}>
            Manage All Leads
          </Button>
        }
      />

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalLeads}</p>
              <span className="text-[11px] text-blue-600 font-medium">{newLeads} New Inquiries</span>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Target className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-teal-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualified Leads</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{qualifiedLeads}</p>
              <span className="text-[11px] text-teal-600 font-medium">Ready for Demo</span>
            </div>
            <div className="p-3 bg-teal-50 rounded-xl text-teal-600">
              <Award className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Follow-ups Due</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{followUpsDueToday}</p>
              <span className="text-[11px] text-amber-600 font-medium">Action Required Today</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Converted Customers</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{convertedCount}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Hospitals Onboarded</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Demos Scheduled</p>
            <p className="text-base font-bold text-slate-900">{demosScheduled}</p>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Proposals Sent</p>
            <p className="text-base font-bold text-slate-900">{proposalsSent}</p>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Conversion Rate</p>
            <p className="text-base font-bold text-slate-900">
              {totalLeads > 0 ? `${Math.round((convertedCount / totalLeads) * 100)}%` : '0%'}
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-slate-500">Lost Leads</p>
            <p className="text-base font-bold text-slate-900">{lostCount}</p>
          </div>
        </div>
      </div>

      {/* Visualizations & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Pipeline Funnel Overview */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Lead Conversion Pipeline"
            subtitle="Stage-by-stage distribution of active hospital leads"
          />
          <CardContent className="p-5 space-y-4">
            <div className="space-y-3">
              {pipelineStages.map((stage) => {
                const pct = totalLeads > 0 ? Math.round((stage.count / totalLeads) * 100) : 0;
                return (
                  <div key={stage.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{stage.label}</span>
                      <span className="font-mono text-slate-500">{stage.count} leads ({pct}%)</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${stage.color} transition-all duration-500 rounded-full`}
                        style={{ width: `${Math.max(pct, stage.count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Items: Follow-ups Due */}
        <Card>
          <CardHeader
            title="Pending Follow-ups"
            subtitle="Tasks scheduled for today"
            action={
              <Button variant="ghost" size="xs" onClick={() => navigate('/sales/follow-ups')}>
                View All
              </Button>
            }
          />
          <CardContent className="p-4 space-y-3">
            {followUps.filter((f) => f.status === 'Pending').length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                <p>No pending follow-ups for today!</p>
              </div>
            ) : (
              followUps
                .filter((f) => f.status === 'Pending')
                .slice(0, 4)
                .map((f) => (
                  <div key={f.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{f.leadHospitalName || 'Hospital Lead'}</span>
                      <Badge variant="warning">{f.type}</Badge>
                    </div>
                    <p className="text-slate-600 line-clamp-1">{f.notes}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{f.date} {f.time ? `at ${f.time}` : ''}</span>
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Lead Inquiries */}
      <Card>
        <CardHeader
          title="Recent Lead Inquiries"
          subtitle="Hospital leads assigned to your queue"
          action={
            <Button variant="outline" size="sm" onClick={() => navigate('/sales/leads')}>
              View Full Pipeline
            </Button>
          }
        />
        <CardContent className="p-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Hospital & Contact</th>
                  <th className="px-4 py-3">Location & Beds</th>
                  <th className="px-4 py-3">Lead Source</th>
                  <th className="px-4 py-3">Interested Plan</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.slice(0, 5).map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{lead.hospitalName}</p>
                      <p className="text-[11px] text-slate-500">{lead.contactPerson} ({lead.designation || 'Contact'})</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">
                      <p>{lead.city || 'N/A'}, {lead.state || ''}</p>
                      <p className="text-[10px] text-slate-400">{lead.bedCount || 50} Beds</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {lead.leadSource}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold capitalize text-indigo-600">
                      {lead.interestedPlan || 'Trial'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={lead.status === 'Converted' ? 'success' : lead.status === 'Lost' ? 'error' : 'warning'}>
                        {lead.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button variant="ghost" size="xs" onClick={() => navigate(`/sales/leads`)}>
                        Manage Lead
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
