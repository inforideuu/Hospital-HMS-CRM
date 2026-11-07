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

export const HospitalSettings: React.FC = () => {
  const { currentHospital } = useAuth();
  const { showToast } = useNotification();
  const hospId = currentHospital?.id || 'HOSP-001';

  const [settings, setSettings] = useState<HospitalSettingsType>(() => MockStorage.getHospitalSettings(hospId));

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
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
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

            {/* Cancellation & Rescheduling Cutoff and Penalty Policies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <Input
                label="Penalty-Free Cancellation Cutoff (Hours)"
                type="number"
                min="0"
                max="72"
                value={settings.cancellationDeadlineHours ?? 4}
                onChange={(e) => setSettings({ ...settings, cancellationDeadlineHours: Math.max(0, Number(e.target.value) || 0) })}
                helperText="Minimum hours before slot to cancel without penalty."
              />
              <Input
                label="Late Cancellation Penalty (% of Consultation Fee)"
                type="number"
                min="0"
                max="100"
                step="5"
                value={settings.cancellationPenaltyPercent ?? 50}
                onChange={(e) => setSettings({ ...settings, cancellationPenaltyPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                helperText="% of consultation fee charged when cancelled late."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Penalty-Free Rescheduling Cutoff (Hours)"
                type="number"
                min="0"
                max="72"
                value={settings.reschedulingDeadlineHours ?? 4}
                onChange={(e) => setSettings({ ...settings, reschedulingDeadlineHours: Math.max(0, Number(e.target.value) || 0) })}
                helperText="Minimum hours before slot to reschedule without penalty."
              />
              <Input
                label="Late Rescheduling Penalty (% of Consultation Fee)"
                type="number"
                min="0"
                max="100"
                step="5"
                value={settings.reschedulingPenaltyPercent ?? 50}
                onChange={(e) => setSettings({ ...settings, reschedulingPenaltyPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
                helperText="% of consultation fee charged when shifted late within cutoff."
              />
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
  );
};
