import React from 'react';
import { User as UserIcon, Mail, Phone, Shield, Calendar, Award, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export const SalesProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <PageHeader
        title="Sales Executive Profile"
        subtitle="Manage your platform employee credentials and CRM profile"
        breadcrumbs={[{ label: 'Sales CRM', href: '/sales/dashboard' }, { label: 'My Profile' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-brand-600 to-teal-400 p-1 shadow-lg">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={user?.name}
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">{user?.name}</h3>
              <p className="text-xs text-brand-600 font-semibold mt-0.5">Sales & Business Development Executive</p>
              <Badge variant="success" className="mt-2">Platform Employee</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader
            title="Account Details"
            subtitle="Platform role and contact credentials"
          />
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
              <div>
                <p className="text-slate-400">User ID</p>
                <p className="font-mono font-bold text-slate-900">{user?.id || 'USR-SALES-01'}</p>
              </div>
              <div>
                <p className="text-slate-400">Platform Role</p>
                <p className="font-semibold text-slate-900">sales_executive</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
              <div>
                <p className="text-slate-400">Email Address</p>
                <p className="font-mono font-bold text-slate-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-slate-400">Portal Scope</p>
                <p className="font-semibold text-slate-900">Sales & CRM Portal</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400">Account Status</p>
                <Badge variant="success">Active</Badge>
              </div>
              <div>
                <p className="text-slate-400">Member Since</p>
                <p className="font-medium text-slate-800">{user?.createdAt || '2025-01-10'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
