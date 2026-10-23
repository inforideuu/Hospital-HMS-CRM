import React, { useMemo } from 'react';
import {
  FileText,
  Activity,
  HeartPulse,
  Calendar,
  BedDouble,
  ShieldCheck,
  Stethoscope,
  Download,
} from 'lucide-react';
import { MockStorage } from '../../services/mockStorage';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const PatientMedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || '';

  const patient = MockStorage.getPatientById(patientId);
  const admissions = MockStorage.getAdmissions(undefined, patientId);
  const appointments = MockStorage.getAppointments(undefined, patientId);

  const clinicalTimeline = useMemo(() => {
    const list: Array<{
      date: string;
      type: string;
      doctor: string;
      specialty: string;
      summary: string;
    }> = [];

    appointments.forEach((apt) => {
      list.push({
        date: apt.appointmentDate,
        type: `OPD Consultation (${apt.status})`,
        doctor: apt.doctorName || 'Attending Specialist',
        specialty: apt.doctorSpecialization || apt.departmentName || 'General OPD',
        summary: apt.reason
          ? `Visit Reason: ${apt.reason}.${apt.notes ? ` Clinical Notes: ${apt.notes}` : ''}`
          : 'Consultation session scheduled.',
      });
    });

    admissions.forEach((adm) => {
      list.push({
        date: adm.admissionDate,
        type: `Inpatient Admission (${adm.status})`,
        doctor: adm.doctorName || 'Attending Physician',
        specialty: (adm as any).department || adm.departmentName || 'Inpatient Care',
        summary: `Admitted to ${(adm as any).wardName || adm.wardType || 'Ward'} (Bed ${adm.bedNumber || 'N/A'}). Diagnosis: ${(adm as any).diagnosis || adm.reason || 'Clinical evaluation'}.`,
      });
    });

    if (patient?.registeredDate) {
      list.push({
        date: patient.registeredDate,
        type: 'Hospital Registration',
        doctor: 'Hospital Registrar',
        specialty: 'Patient Administration',
        summary: `Patient record registered in Electronic Medical Records. Declared blood group: ${patient.bloodGroup || 'N/A'}.`,
      });
    }

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, admissions, patient]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Electronic Health Records (EHR) & Clinical History"
        subtitle="Review longitudinal medical diagnoses, physician clinical notes, and inpatient discharge summaries."
        breadcrumbs={[{ label: 'Patient Portal', href: '/patient/dashboard' }, { label: 'Medical Records' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => MockStorage.exportToCSV(`EHR_Summary_${patientId}`, clinicalTimeline)}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download EHR Record
          </Button>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Recorded Diagnoses</h4>
          <div className="space-y-1.5">
            {patient?.medicalHistory.map((m, i) => (
              <span key={i} className="inline-block px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-800 text-xs font-bold mr-1.5 mb-1.5 border border-indigo-100">
                🩺 {m}
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Clinical Allergies</h4>
          <div className="space-y-1.5">
            {patient?.allergies.map((a, i) => (
              <span key={i} className="inline-block px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 text-xs font-bold mr-1.5 mb-1.5 border border-rose-200">
                ⚠️ {a}
              </span>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Inpatient Ward Stays</h4>
          <p className="text-xl font-bold text-slate-900">{admissions.length} Admissions</p>
          <p className="text-xs text-slate-500 mt-1">Total critical care & general ward stays</p>
        </Card>
      </div>

      {/* Longitudinal Clinical Timeline */}
      <Card>
        <CardHeader
          title="Longitudinal Clinical Care Timeline"
          subtitle="Chronological log of hospital visits, diagnoses, and medical summaries"
        />
        <CardContent className="p-6">
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
            {clinicalTimeline.map((item, idx) => (
              <div key={idx} className="relative pl-6">
                <span className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-teal-600 ring-4 ring-white" />
                <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{item.type}</span>
                      <Badge variant="indigo" size="sm">{item.specialty}</Badge>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{item.date}</span>
                  </div>
                  <p className="text-xs text-teal-800 font-semibold flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5" /> Attending: {item.doctor}
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                    {item.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
