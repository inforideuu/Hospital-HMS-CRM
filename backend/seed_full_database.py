import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_hms_backend.settings')
django.setup()

from django.utils import timezone
from api.models import (
    Hospital, Department, OPDRoom, Doctor, DoctorSchedule,
    UserProfile, Staff, Patient, Appointment, Consultation,
    BillingInvoice, HospitalSetting, PlatformSetting, WebsiteSection,
    Organization, SubscriptionPlan, HospitalWebsite, AppointmentSettings,
    DoctorUnavailablePeriod, LabOrder, SalesLead, BranchCreationRequest
)

def seed():
    print("--> Seeding Full HMS Database into MySQL (crm_hms_db)...")

    # 0. Organizations
    org1, _ = Organization.objects.update_or_create(
        id='ORG-001',
        defaults={
            'name': 'Zenelait Healthcare Network',
            'slug': 'zenelait-health',
            'headquarters_city': 'Mumbai',
            'headquarters_address': 'Corporate Tower, BKC, Mumbai',
        }
    )
    print(f"[OK] Seeded Organization: {org1.name}")

    # 1. Hospitals
    hosp1, _ = Hospital.objects.update_or_create(
        id='hosp-1',
        defaults={
            'name': 'City Medical Center',
            'slug': 'city-medical-center',
            'city': 'Mumbai',
            'address': '123 Health Ave, Mumbai, MH',
            'phone': '+91 22 1234 5678',
            'email': 'contact@citymedical.org',
            'status': 'Active',
            'plan': 'Enterprise',
            'beds_count': 150,
            'doctors_count': 12,
            'organization': org1,
            'organization_name': org1.name,
        }
    )

    hosp2, _ = Hospital.objects.update_or_create(
        id='hosp-2',
        defaults={
            'name': 'St. Jude Memorial Hospital',
            'slug': 'st-jude-memorial',
            'city': 'Delhi',
            'address': '456 Care Road, New Delhi, DL',
            'phone': '+91 11 9876 5432',
            'email': 'care@stjudememorial.org',
            'status': 'Active',
            'plan': 'Professional',
            'beds_count': 90,
            'doctors_count': 8,
            'organization': org1,
            'organization_name': org1.name,
        }
    )
    print(f"[OK] Seeded 2 Hospitals: {hosp1.name}, {hosp2.name}")

    # 2. Departments
    depts = [
        ('DEP-001', 'Cardiology', 'CARD', 'Heart & Cardiovascular Care'),
        ('DEP-002', 'Neurology', 'NEUR', 'Brain, Spine & Nerve Care'),
        ('DEP-003', 'Pediatrics', 'PEDI', 'Child Health & Care'),
        ('DEP-004', 'Orthopedics', 'ORTH', 'Bone & Joint Specialization'),
        ('DEP-005', 'General Medicine', 'GMED', 'Comprehensive Primary OPD Care'),
    ]
    for did, name, code, desc in depts:
        Department.objects.update_or_create(
            id=did,
            defaults={'hospital': hosp1, 'name': name, 'code': code, 'description': desc}
        )
    print(f"[OK] Seeded {len(depts)} Clinical Departments")

    # 3. OPD Rooms
    rooms = [
        ('ROOM-101', 'Cardiology Chamber 101', 'CH-101', 'DEP-001', 'Cardiology'),
        ('ROOM-102', 'Neurology Chamber 102', 'CH-102', 'DEP-002', 'Neurology'),
        ('ROOM-103', 'Pediatric Clinic 103', 'CH-103', 'DEP-003', 'Pediatrics'),
        ('ROOM-104', 'General OPD Suite 104', 'CH-104', 'DEP-005', 'General Medicine'),
    ]
    for rid, name, code, dep_id, dep_name in rooms:
        OPDRoom.objects.update_or_create(
            id=rid,
            defaults={
                'hospital': hosp1,
                'name': name,
                'code': code,
                'department_id': dep_id,
                'department_name': dep_name,
                'location': '1st Floor',
                'status': 'Available',
            }
        )
    print(f"[OK] Seeded {len(rooms)} OPD Consultation Rooms")

    # 4. Doctors
    doctors = [
        ('DOC-101', 'Dr. Rajesh Sharma', 'Cardiology', 'DEP-001', 'Cardiology', 'Interventional Cardiology', '+91 98765 00101', 'rajesh.sharma@citymedical.org', 'ROOM-101', 'Cardiology Chamber 101', 500.00),
        ('DOC-102', 'Dr. Priya Desai', 'Neurology', 'DEP-002', 'Neurology', 'Neurology & Stroke Unit', '+91 98765 00102', 'priya.desai@citymedical.org', 'ROOM-102', 'Neurology Chamber 102', 600.00),
        ('DOC-103', 'Dr. Ananya Iyer', 'Pediatrics', 'DEP-003', 'Pediatrics', 'Pediatric Specialist', '+91 98765 00103', 'ananya.iyer@citymedical.org', 'ROOM-103', 'Pediatric Clinic 103', 450.00),
        ('DOC-104', 'Dr. Vikram Malhotra', 'Orthopedics', 'DEP-004', 'Orthopedics', 'Joint Replacement', '+91 98765 00104', 'vikram.malhotra@citymedical.org', 'ROOM-104', 'General OPD Suite 104', 550.00),
    ]
    for did, name, dept, dep_id, dep_name, spec, phone, email, room_id, room_name, fee in doctors:
        doc, _ = Doctor.objects.update_or_create(
            id=did,
            defaults={
                'hospital': hosp1,
                'name': name,
                'department': dept,
                'department_id': dep_id,
                'department_name': dep_name,
                'specialization': spec,
                'phone': phone,
                'email': email,
                'opd_room_id': room_id,
                'opd_room_name': room_name,
                'consultation_fee': fee,
                'experience_years': 12,
                'availability_status': 'Available',
                'available_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            }
        )

        # Seed Doctor Schedules
        DoctorSchedule.objects.update_or_create(
            id=f"SCHED-{did}",
            defaults={
                'hospital': hosp1,
                'doctor': doc,
                'department_id': dep_id,
                'department_name': dep_name,
                'opd_room_id': room_id,
                'opd_room_name': room_name,
                'slot_duration_minutes': 15,
                'consultation_start_time': '09:00 AM',
                'consultation_end_time': '01:00 PM',
                'working_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                'is_active': True,
            }
        )
    print(f"[OK] Seeded {len(doctors)} Doctors and Schedules")

    # 5. User Profiles (Credentials)
    users = [
        ('USR-SUPERADMIN-ZENELAIT', 'superadmin@zenelait.com', 'Zenelait Super Admin', 'super_admin', 'platform', None, None, 'admin@123'),
        ('USR-ADMIN-01', 'admin@citymedical.org', 'Hospital Administrator', 'hospital_admin', 'hospital', hosp1, 'City Medical Center', 'Admin@1234'),
        ('USR-DOC-101', 'doctor@citymedical.org', 'Dr. Rajesh Sharma', 'doctor', 'hospital', hosp1, 'City Medical Center', 'Doctor@1234'),
        ('USR-NURSE-01', 'nurse@citymedical.org', 'Sister Sarah Jenkins', 'nurse', 'hospital', hosp1, 'City Medical Center', 'Nurse@1234'),
        ('USR-RECEPT-01', 'receptionist@citymedical.org', 'Front Desk Staff', 'receptionist', 'hospital', hosp1, 'City Medical Center', 'Staff@1234'),
        ('USR-ACCT-01', 'accountant@citymedical.org', 'Billing Accountant', 'accountant', 'hospital', hosp1, 'City Medical Center', 'Account@1234'),
    ]
    for uid, email, name, role, portal, hosp, hosp_name, pwd in users:
        u, _ = UserProfile.objects.update_or_create(
            id=uid,
            defaults={
                'email': email,
                'normalized_email': email.lower().strip(),
                'name': name,
                'role': role,
                'portal': portal,
                'hospital': hosp,
                'hospital_name': hosp_name,
                'status': 'active',
            }
        )
        u.set_password(pwd)
        u.save()
    print(f"[OK] Seeded {len(users)} User Credentials (Superadmin, Hospital Admin, Doctor, Nurse, Receptionist, Accountant)")

    # 6. Patients
    patients = [
        ('PAT-1001', 'Aarav Patel', 38, 'Male', '+91 98765 43210', 'aarav.patel@gmail.com', 'O+', 'Mumbai, MH', {
            'bloodPressure': '120/80 mmHg', 'heartRate': 72, 'temperature': 98.6, 'oxygenLevel': 99
        }),
        ('PAT-1002', 'Jane Smith', 32, 'Female', '+91 98765 43211', 'jane.smith@gmail.com', 'A+', 'Mumbai, MH', {}), # No vitals (for triage test)
        ('PAT-1003', 'Rahul Verma', 45, 'Male', '+91 98765 43212', 'rahul.verma@gmail.com', 'B+', 'Thane, MH', {
            'bloodPressure': '135/88 mmHg', 'heartRate': 78, 'temperature': 98.4, 'oxygenLevel': 98
        }),
        ('PAT-1004', 'Sunita Reddy', 29, 'Female', '+91 98765 43213', 'sunita.reddy@gmail.com', 'AB+', 'Navi Mumbai, MH', {}),
    ]
    for pid, name, age, gender, phone, email, bg, addr, vitals in patients:
        Patient.objects.update_or_create(
            id=pid,
            defaults={
                'hospital': hosp1,
                'name': name,
                'age': age,
                'gender': gender,
                'phone': phone,
                'email': email,
                'blood_group': bg,
                'address': addr,
                'vitals': vitals,
                'status': 'Outpatient',
            }
        )
    print(f"[OK] Seeded {len(patients)} Patients (including triage-ready and triage-pending)")

    # 7. Appointments
    today_str = timezone.now().strftime('%Y-%m-%d')
    doc101 = Doctor.objects.get(id='DOC-101')
    pat1001 = Patient.objects.get(id='PAT-1001')
    pat1002 = Patient.objects.get(id='PAT-1002')

    appts = [
        ('APT-1001', hosp1, pat1001, doc101, today_str, '10:00 AM', 'Consultation', 'Checked In', 500.00, 0, False, 'Routine Cardiology follow-up check'),
        ('APT-1002', hosp1, pat1002, doc101, today_str, '10:30 AM', 'Consultation', 'Checked In', 500.00, 0, False, 'Chest tightness post-workout (Vitals pending)'),
        ('APT-1003', hosp1, pat1001, doc101, today_str, '11:00 AM', 'Consultation', 'Scheduled', 500.00, 0, False, 'ECG & lipid profile review'),
        ('APT-LATE-CANCEL-01', hosp1, pat1001, doc101, today_str, '09:00 AM', 'Consultation', 'Cancelled', 500.00, 250.00, False, 'Patient cancelled slot 1 hour prior to appointment'),
    ]
    for aid, hosp, pat, doc, date, time, atype, status, fee, pen, pen_col, reason in appts:
        Appointment.objects.update_or_create(
            id=aid,
            defaults={
                'hospital': hosp,
                'patient': pat,
                'doctor': doc,
                'date': date,
                'time': time,
                'type': atype,
                'status': status,
                'fee': fee,
                'cancellation_penalty': pen,
                'cancellation_penalty_collected': pen_col,
                'reason': reason,
                'checked_in_at': timezone.now() if status in ('Checked In', 'In Consultation') else None,
            }
        )
    print(f"[OK] Seeded {len(appts)} Appointments (including Checked-In, Triage-Pending, and Late Cancelled with Penalty)")

    # 8. Hospital Settings (Mandatory Vitals Triage & Cancellation Policy)
    hosp_settings_data = {
        'mandatoryVitalsTriage': True,
        'cancellationDeadlineHours': 4,
        'cancellationPenaltyPercent': 50,
        'appointmentBufferMinutes': 5,
        'maxAdvanceBookingDays': 30,
        'requireFullSettlementOnDischarge': True,
        'consultationSlotMinutes': 15,
        'followUpValidityDays': 7,
        'followUpDiscountPercent': 100,
        'hospitalName': 'City Medical Center',
        'emergencyHelpline': '108',
        'receptionPhone': '+91 22 1234 5678',
        'operatingHours': '24/7 Tertiary Emergency & OPD 08:00 AM - 08:00 PM',
    }
    HospitalSetting.objects.update_or_create(
        id='hosp-1-settings',
        defaults={'hospital': hosp1, 'data': hosp_settings_data}
    )
    print("[OK] Seeded Hospital Settings (Mandatory Vitals Triage: True, Cancellation Cutoff: 4 Hours, Penalty: 50%)")

    # 9. Billing Invoices
    BillingInvoice.objects.update_or_create(
        id='INV-2026-001',
        defaults={
            'hospital': hosp1,
            'patient': pat1001,
            'patient_name': pat1001.name,
            'total_amount': 750.00,
            'paid_amount': 750.00,
            'status': 'Paid',
            'due_date': today_str,
            'items': [
                {'description': 'OPD Specialist Consultation - Dr. Rajesh Sharma', 'amount': 500.00},
                {'description': 'Late Appointment Cancellation Fee (Dr. Rajesh Sharma - Today)', 'amount': 250.00},
            ]
        }
    )
    print("[OK] Seeded Billing Invoice with collected Late Cancellation Penalty line item")

    # 10. Appointment Settings
    AppointmentSettings.objects.update_or_create(
        id='SETT-hosp-1',
        defaults={
            'hospital': hosp1,
            'cancellation_deadline_hours': 4,
            'max_advance_booking_days': 30,
            'appointment_buffer_minutes': 5,
            'min_advance_booking_hours': 2,
            'rescheduling_deadline_hours': 4,
            'allow_same_day_booking': True,
        }
    )
    print("[OK] Seeded AppointmentSettings (Cutoff: 4h, Buffer: 5m, Advance Horizon: 30d)")

    # 11. Doctor Unavailable Periods (Leaves & Breaks)
    DoctorUnavailablePeriod.objects.update_or_create(
        id='UNAV-001',
        defaults={
            'hospital': hosp1,
            'doctor': doc101,
            'period_type': 'Leave',
            'title': 'Annual Cardiac Conference',
            'start_date': '2026-11-20',
            'end_date': '2026-11-22',
            'is_all_day': True,
            'reason': 'Attending Interventional Cardiology Summit',
        }
    )
    print("[OK] Seeded Doctor Unavailable Periods & Conference Leaves")

    # 12. Active Subscription Plans
    SubscriptionPlan.objects.update_or_create(
        id='SUB-hosp-1',
        defaults={
            'hospital': hosp1,
            'plan_name': 'Enterprise Tier',
            'monthly_price': 39999.00,
            'status': 'Active',
            'start_date': '2026-01-01',
            'renewal_date': '2026-12-31',
        }
    )
    print("[OK] Seeded Hospital Active Subscription Plan")

    # 13. Hospital Website
    HospitalWebsite.objects.update_or_create(
        id='WEB-hosp-1',
        defaults={
            'hospital': hosp1,
            'hero_title': 'World-Class Healthcare at City Medical Center',
            'hero_subtitle': '24/7 Tertiary Emergency, Advanced Cardiac Care & OPD Excellence',
            'primary_color': '#0d9488',
            'features': ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics'],
            'testimonials': [],
            'is_published': True,
        }
    )
    print("[OK] Seeded Hospital Public Website Configuration")

    # 14. Lab Orders
    LabOrder.objects.update_or_create(
        id='LAB-1001',
        defaults={
            'hospital': hosp1,
            'patient': pat1001,
            'doctor_name': 'Dr. Rajesh Sharma',
            'test_name': 'Complete Lipid Profile & Serum Troponin',
            'category': 'Pathology',
            'status': 'Completed',
            'result': 'Normal Troponin < 0.01 ng/mL. Cholesterol within target limits.',
            'test_date': today_str,
        }
    )
    print("[OK] Seeded Clinical Lab Orders")

    # 15. Sales Leads (CRM)
    SalesLead.objects.update_or_create(
        id='LEAD-101',
        defaults={
            'hospital_name': 'Apollo Apex Clinic',
            'contact_person': 'Dr. Alok Verma',
            'phone': '+91 98765 11223',
            'email': 'alok@apolloapex.org',
            'bed_count': 60,
            'hospital_type': 'Multi-Specialty',
            'lead_source': 'Website Demo Request',
            'interested_plan': 'standard',
            'status': 'Contacted',
        }
    )
    print("[OK] Seeded CRM Sales Leads")

    # 16. Branch Creation Requests
    BranchCreationRequest.objects.update_or_create(
        id='BREQ-101',
        defaults={
            'organization_id': 'ORG-001',
            'organization_name': 'Zenelait Healthcare Network',
            'branch_name': 'Zenelait Suburban Clinic Bandra',
            'branch_code': 'ZHB',
            'city': 'Mumbai',
            'contact_person': 'Dr. Rohan Mehra',
            'contact_phone': '+91 98765 33445',
            'contact_email': 'rohan@zenelait.org',
            'branch_admin_name': 'Dr. Rohan Mehra',
            'branch_admin_email': 'rohan.admin@zenelait.org',
            'status': 'pending',
        }
    )
    print("[OK] Seeded Branch Creation Requests")

    print("\n=======================================================")
    print("FULL MYSQL DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    print("Database: MySQL (crm_hms_db on 127.0.0.1:3306)")
    print("Zero Data Loss: All hospitals, doctors, staff, patients, appointments & policies are stored in MySQL.")
    print("=======================================================\n")

if __name__ == '__main__':
    seed()
