from django.core.management.base import BaseCommand
from api.models import (
    Hospital,
    UserProfile,
    Patient,
    Doctor,
    Appointment,
    Admission,
    BillingInvoice,
    PharmacyMedicine,
    Prescription,
    LabOrder,
    AmbulanceDriver,
    EmergencyRequest,
    SubscriptionPlan,
    HospitalWebsite,
)

class Command(BaseCommand):
    help = 'Seed the database with initial demo data for CRM+HMS SaaS'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding database...'))

        # Create Hospitals
        hospitals_data = [
            {
                'id': 'hosp-1',
                'name': 'Apex City Medical Center',
                'slug': 'apex-medical-center',
                'city': 'New York, NY',
                'address': '742 Evergreen Terrace, New York, NY 10001',
                'phone': '+1 (555) 019-2834',
                'email': 'contact@apexmedical.org',
                'status': 'Active',
                'plan': 'Enterprise Tier',
                'beds_count': 350,
                'doctors_count': 42,
                'image': 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&auto=format&fit=crop&q=80',
            },
            {
                'id': 'hosp-2',
                'name': 'Metro Health Super-Specialty',
                'slug': 'metro-health',
                'city': 'Chicago, IL',
                'address': '500 N Michigan Ave, Chicago, IL 60611',
                'phone': '+1 (555) 982-1144',
                'email': 'info@metrohealth.com',
                'status': 'Active',
                'plan': 'Pro Multi-Dept',
                'beds_count': 220,
                'doctors_count': 28,
                'image': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
            },
            {
                'id': 'hosp-3',
                'name': 'St. Jude Children & General Hospital',
                'slug': 'st-jude-general',
                'city': 'Memphis, TN',
                'address': '262 Danny Thomas Pl, Memphis, TN 38105',
                'phone': '+1 (555) 431-8890',
                'email': 'care@stjude-general.org',
                'status': 'Active',
                'plan': 'Standard Tier',
                'beds_count': 180,
                'doctors_count': 19,
                'image': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
            },
            {
                'id': 'hosp-4',
                'name': 'City Heart & Vascular Institute',
                'slug': 'city-heart-vascular',
                'city': 'Houston, TX',
                'address': '6565 Fannin St, Houston, TX 77030',
                'phone': '+1 (555) 773-4011',
                'email': 'emergency@cityheart.org',
                'status': 'Trial',
                'plan': 'Trial (7 Days)',
                'beds_count': 120,
                'doctors_count': 14,
                'image': 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&auto=format&fit=crop&q=80',
            },
        ]

        hospitals = {}
        for item in hospitals_data:
            obj, _ = Hospital.objects.update_or_create(id=item['id'], defaults=item)
            hospitals[item['id']] = obj

        # Create Users
        users_data = [
            {
                'id': 'usr-superadmin',
                'name': 'Platform Admin',
                'email': 'superadmin@pulse-crm.com',
                'role': 'super_admin',
                'portal': 'platform',
            },
            {
                'id': 'usr-manager',
                'name': 'Platform Manager',
                'email': 'manager@pulse-crm.com',
                'role': 'superadmin_manager',
                'portal': 'platform',
            },
            {
                'id': 'usr-admin-apex',
                'name': 'Sarah Connor (Admin)',
                'email': 'admin@apexmedical.org',
                'role': 'hospital_admin',
                'portal': 'hospital',
                'hospital': hospitals['hosp-1'],
                'hospital_name': hospitals['hosp-1'].name,
            },
            {
                'id': 'usr-doc-apex',
                'name': 'Dr. Marcus Vance',
                'email': 'marcus.vance@apexmedical.org',
                'role': 'doctor',
                'portal': 'hospital',
                'hospital': hospitals['hosp-1'],
                'hospital_name': hospitals['hosp-1'].name,
            },
            {
                'id': 'usr-rec-apex',
                'name': 'Emily Watson (Reception)',
                'email': 'emily@apexmedical.org',
                'role': 'receptionist',
                'portal': 'hospital',
                'hospital': hospitals['hosp-1'],
                'hospital_name': hospitals['hosp-1'].name,
            },
            {
                'id': 'usr-nurse-apex',
                'name': 'Nurse Clara Oswald',
                'email': 'clara@apexmedical.org',
                'role': 'nurse',
                'portal': 'hospital',
                'hospital': hospitals['hosp-1'],
                'hospital_name': hospitals['hosp-1'].name,
            },
            {
                'id': 'usr-acc-apex',
                'name': 'Michael Scott (Accounts)',
                'email': 'michael@apexmedical.org',
                'role': 'accountant',
                'portal': 'hospital',
                'hospital': hospitals['hosp-1'],
                'hospital_name': hospitals['hosp-1'].name,
            },
            {
                'id': 'usr-pharm-apex',
                'name': 'Pharm. David Miller',
                'email': 'david@apexmedical.org',
                'role': 'pharmacist',
                'portal': 'hospital',
                'hospital': hospitals['hosp-1'],
                'hospital_name': hospitals['hosp-1'].name,
            },
            {
                'id': 'usr-lab-apex',
                'name': 'Tech. Rachel Green',
                'email': 'rachel@apexmedical.org',
                'role': 'lab_technician',
                'portal': 'hospital',
                'hospital': hospitals['hosp-1'],
                'hospital_name': hospitals['hosp-1'].name,
            },
            {
                'id': 'usr-drv-apex',
                'name': 'Carlos Mendez (EMT-P)',
                'email': 'carlos.driver@apexmedical.org',
                'role': 'ambulance_driver',
                'portal': 'ambulance_driver',
                'hospital': hospitals['hosp-1'],
                'hospital_name': hospitals['hosp-1'].name,
                'driver_id': 'DRV-201',
            },
            {
                'id': 'usr-pat-apex',
                'name': 'James Harrison Blake',
                'email': 'j.blake91@example.com',
                'role': 'patient',
                'portal': 'patient',
                'hospital': hospitals['hosp-1'],
                'hospital_name': hospitals['hosp-1'].name,
                'patient_id': 'PAT-1002',
            },
        ]

        for item in users_data:
            UserProfile.objects.update_or_create(id=item['id'], defaults=item)

        # Create Patients
        patients_data = [
            {
                'id': 'PAT-1002',
                'hospital': hospitals['hosp-1'],
                'name': 'James Harrison Blake',
                'age': 35,
                'gender': 'Male',
                'phone': '+1 (555) 912-8834',
                'email': 'j.blake91@example.com',
                'blood_group': 'A+',
                'address': '128 Elm Street, Brooklyn, NY',
                'medical_history': ['Chronic Migraine', 'Mild Asthma'],
                'vitals': {
                    'bloodPressure': '118/76 mmHg',
                    'heartRate': 68,
                    'temperature': 98.4,
                    'oxygenLevel': 99,
                    'weightKg': 82.0,
                },
                'status': 'Outpatient',
            },
            {
                'id': 'PAT-1003',
                'hospital': hospitals['hosp-1'],
                'name': 'Sophia Isabella Martinez',
                'age': 6,
                'gender': 'Female',
                'phone': '+1 (555) 441-2099',
                'email': 'martinez.fam@example.com',
                'blood_group': 'B+',
                'address': '89 Willow Creek Lane, Queens, NY',
                'medical_history': ['Seasonal Bronchitis'],
                'vitals': {
                    'bloodPressure': '102/68 mmHg',
                    'heartRate': 92,
                    'temperature': 98.5,
                    'oxygenLevel': 99,
                    'weightKg': 21.0,
                },
                'status': 'Outpatient',
            },
        ]

        patients = {}
        for item in patients_data:
            obj, _ = Patient.objects.update_or_create(id=item['id'], defaults=item)
            patients[item['id']] = obj

        # Create Doctors
        doctors_data = [
            {
                'id': 'DOC-101',
                'hospital': hospitals['hosp-1'],
                'name': 'Dr. Marcus Vance',
                'department': 'Cardiology',
                'specialization': 'Interventional Cardiology',
                'phone': '+1 (555) 234-5678',
                'email': 'marcus.vance@apexmedical.org',
                'consultation_fee': 750.00,
                'availability_status': 'Available',
            },
            {
                'id': 'DOC-102',
                'hospital': hospitals['hosp-1'],
                'name': 'Dr. Helena Rostova',
                'department': 'Neurology',
                'specialization': 'Neuro-Oncology',
                'phone': '+1 (555) 345-6789',
                'email': 'helena.rostova@apexmedical.org',
                'consultation_fee': 900.00,
                'availability_status': 'In Surgery',
            },
        ]

        doctors = {}
        for item in doctors_data:
            obj, _ = Doctor.objects.update_or_create(id=item['id'], defaults=item)
            doctors[item['id']] = obj

        # Create Appointments
        appointments_data = [
            {
                'id': 'APT-901',
                'hospital': hospitals['hosp-1'],
                'patient': patients['PAT-1002'],
                'doctor': doctors['DOC-101'],
                'date': '2026-09-28',
                'time': '10:30 AM',
                'type': 'Cardiac Consultation & ECG Review',
                'status': 'Confirmed',
                'notes': 'Follow up on blood pressure medication adjustments.',
            },
            {
                'id': 'APT-902',
                'hospital': hospitals['hosp-1'],
                'patient': patients['PAT-1002'],
                'doctor': doctors['DOC-102'],
                'date': '2026-09-29',
                'time': '02:00 PM',
                'type': 'Neurological Assessment',
                'status': 'Scheduled',
                'notes': 'MRI scan review.',
            },
        ]

        for item in appointments_data:
            Appointment.objects.update_or_create(id=item['id'], defaults=item)

        # Create Admissions
        admissions_data = [
            {
                'id': 'ADM-301',
                'hospital': hospitals['hosp-1'],
                'patient': patients['PAT-1002'],
                'doctor': doctors['DOC-101'],
                'room_number': 'ICU-402',
                'bed_number': 'Bed B-04',
                'status': 'Admitted',
                'admission_date': '2026-09-24',
                'diagnosis': 'Acute Coronary Syndrome & Unstable Angina',
            },
        ]

        for item in admissions_data:
            Admission.objects.update_or_create(id=item['id'], defaults=item)

        # Create Billing Invoices
        billing_data = [
            {
                'id': 'INV-8001',
                'hospital': hospitals['hosp-1'],
                'patient': patients['PAT-1002'],
                'patient_name': patients['PAT-1002'].name,
                'total_amount': 1450.00,
                'paid_amount': 1000.00,
                'status': 'Partially Paid',
                'due_date': '2026-10-05',
                'items': [
                    {'description': 'Cardiology Consultation', 'amount': 750.00},
                    {'description': 'Echocardiogram (2D Echo)', 'amount': 700.00},
                ],
            },
        ]

        for item in billing_data:
            BillingInvoice.objects.update_or_create(id=item['id'], defaults=item)

        # Create Pharmacy Medicines
        pharmacy_data = [
            {
                'id': 'MED-101',
                'hospital': hospitals['hosp-1'],
                'medicine_name': 'Atorvastatin 20mg',
                'category': 'Cardiovascular',
                'stock_quantity': 450,
                'unit_price': 15.50,
                'expiry_date': '2027-08-15',
                'status': 'In Stock',
            },
            {
                'id': 'MED-102',
                'hospital': hospitals['hosp-1'],
                'medicine_name': 'Amoxicillin 500mg',
                'category': 'Antibiotics',
                'stock_quantity': 18,
                'unit_price': 12.00,
                'expiry_date': '2026-12-01',
                'status': 'Low Stock',
            },
        ]

        for item in pharmacy_data:
            PharmacyMedicine.objects.update_or_create(id=item['id'], defaults=item)

        # Create Prescriptions
        prescriptions_data = [
            {
                'id': 'RX-501',
                'hospital': hospitals['hosp-1'],
                'patient': patients['PAT-1001'],
                'doctor_name': doctors['DOC-101'].name,
                'date': '2026-09-20',
                'status': 'Active',
                'medicines': [
                    {'name': 'Atorvastatin 20mg', 'dosage': '1 tablet once daily at bedtime', 'duration': '30 days'},
                    {'name': 'Lisinopril 10mg', 'dosage': '1 tablet in the morning', 'duration': '30 days'},
                ],
                'notes': 'Monitor blood pressure weekly.',
            },
        ]

        for item in prescriptions_data:
            Prescription.objects.update_or_create(id=item['id'], defaults=item)

        # Create Lab Orders
        lab_data = [
            {
                'id': 'LAB-401',
                'hospital': hospitals['hosp-1'],
                'patient': patients['PAT-1001'],
                'doctor_name': doctors['DOC-101'].name,
                'test_name': 'Comprehensive Metabolic Panel & Lipid Profile',
                'category': 'Biochemistry',
                'status': 'Completed',
                'result': 'Total Cholesterol: 185 mg/dL, HDL: 52 mg/dL, LDL: 104 mg/dL. All parameters within target range.',
                'report_url': 'https://example.com/reports/lab-401.pdf',
                'test_date': '2026-09-22',
            },
        ]

        for item in lab_data:
            LabOrder.objects.update_or_create(id=item['id'], defaults=item)

        # Create Ambulance Driver
        drivers_data = [
            {
                'id': 'DRV-201',
                'hospital': hospitals['hosp-1'],
                'name': 'Carlos Mendez',
                'phone': '+1 (555) 911-0021',
                'license_number': 'CDL-EMERG-884219',
                'assigned_ambulance_reg': 'NY-EMRG-889',
                'availability_status': 'On Duty & Available',
                'completed_trips': 142,
            },
        ]

        drivers = {}
        for item in drivers_data:
            obj, _ = AmbulanceDriver.objects.update_or_create(id=item['id'], defaults=item)
            drivers[item['id']] = obj

        # Create Emergency Request
        emergency_data = [
            {
                'id': 'EMR-7001',
                'hospital': hospitals['hosp-1'],
                'patient_name': 'Eleanor Vance-Montgomery',
                'patient_phone': '+1 (555) 301-4492',
                'pickup_location': '450 Park Avenue, Apt 12B, New York, NY',
                'destination_hospital': 'Apex City Medical Center — Trauma Bay',
                'emergency_type': 'Cardiac Arrest / Chest Pain',
                'priority': 'CRITICAL / CODE BLUE',
                'status': 'Dispatched',
                'assigned_driver': drivers['DRV-201'],
                'chief_complaint': 'Acute crushing sub-sternal chest discomfort with diaphoresis and radiating jaw pain.',
            },
        ]

        for item in emergency_data:
            EmergencyRequest.objects.update_or_create(id=item['id'], defaults=item)

        # Create Subscription Plan
        subscriptions_data = [
            {
                'id': 'SUB-101',
                'hospital': hospitals['hosp-1'],
                'plan_name': 'Enterprise Tier SaaS',
                'monthly_price': 1499.00,
                'status': 'Active',
                'start_date': '2026-01-01',
                'renewal_date': '2027-01-01',
            },
        ]

        for item in subscriptions_data:
            SubscriptionPlan.objects.update_or_create(id=item['id'], defaults=item)

        # Create Hospital Website
        website_data = [
            {
                'id': 'web-1',
                'hospital': hospitals['hosp-1'],
                'hero_title': 'World-Class Healthcare & Cardiac Excellence',
                'hero_subtitle': 'Apex City Medical Center provides 24/7 emergency care, specialized surgical units, and compassionate patient-centered healing.',
                'primary_color': '#0d9488',
                'features': [
                    {'title': '24/7 Emergency & ICU', 'desc': 'Rapid response 911 telemetry unit and level 1 trauma facility.'},
                    {'title': 'Cardiology & Surgery', 'desc': 'Board-certified specialists utilizing robotic surgical equipment.'},
                    {'title': 'Digital Health Vault', 'desc': 'Instant online portal access to medical records, Rx, and lab reports.'},
                ],
                'testimonials': [
                    {'author': 'Marcus Brody', 'role': 'Patient', 'quote': 'The cardiac care team saved my life. Truly world-class medical attention.'}
                ],
                'is_published': True,
            },
        ]

        for item in website_data:
            HospitalWebsite.objects.update_or_create(id=item['id'], defaults=item)

        self.stdout.write(self.style.SUCCESS('Database successfully seeded with demo data!'))
