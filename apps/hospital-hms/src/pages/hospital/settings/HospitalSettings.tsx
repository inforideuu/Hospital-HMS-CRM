import React, { useState } from 'react';
import {
  Settings,
  Building2,
  Phone,
  Mail,
  Clock,
  Save,
  Bell,
  ShieldCheck,
  Receipt,
  FileText,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { MockStorage } from '../../../services/mockStorage';
import { useAuth } from '../../../context/AuthContext';
import { useNotification } from '../../../context/NotificationContext';
import { HospitalSettings as HospitalSettingsType } from '../../../types';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, Textarea } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { BillingSoftwareAddonModal } from '../../../components/common/BillingSoftwareAddonModal';

export const HospitalSettings: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [settings, setSettings] = useState<HospitalSettingsType>(() => MockStorage.getHospitalSettings(hospId));
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);

  // Controlled by Super Admin in Platform Settings
  const isAddonEnabled = MockStorage.getPlatformSettings().enableBillingAddonModule !== false;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    MockStorage.saveHospitalSettings(settings);
    showToast('Hospital Settings Saved', 'Facility parameters and billing preferences updated.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Hospital Workspace Settings & Operating Policies"
        subtitle="Manage facility identity, emergency hotline, OPD consultation slot durations, and invoice payment terms."
        breadcrumbs={[{ label: 'Hospital HMS', href: '/hospital/dashboard' }, { label: 'Settings' }]}
        actions={
          isAddonEnabled ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddonModalOpen(true)}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md"
            >
              + Add On Billing Software
            </Button>
          ) : undefined
        }
      />

      <div className="max-w-4xl space-y-6">
        {/* Billing Software Add-On Highlight Banner (Controlled by Super Admin) */}
        {isAddonEnabled && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Billing Software Integration Add-On</h3>
                  <span className="text-[10px] uppercase font-mono font-extrabold px-2 py-0.5 rounded-full bg-purple-400 text-slate-950">
                    Hospital Add-On
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Unlock full POS billing, inventory management, cashier limits, and AI demand forecasting with our standalone billing suite.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddonModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold shrink-0"
              leftIcon={<ArrowUpRight className="w-4 h-4" />}
            >
              View Add-On Plans & Connect
            </Button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Hospital Profile Card */}
          <Card>
            <CardHeader
              title="Hospital Identity & Public Helplines"
              subtitle="Contact information printed on patient receipts and portal banners"
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Hospital Display Name"
                  value={settings.hospitalName}
                  onChange={(e) => setSettings({ ...settings, hospitalName: e.target.value })}
                  required
                />
                <Input
                  label="Motto / Clinical Tagline"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="24/7 Emergency Helpline"
                  value={settings.emergencyHelpline}
                  onChange={(e) => setSettings({ ...settings, emergencyHelpline: e.target.value })}
                  required
                />
                <Input
                  label="OPD Reception Phone"
                  value={settings.receptionPhone}
                  onChange={(e) => setSettings({ ...settings, receptionPhone: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Hospital Email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  required
                />
                <Input
                  label="Operating Hours"
                  value={settings.operatingHours}
                  onChange={(e) => setSettings({ ...settings, operatingHours: e.target.value })}
                />
              </div>

              <Input
                label="Physical Hospital Address"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Clinical Scheduling & Billing Config */}
          <Card>
            <CardHeader
              title="Clinical Scheduling & Invoicing Parameters"
              subtitle="Default time slots and taxation parameters"
            />
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Default OPD Consultation Slot (Minutes)"
                  type="number"
                  value={settings.consultationSlotMinutes}
                  onChange={(e) => setSettings({ ...settings, consultationSlotMinutes: Number(e.target.value) })}
                />
                <Input
                  label="Tax Identification / EIN Number"
                  value={settings.taxRegistrationNumber}
                  onChange={(e) => setSettings({ ...settings, taxRegistrationNumber: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">Automated SMS Reminders</p>
                    <p className="text-[11px] text-slate-500">Send appointment reminders 2 hours before OPD slot</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableSmsAlerts}
                    onChange={(e) => setSettings({ ...settings, enableSmsAlerts: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">Email Tax Invoices</p>
                    <p className="text-[11px] text-slate-500">Automatically dispatch PDF copy upon billing</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableEmailInvoices}
                    onChange={(e) => setSettings({ ...settings, enableEmailInvoices: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>

              <Textarea
                label="Standard Invoice Terms & Instructions"
                value={settings.invoiceNotes}
                onChange={(e) => setSettings({ ...settings, invoiceNotes: e.target.value })}
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setSettings(MockStorage.getHospitalSettings(hospId))}
            >
              Reset
            </Button>
            <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
              Save Workspace Settings
            </Button>
          </div>
        </form>
      </div>

      <BillingSoftwareAddonModal
        isOpen={isAddonModalOpen}
        onClose={() => setIsAddonModalOpen(false)}
      />
    </div>
  );
};

