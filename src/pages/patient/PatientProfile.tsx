import React from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Droplet,
  ShieldCheck,
  Lock,
  AlertTriangle,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { useAuth } from '../../context/AuthContext';
import { Patient } from '../../types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

export const PatientProfile: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || 'PAT-1001';

  const patient: Patient = MockStorage.getPatientById(patientId) || {
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
  };

  const allergiesText = Array.isArray(patient.allergies) ? patient.allergies.join(', ') : '';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="My Patient Health Profile & Demographics"
        subtitle="Official hospital EHR identification, emergency contacts, and declared allergies."
        breadcrumbs={[{ label: 'Patient Portal', href: '/patient/dashboard' }, { label: 'My Profile' }]}
      />

      {/* Locked Record Compliance Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-4 shadow-sm border border-slate-800">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-2">
              Verified Electronic Health Record (EHR)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">Locked</span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              To ensure clinical safety, HIPAA compliance, and medical chart integrity, patient demographic and clinical records are locked and cannot be edited online. To request demographic adjustments, please contact hospital reception.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
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
                disabled
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
                disabled
              />
              <Input
                label="Age (Years)"
                type="number"
                value={patient.age}
                disabled
              />
              <Select
                label="Gender"
                value={patient.gender}
                disabled
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Phone"
                value={patient.phone}
                disabled
              />
              <Input
                label="Email Address"
                type="email"
                value={patient.email}
                disabled
              />
            </div>

            <Input
              label="Primary Residential Address"
              value={patient.address}
              disabled
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
                disabled
              />
              <Input
                label="Emergency Phone"
                value={patient.emergencyContactPhone}
                disabled
              />
              <Input
                label="Relationship"
                value={patient.emergencyContactRelation}
                disabled
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
              label="Declared Drug / Food Allergies"
              value={allergiesText || 'No known drug allergies on record'}
              disabled
            />
            <p className="text-xs text-slate-500">
              ⚠️ Allergies are automatically transmitted to attending physicians, surgeons, and pharmacists prior to dispensing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientProfile;
