import React, { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Droplet,
  ShieldCheck,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Patient } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export const PatientProfile: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotification();
  const patientId = user?.patientId || 'PAT-1001';

  const [patient, setPatient] = useState<Patient>(() => {
    return (
      MockStorage.getPatientById(patientId) || {
        id: patientId,
        hospitalId: 'HOSP-001',
        name: user?.name || 'Eleanor Vance',
        email: user?.email || 'patient@apexmedical.org',
        phone: '+1 (555) 301-4492',
        dateOfBirth: '1978-04-14',
        age: 48,
        gender: 'Female',
        bloodGroup: 'O+',
        address: '450 Park Avenue, Apt 12B, New York, NY',
        emergencyContactName: 'Robert Vance (Spouse)',
        emergencyContactPhone: '+1 (555) 301-4490',
        emergencyContactRelation: 'Spouse',
        status: 'Outpatient',
        allergies: ['Penicillin', 'Sulfa Drugs'],
        medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
        registeredDate: '2024-03-12',
      }
    );
  });

  const [allergiesText, setAllergiesText] = useState(patient.allergies.join(', '));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Patient = {
      ...patient,
      allergies: allergiesText.split(',').map((s) => s.trim()).filter(Boolean),
    };
    MockStorage.savePatient(updated);
    setPatient(updated);
    showToast('Profile Saved', 'Your medical demographics & emergency contacts have been updated.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="My Patient Health Profile & Demographics"
        subtitle="Manage your personal contact info, emergency contacts, and declared drug allergies."
        breadcrumbs={[{ label: 'Patient Portal', href: '/patient/dashboard' }, { label: 'My Profile' }]}
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Personal Details */}
        <Card>
          <CardHeader
            title="Personal Identification"
            subtitle="Verified EHR identity linked to your national health number"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Legal Name"
                value={patient.name}
                onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                required
              />
              <Input
                label="EHR Patient ID"
                value={patient.id}
                disabled
                helperText="System assigned patient record identifier"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Date of Birth"
                type="date"
                value={patient.dateOfBirth}
                onChange={(e) => setPatient({ ...patient, dateOfBirth: e.target.value })}
              />
              <Input
                label="Age (Years)"
                type="number"
                value={patient.age}
                onChange={(e) => setPatient({ ...patient, age: Number(e.target.value) })}
              />
              <Select
                label="Gender"
                value={patient.gender}
                onChange={(e) => setPatient({ ...patient, gender: e.target.value as any })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Phone *"
                value={patient.phone}
                onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                required
              />
              <Input
                label="Email Address *"
                type="email"
                value={patient.email}
                onChange={(e) => setPatient({ ...patient, email: e.target.value })}
                required
              />
            </div>

            <Input
              label="Primary Residential Address"
              value={patient.address}
              onChange={(e) => setPatient({ ...patient, address: e.target.value })}
            />
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader
            title="Designated Emergency Contacts"
            subtitle="Immediate point of contact in case of emergency or trauma admission"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Contact Name"
                value={patient.emergencyContactName}
                onChange={(e) => setPatient({ ...patient, emergencyContactName: e.target.value })}
              />
              <Input
                label="Emergency Phone"
                value={patient.emergencyContactPhone}
                onChange={(e) => setPatient({ ...patient, emergencyContactPhone: e.target.value })}
              />
              <Input
                label="Relationship"
                value={patient.emergencyContactRelation}
                onChange={(e) => setPatient({ ...patient, emergencyContactRelation: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Clinical Allergies */}
        <Card>
          <CardHeader
            title="Known Clinical Allergies"
            subtitle="Adverse drug and food reactions flagged in your electronic medical chart"
          />
          <CardContent className="space-y-3">
            <Input
              label="Declared Drug / Food Allergies (Comma separated)"
              value={allergiesText}
              onChange={(e) => setAllergiesText(e.target.value)}
              placeholder="e.g. Penicillin, Sulfa, Peanuts"
            />
            <p className="text-xs text-slate-500">
              ⚠️ Allergies are automatically transmitted to attending physicians, surgeons, and pharmacists prior to dispensing.
            </p>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
