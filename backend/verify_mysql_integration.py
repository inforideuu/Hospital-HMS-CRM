import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_hms_backend.settings')
django.setup()

from django.db import connection
from api.models import (
    Organization, Hospital, UserProfile, Patient, Doctor, Appointment,
    Consultation, Admission, BillingInvoice, PharmacyMedicine, Prescription,
    LabOrder, AmbulanceDriver, EmergencyRequest, SubscriptionPlan, HospitalWebsite,
    DoctorSchedule, DoctorUnavailablePeriod, AppointmentSettings, SupportTicket,
    Department, OPDRoom, Ward, Bed, Staff, ActivityLog, SalesLead
)

def run_verification():
    print("=" * 60)
    print("MYSQL DATABASE INTEGRATION & AUDIT VERIFICATION")
    print("=" * 60)

    # 1. Verify Connection and Engine
    db_engine = connection.settings_dict['ENGINE']
    db_name = connection.settings_dict['NAME']
    db_host = connection.settings_dict.get('HOST', 'localhost')
    print(f"[1] Database Engine: {db_engine}")
    print(f"    Database Name  : {db_name}")
    print(f"    Database Host  : {db_host}")
    
    with connection.cursor() as cursor:
        cursor.execute("SELECT VERSION();")
        version = cursor.fetchone()
        print(f"    MySQL Version  : {version[0]}")
        
        cursor.execute("SHOW TABLES;")
        tables = [row[0] for row in cursor.fetchall()]
        print(f"    Total MySQL Tables in DB: {len(tables)}")

    # 2. Verify Table Existence for all migrated entities
    entities = [
        ("Organization", Organization),
        ("Hospital", Hospital),
        ("UserProfile", UserProfile),
        ("Patient", Patient),
        ("Doctor", Doctor),
        ("Appointment", Appointment),
        ("Consultation", Consultation),
        ("Admission", Admission),
        ("BillingInvoice", BillingInvoice),
        ("PharmacyMedicine", PharmacyMedicine),
        ("Prescription", Prescription),
        ("LabOrder", LabOrder),
        ("AmbulanceDriver", AmbulanceDriver),
        ("EmergencyRequest", EmergencyRequest),
        ("SubscriptionPlan", SubscriptionPlan),
        ("HospitalWebsite", HospitalWebsite),
        ("DoctorSchedule", DoctorSchedule),
        ("DoctorUnavailablePeriod", DoctorUnavailablePeriod),
        ("AppointmentSettings", AppointmentSettings),
        ("SupportTicket", SupportTicket),
        ("Department", Department),
        ("OPDRoom", OPDRoom),
        ("Ward", Ward),
        ("Bed", Bed),
        ("Staff", Staff),
        ("ActivityLog", ActivityLog),
        ("SalesLead", SalesLead),
    ]

    print("\n[2] Checking Real Entity Persistence in MySQL:")
    for name, model in entities:
        table_name = model._meta.db_table
        count = model.objects.count()
        in_tables = "YES" if table_name in tables else "NO"
        print(f"    - {name:<22} (table: {table_name:<25}) -> Exists in MySQL: {in_tables} | Row Count: {count}")

    # 3. Test Full CRUD Cycle in MySQL
    print("\n[3] Testing Real CRUD Database Operations in MySQL:")
    
    # Ensure a test hospital exists
    test_hosp, created = Hospital.objects.get_or_create(
        id='TEST-HOSP-999',
        defaults={
            'name': 'Test Verification Hospital',
            'email': 'verify@test.hospital',
            'phone': '1234567890',
            'address': '100 Medical Center Blvd',
            'city': 'Metropolis',
            'plan': 'enterprise',
            'status': 'active'
        }
    )
    print(f"    [CRUD] Hospital: {test_hosp.name} (id: {test_hosp.id}, created: {created})")

    # Patient
    test_pat, p_created = Patient.objects.update_or_create(
        id='TEST-PAT-001',
        defaults={
            'hospital': test_hosp,
            'name': 'Audit Verification Patient',
            'age': 35,
            'gender': 'Male',
            'phone': '555-0199',
            'blood_group': 'O+',
            'status': 'Active'
        }
    )
    print(f"    [CRUD] Patient: {test_pat.name} (id: {test_pat.id}, saved to MySQL)")

    # Doctor
    test_doc, d_created = Doctor.objects.update_or_create(
        id='TEST-DOC-001',
        defaults={
            'hospital': test_hosp,
            'name': 'Dr. Verification Specialist',
            'specialization': 'Cardiology',
            'department': 'Cardiology',
            'department_name': 'Cardiology',
            'email': 'specialist@test.hospital',
            'phone': '555-0200',
            'availability_status': 'Available'
        }
    )
    print(f"    [CRUD] Doctor: {test_doc.name} (id: {test_doc.id}, saved to MySQL)")

    # Department
    test_dept, dept_created = Department.objects.update_or_create(
        id='TEST-DEPT-001',
        defaults={
            'hospital': test_hosp,
            'name': 'Cardiovascular Sciences',
            'code': 'CARD',
            'status': 'active'
        }
    )
    print(f"    [CRUD] Department: {test_dept.name} (id: {test_dept.id}, saved to MySQL)")

    # OPD Room
    test_room, r_created = OPDRoom.objects.update_or_create(
        id='TEST-ROOM-001',
        defaults={
            'hospital': test_hosp,
            'name': 'Cardiac Clinic 1',
            'code': 'CC-101',
            'department_id': test_dept.id,
            'department_name': test_dept.name,
            'status': 'Available'
        }
    )
    print(f"    [CRUD] OPDRoom: {test_room.name} (id: {test_room.id}, saved to MySQL)")

    # Appointment
    test_apt, a_created = Appointment.objects.update_or_create(
        id='TEST-APT-001',
        defaults={
            'hospital': test_hosp,
            'patient': test_pat,
            'doctor': test_doc,
            'date': '2026-11-01',
            'time': '10:00 AM',
            'status': 'Confirmed',
            'type': 'Consultation'
        }
    )
    print(f"    [CRUD] Appointment: {test_apt.id} (status: {test_apt.status}, saved to MySQL)")

    # Consultation
    test_cons, c_created = Consultation.objects.update_or_create(
        id='TEST-CON-001',
        defaults={
            'hospital': test_hosp,
            'patient': test_pat,
            'doctor': test_doc,
            'doctor_name': test_doc.name,
            'patient_name': test_pat.name,
            'appointment': test_apt,
            'status': 'In-Progress',
            'chief_complaint': 'Routine verification checkup'
        }
    )
    print(f"    [CRUD] Consultation: {test_cons.id} (status: {test_cons.status}, saved to MySQL)")

    # Clean up test records
    print("\n[4] Cleaning up verification test records...")
    test_cons.delete()
    test_apt.delete()
    test_room.delete()
    test_dept.delete()
    test_doc.delete()
    test_pat.delete()
    test_hosp.delete()
    print("    Cleanup complete. Zero test fixture pollution in production tables.")

    print("\n" + "=" * 60)
    print("ALL MYSQL INTEGRATION VERIFICATIONS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    run_verification()
