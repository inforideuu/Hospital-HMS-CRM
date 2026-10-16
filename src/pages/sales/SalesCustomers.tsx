import React, { useState } from 'react';
import {
  CheckCircle2,
  Building2,
  Calendar,
  UserCheck,
  Search,
  ExternalLink,
  ShieldAlert,
  Clock,
  Award,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { useAuth } from '../../context/AuthContext';
import { ConvertedCustomer } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export const SalesCustomers: React.FC = () => {
  const { user } = useAuth();
  const [customers] = useState<ConvertedCustomer[]>(() => MockStorage.getConvertedCustomers(user?.id));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<ConvertedCustomer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const filtered = customers.filter((c) =>
    c.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.hospitalId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewCustomer = (cust: ConvertedCustomer) => {
    setSelectedCustomer(cust);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <PageHeader
        title="Converted Hospitals & SaaS Customers"
        subtitle="Read-only view of converted sales leads and their ongoing SaaS onboarding status."
        breadcrumbs={[{ label: 'Sales CRM', href: '/sales/dashboard' }, { label: 'Converted Hospitals' }]}
      />

      {/* Info Notice */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Sales & Onboarding Visibility Scope</p>
          <p className="mt-0.5 text-blue-800">
            As a Sales Executive, you can track the onboarding progress and registration details of your converted hospital customers. Subscription approvals, payment processing, and clinical operations remain under Platform Super Admin and Hospital Admin governance.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search hospital name, contact person, email, customer ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Directory */}
      <Card>
        <CardHeader
          title="Converted Hospital Customers"
          subtitle={`${filtered.length} hospital SaaS customers converted`}
        />
        <CardContent className="p-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3">Hospital & ID</th>
                  <th className="px-4 py-3">Contact Person & Admin</th>
                  <th className="px-4 py-3">Converted Date</th>
                  <th className="px-4 py-3">Subscription</th>
                  <th className="px-4 py-3">Admin Account</th>
                  <th className="px-4 py-3">Onboarding Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      No converted hospital customers found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((cust) => (
                    <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900">{cust.hospitalName}</p>
                        <p className="text-[10px] text-indigo-600 font-mono">{cust.hospitalId} • {cust.id}</p>
                      </td>

                      <td className="px-4 py-3.5 text-slate-800">
                        <p className="font-semibold">{cust.contactPerson}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{cust.email}</p>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 font-medium">
                        📅 {cust.convertedAt}
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant="warning">{cust.subscriptionStatus}</Badge>
                      </td>

                      <td className="px-4 py-3.5">
                        <Badge variant="success">{cust.hospitalAdminStatus}</Badge>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                          {cust.onboardingStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Button variant="ghost" size="xs" onClick={() => handleViewCustomer(cust)}>
                          View Summary
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Summary Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedCustomer?.hospitalName || 'Customer Summary'}
        subtitle={`Customer Ref: ${selectedCustomer?.id}`}
        maxWidth="md"
      >
        {selectedCustomer && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Hospital Tenant ID:</span>
                <span className="font-mono font-bold text-indigo-600">{selectedCustomer.hospitalId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Hospital Admin Email:</span>
                <span className="font-mono font-bold text-slate-900">{selectedCustomer.email}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Contact Phone:</span>
                <span className="font-mono text-slate-800">{selectedCustomer.phone}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Converted Date:</span>
                <span className="text-slate-700">{selectedCustomer.convertedAt}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Converted By:</span>
                <span className="text-slate-800">{selectedCustomer.convertedByName || 'Sales Executive'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Onboarding:</span>
                <Badge variant="success">{selectedCustomer.onboardingStatus}</Badge>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
