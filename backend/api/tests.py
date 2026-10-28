from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import (
    Hospital,
    UserProfile,
    Doctor,
    Patient,
    Appointment,
    DoctorSchedule,
    DoctorUnavailablePeriod,
    AppointmentSettings,
    Consultation,
    Prescription,
    SupportTicket,
)

class OPDAppointmentBookingValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hospital = Hospital.objects.create(
            id='HOSP-TEST-01',
            name='Test Hospital',
            slug='test-hospital',
            city='Chennai',
            address='123 Test St',
            phone='1234567890',
            email='hospital@test.com',
        )
        self.doctor1 = Doctor.objects.create(
            id='DOC-TEST-01',
            hospital=self.hospital,
            name='Dr. Test One',
            department='General Medicine',
            specialization='Internist',
            phone='1234567890',
            email='doc1@test.com',
        )
        self.doctor2 = Doctor.objects.create(
            id='DOC-TEST-02',
            hospital=self.hospital,
            name='Dr. Test Two',
            department='Cardiology',
            specialization='Cardiologist',
            phone='1234567891',
            email='doc2@test.com',
        )
        self.patient1 = Patient.objects.create(
            id='PAT-TEST-01',
            hospital=self.hospital,
            name='Test Patient One',
            age=30,
            gender='Female',
            phone='9876543210',
            blood_group='O+',
            address='456 Patient Rd',
        )
        self.patient2 = Patient.objects.create(
            id='PAT-TEST-02',
            hospital=self.hospital,
            name='Test Patient Two',
            age=40,
            gender='Male',
            phone='9876543211',
            blood_group='A+',
            address='789 Patient Ave',
        )

    def test_overlapping_doctor_booking_rejected(self):
        # 1. Book first appointment (future date)
        res1 = self.client.post('/api/appointments/', {
            'id': 'APT-T1',
            'hospital': self.hospital.id,
            'patient': self.patient1.id,
            'doctor': self.doctor1.id,
            'date': '2026-10-22',
            'time': '10:00 AM',
            'status': 'Confirmed',
            'type': 'Consultation',
            'opd_room_id': 'ROOM-01',
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # 2. Attempt overlapping booking for the same doctor at the same slot
        res2 = self.client.post('/api/appointments/', {
            'id': 'APT-T2',
            'hospital': self.hospital.id,
            'patient': self.patient2.id,
            'doctor': self.doctor1.id,
            'date': '2026-10-22',
            'time': '10:00 AM',
            'status': 'Scheduled',
            'type': 'Consultation',
            'opd_room_id': 'ROOM-02',
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Doctor already has an active consultation', res2.data.get('error', ''))

    def test_overlapping_opd_room_booking_rejected(self):
        # 1. Book doctor 1 in Room 01
        res1 = self.client.post('/api/appointments/', {
            'id': 'APT-ROOM-1',
            'hospital': self.hospital.id,
            'patient': self.patient1.id,
            'doctor': self.doctor1.id,
            'date': '2026-10-21',
            'time': '11:00 AM',
            'status': 'Confirmed',
            'type': 'Consultation',
            'opd_room_id': 'ROOM-01',
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # 2. Attempt booking doctor 2 in the same Room 01 at the same time
        res2 = self.client.post('/api/appointments/', {
            'id': 'APT-ROOM-2',
            'hospital': self.hospital.id,
            'patient': self.patient2.id,
            'doctor': self.doctor2.id,
            'date': '2026-10-21',
            'time': '11:00 AM',
            'status': 'Scheduled',
            'type': 'Consultation',
            'opd_room_id': 'ROOM-01',
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Selected OPD Chamber is already occupied', res2.data.get('error', ''))

    def test_doctor_leave_booking_rejected(self):
        # 1. Block doctor leave
        DoctorUnavailablePeriod.objects.create(
            id='UNAV-T1',
            hospital=self.hospital,
            doctor=self.doctor1,
            period_type='Leave',
            title='Annual Leave',
            start_date='2026-10-25',
            end_date='2026-10-26',
            is_all_day=True,
            reason='Family Vacation',
        )

        # 2. Attempt to book doctor during leave
        res = self.client.post('/api/appointments/', {
            'id': 'APT-LEAVE-1',
            'hospital': self.hospital.id,
            'patient': self.patient1.id,
            'doctor': self.doctor1.id,
            'date': '2026-10-25',
            'time': '02:00 PM',
            'status': 'Scheduled',
            'type': 'Consultation',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Doctor is on leave', res.data.get('error', ''))

    def test_appointment_lifecycle_transitions(self):
        # 1. Create appointment
        res = self.client.post('/api/appointments/', {
            'id': 'APT-LIFE-1',
            'hospital': self.hospital.id,
            'patient': self.patient1.id,
            'doctor': self.doctor1.id,
            'date': '2026-10-22',
            'time': '03:00 PM',
            'status': 'Scheduled',
            'type': 'Consultation',
            'opd_room_id': 'ROOM-01',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # 2. Confirm appointment
        res_conf = self.client.patch('/api/appointments/APT-LIFE-1/', {'status': 'Confirmed'}, format='json')
        self.assertEqual(res_conf.status_code, status.HTTP_200_OK)
        self.assertEqual(res_conf.data['status'], 'Confirmed')

        # 3. Check in
        res_checkin = self.client.patch('/api/appointments/APT-LIFE-1/', {'status': 'Checked In'}, format='json')
        self.assertEqual(res_checkin.status_code, status.HTTP_200_OK)
        self.assertEqual(res_checkin.data['status'], 'Checked In')

        # 4. Mark Completed
        res_comp = self.client.patch('/api/appointments/APT-LIFE-1/', {'status': 'Completed'}, format='json')
        self.assertEqual(res_comp.status_code, status.HTTP_200_OK)
        self.assertEqual(res_comp.data['status'], 'Completed')

    def test_past_date_appointment_booking_rejected(self):
        res = self.client.post('/api/appointments/', {
            'id': 'APT-PAST-1',
            'hospital': self.hospital.id,
            'patient': self.patient1.id,
            'doctor': self.doctor1.id,
            'date': '2020-01-01',
            'time': '10:00 AM',
            'status': 'Scheduled',
            'type': 'Consultation',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Cannot schedule appointments in the past', res.data.get('error', ''))

    def test_passed_slot_appointment_booking_rejected(self):
        from django.utils import timezone as dj_timezone
        today_str = dj_timezone.now().strftime('%Y-%m-%d')
        res = self.client.post('/api/appointments/', {
            'id': 'APT-PASSED-SLOT-1',
            'hospital': self.hospital.id,
            'patient': self.patient1.id,
            'doctor': self.doctor1.id,
            'date': today_str,
            'time': '00:01 AM',
            'status': 'Scheduled',
            'type': 'Consultation',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already passed', res.data.get('error', ''))


class HospitalAuthenticationAndTenantIsolationTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # 1. Setup ABC Hospital
        self.hosp_abc = Hospital.objects.create(
            id='HOSP-ABC',
            name='ABC Hospital',
            slug='abc-hospital',
            city='Chennai',
            address='100 ABC Road',
            phone='+91 98401 00000',
            email='info@abchospital.org',
        )

        # 2. Setup EFG Hospital
        self.hosp_efg = Hospital.objects.create(
            id='HOSP-EFG',
            name='EFG Hospital',
            slug='efg-hospital',
            city='Bangalore',
            address='200 EFG Boulevard',
            phone='+91 98402 00000',
            email='info@efghospital.org',
        )

        # 3. Setup Platform Super Admin
        self.super_admin = UserProfile.objects.create(
            id='USR-PLAT-SUPER',
            name='Super Admin User',
            email='superadmin@platform.io',
            role='super_admin',
            portal='platform',
            hospital=None,
        )
        self.super_admin.set_password('SuperSecret@2026')
        self.super_admin.save()

    def test_scenario_1_and_2_option_a_patient_accounts_hospital_scoped(self):
        # Scenario 1: Create ABC Hospital's Arun using arun@gmail.com and password arun123
        res1 = self.client.post('/api/users/', {
            'id': 'USR-ABC-ARUN-1',
            'name': 'Arun ABC',
            'email': 'arun@gmail.com',
            'password': 'arun123',
            'role': 'patient',
            'portal': 'patient',
            'hospital': self.hosp_abc.id,
            'hospital_name': self.hosp_abc.name,
        }, format='json')
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Scenario 2: Option A: EFG Hospital Arun using the exact same email -> Allowed (hospital-scoped)
        res2 = self.client.post('/api/users/', {
            'id': 'USR-EFG-ARUN-1',
            'name': 'Arun EFG',
            'email': 'arun@gmail.com',
            'password': 'arun123',
            'role': 'patient',
            'portal': 'patient',
            'hospital': self.hosp_efg.id,
            'hospital_name': self.hosp_efg.name,
        }, format='json')
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)

        # Non-patient staff account with duplicate email -> strictly REJECTED
        self.client.post('/api/users/', {
            'id': 'USR-STAFF-1',
            'name': 'Staff Admin ABC',
            'email': 'admin.staff@hospital.com',
            'password': 'password123',
            'role': 'hospital_admin',
            'portal': 'hospital',
            'hospital': self.hosp_abc.id,
        }, format='json')
        res_staff_dup = self.client.post('/api/users/', {
            'id': 'USR-STAFF-2',
            'name': 'Staff Admin EFG',
            'email': 'admin.staff@hospital.com',
            'password': 'password123',
            'role': 'hospital_admin',
            'portal': 'hospital',
            'hospital': self.hosp_efg.id,
        }, format='json')
        self.assertEqual(res_staff_dup.status_code, status.HTTP_400_BAD_REQUEST)

    def test_scenario_3_duplicate_rejected_within_abc_hospital(self):
        # Create initial account in ABC Hospital
        self.client.post('/api/users/', {
            'id': 'USR-ABC-ARUN-1',
            'name': 'Arun ABC',
            'email': 'arun@gmail.com',
            'password': 'arun123',
            'role': 'patient',
            'portal': 'patient',
            'hospital': self.hosp_abc.id,
        }, format='json')

        # Scenario 3: Create another account with arun@gmail.com in ABC Hospital -> Rejected
        res = self.client.post('/api/users/', {
            'id': 'USR-ABC-ARUN-2',
            'name': 'Arun Duplicate',
            'email': 'arun@gmail.com',
            'password': 'different_password',
            'role': 'patient',
            'portal': 'patient',
            'hospital': self.hosp_abc.id,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already exists', str(res.data))

    def test_scenario_4_duplicate_rejected_within_efg_hospital(self):
        # Create initial account in EFG Hospital
        self.client.post('/api/users/', {
            'id': 'USR-EFG-ARUN-1',
            'name': 'Arun EFG',
            'email': 'arun.efg@gmail.com',
            'password': 'arun123',
            'role': 'patient',
            'portal': 'patient',
            'hospital': self.hosp_efg.id,
        }, format='json')

        # Scenario 4: Create another account with arun.efg@gmail.com in EFG Hospital -> Rejected
        res = self.client.post('/api/users/', {
            'id': 'USR-EFG-ARUN-2',
            'name': 'Arun Duplicate',
            'email': 'arun.efg@gmail.com',
            'password': 'different_password',
            'role': 'patient',
            'portal': 'patient',
            'hospital': self.hosp_efg.id,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already exists', str(res.data))

    def test_scenario_5_and_6_login_authenticates_correct_hospital_account(self):
        # Setup accounts with distinct emails (globally unique)
        u_abc = UserProfile.objects.create(
            id='USR-ABC-ARUN',
            name='Arun ABC',
            email='arun.abc@gmail.com',
            role='patient',
            portal='patient',
            hospital=self.hosp_abc,
            hospital_name=self.hosp_abc.name,
        )
        u_abc.set_password('arun123')
        u_abc.save()

        u_efg = UserProfile.objects.create(
            id='USR-EFG-ARUN',
            name='Arun EFG',
            email='arun.efg@gmail.com',
            role='patient',
            portal='patient',
            hospital=self.hosp_efg,
            hospital_name=self.hosp_efg.name,
        )
        u_efg.set_password('arun123')
        u_efg.save()

        # Scenario 5: Log in through ABC Hospital
        res_abc = self.client.post('/api/auth/login/', {
            'hospital_id': self.hosp_abc.id,
            'email': 'arun.abc@gmail.com',
            'password': 'arun123',
        }, format='json')
        self.assertEqual(res_abc.status_code, status.HTTP_200_OK)
        self.assertTrue(res_abc.data.get('success'))
        self.assertEqual(res_abc.data['user']['id'], 'USR-ABC-ARUN')
        self.assertEqual(res_abc.data['user']['hospital'], self.hosp_abc.id)
        self.assertEqual(res_abc.data['hospital']['id'], 'HOSP-ABC')

        # Scenario 6: Log in through EFG Hospital
        res_efg = self.client.post('/api/auth/login/', {
            'hospital_id': self.hosp_efg.id,
            'email': 'arun.efg@gmail.com',
            'password': 'arun123',
        }, format='json')
        self.assertEqual(res_efg.status_code, status.HTTP_200_OK)
        self.assertTrue(res_efg.data.get('success'))
        self.assertEqual(res_efg.data['user']['id'], 'USR-EFG-ARUN')
        self.assertEqual(res_efg.data['user']['hospital'], self.hosp_efg.id)
        self.assertEqual(res_efg.data['hospital']['id'], 'HOSP-EFG')

    def test_scenario_7_and_8_and_9_cross_hospital_access_denied(self):
        # Setup patient records in each hospital
        pat_abc = Patient.objects.create(
            id='PAT-ABC-DATA-1',
            hospital=self.hosp_abc,
            name='ABC Patient Record',
            age=35,
            gender='Male',
            phone='1234567890',
            blood_group='B+',
            address='ABC Road',
        )
        pat_efg = Patient.objects.create(
            id='PAT-EFG-DATA-1',
            hospital=self.hosp_efg,
            name='EFG Patient Record',
            age=28,
            gender='Female',
            phone='9876543210',
            blood_group='A+',
            address='EFG Street',
        )

        # Scenario 7: ABC Hospital's token accessing EFG Hospital patient record -> Denied (403)
        res7 = self.client.get(f'/api/patients/{pat_efg.id}/', HTTP_AUTHORIZATION='Token token-USR-ABC-HOSP-ABC')
        self.assertEqual(res7.status_code, status.HTTP_403_FORBIDDEN)

        # Scenario 8: EFG Hospital's token accessing ABC Hospital patient record -> Denied (403)
        res8 = self.client.get(f'/api/patients/{pat_abc.id}/', HTTP_AUTHORIZATION='Token token-USR-EFG-HOSP-EFG')
        self.assertEqual(res8.status_code, status.HTTP_403_FORBIDDEN)

        # Scenario 9: Changing hospital_id query parameter to another hospital after login -> Denied (403)
        res9 = self.client.get('/api/patients/?hospital_id=HOSP-EFG', HTTP_AUTHORIZATION='Token token-USR-ABC-HOSP-ABC')
        self.assertEqual(res9.status_code, status.HTTP_403_FORBIDDEN)

    def test_scenario_10_wrong_password_rejected(self):
        u_abc = UserProfile.objects.create(
            id='USR-ABC-ARUN',
            name='Arun ABC',
            email='arun@gmail.com',
            role='patient',
            portal='patient',
            hospital=self.hosp_abc,
        )
        u_abc.set_password('arun123')
        u_abc.save()

        # Scenario 10: Correct email with wrong password -> Rejected
        res = self.client.post('/api/auth/login/', {
            'hospital_id': self.hosp_abc.id,
            'email': 'arun@gmail.com',
            'password': 'WRONG_PASSWORD',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(res.data.get('success'))

    def test_scenario_11_case_insensitivity_and_whitespace_trimming(self):
        u_abc = UserProfile.objects.create(
            id='USR-ABC-ARUN',
            name='Arun ABC',
            email='arun@gmail.com',
            role='patient',
            portal='patient',
            hospital=self.hosp_abc,
        )
        u_abc.set_password('arun123')
        u_abc.save()

        # Scenario 11: Duplicate detection with uppercase and spaces -> Rejected
        res = self.client.post('/api/users/', {
            'id': 'USR-ABC-ARUN-DUPLICATE',
            'name': 'Arun Duplicate',
            'email': '  ARUN@GMAIL.COM  ',
            'password': 'arun123',
            'role': 'patient',
            'portal': 'patient',
            'hospital': self.hosp_abc.id,
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('already exists', str(res.data))

        # Login with uppercase and surrounding spaces -> Successfully logs in
        login_res = self.client.post('/api/auth/login/', {
            'hospital_id': self.hosp_abc.id,
            'email': '  ArUn@GMAIL.COM ',
            'password': 'arun123',
        }, format='json')
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertEqual(login_res.data['user']['id'], 'USR-ABC-ARUN')

    def test_scenario_12_platform_super_admin_login(self):
        # Scenario 12: Super admin platform login
        res = self.client.post('/api/auth/login/', {
            'email': 'superadmin@platform.io',
            'password': 'SuperSecret@2026',
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data.get('success'))
        self.assertEqual(res.data['user']['role'], 'super_admin')
        self.assertIsNone(res.data['user']['hospital'])

    def test_doctor_cascade_deletion_and_email_reuse(self):
        # 1. Create a doctor and corresponding user login account
        doc_email = 'dr.reusable@example.com'
        doc_res = self.client.post('/api/doctors/', {
            'id': 'DOC-REUSE-1',
            'hospital': self.hosp_abc.id,
            'name': 'Dr. Reusable',
            'department': 'Cardiology',
            'specialization': 'Cardiologist',
            'phone': '1234567890',
            'email': doc_email,
            'consultation_fee': 600,
        }, format='json')
        self.assertEqual(doc_res.status_code, status.HTTP_201_CREATED)

        user_res = self.client.post('/api/users/', {
            'id': 'USR-DOC-REUSE-1',
            'name': 'Dr. Reusable',
            'email': doc_email,
            'password': 'Doctor@123',
            'role': 'doctor',
            'portal': 'hospital',
            'hospital': self.hosp_abc.id,
        }, format='json')
        self.assertEqual(user_res.status_code, status.HTTP_201_CREATED)

        # 2. Delete the doctor via API
        del_res = self.client.delete('/api/doctors/DOC-REUSE-1/')
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

        # 3. Assert UserProfile was cascade deleted as well
        self.assertFalse(UserProfile.objects.filter(email=doc_email).exists())
        self.assertFalse(Doctor.objects.filter(email=doc_email).exists())

        # 4. Assert that creating a new doctor with the same email now succeeds without duplicate error
        doc_res2 = self.client.post('/api/doctors/', {
            'id': 'DOC-REUSE-2',
            'hospital': self.hosp_abc.id,
            'name': 'Dr. Reusable 2',
            'department': 'Cardiology',
            'specialization': 'Cardiologist',
            'phone': '1234567890',
            'email': doc_email,
            'consultation_fee': 700,
        }, format='json')
        self.assertEqual(doc_res2.status_code, status.HTTP_201_CREATED)


class DoctorConsultationWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hospital = Hospital.objects.create(
            id='HOSP-WF-01',
            name='Workflow Hospital',
            slug='workflow-hospital',
            city='Chennai',
            address='123 Doctor Way',
            phone='9876500000',
            email='workflow@hospital.com',
        )
        self.other_hospital = Hospital.objects.create(
            id='HOSP-WF-02',
            name='Other Facility',
            slug='other-facility',
            city='Bangalore',
            address='456 Other Way',
            phone='9876500001',
            email='other@hospital.com',
        )
        self.doctor = Doctor.objects.create(
            id='DOC-WF-01',
            hospital=self.hospital,
            name='Dr. Stephen Strange',
            department='Neurology',
            specialization='Neurosurgeon',
            phone='9876543210',
            email='strange@hospital.com',
            consultation_fee=150.00,
        )
        self.other_doctor = Doctor.objects.create(
            id='DOC-WF-02',
            hospital=self.other_hospital,
            name='Dr. Other Hospital',
            department='General',
            specialization='General Practitioner',
            phone='9876543212',
            email='otherdoc@hospital.com',
            consultation_fee=100.00,
        )
        self.patient = Patient.objects.create(
            id='PAT-WF-01',
            hospital=self.hospital,
            name='Peter Parker',
            age=25,
            gender='Male',
            phone='9876512345',
            email='peter@parker.com',
            blood_group='O+',
            address='20 Ingram St, Queens',
            medical_history=['Mild Asthma'],
            vitals={'bloodPressure': '120/80', 'heartRate': 72},
        )
        self.appointment = Appointment.objects.create(
            id='APT-WF-101',
            hospital=self.hospital,
            patient=self.patient,
            doctor=self.doctor,
            date='2026-10-25',
            time='10:00 AM',
            status='Confirmed',
            type='Consultation',
            reason='Acute Migraine',
        )

    def test_receptionist_checkin_and_doctor_consultation_flow(self):
        # 1. Receptionist checks in patient
        res_checkin = self.client.post(f'/api/appointments/{self.appointment.id}/check_in/')
        self.assertEqual(res_checkin.status_code, status.HTTP_200_OK)
        self.assertEqual(res_checkin.data['status'], 'Checked In')
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'Checked In')
        self.assertIsNotNone(self.appointment.checked_in_at)

        # 2. Doctor starts consultation
        res_start = self.client.post(
            f'/api/appointments/{self.appointment.id}/start_consultation/',
            {'doctor_id': self.doctor.id},
            format='json'
        )
        self.assertEqual(res_start.status_code, status.HTTP_200_OK)
        self.assertEqual(res_start.data['appointment']['status'], 'In Consultation')
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'In Consultation')
        self.assertIsNotNone(self.appointment.consultation_started_at)

        consult_data = res_start.data['consultation']
        self.assertEqual(consult_data['status'], 'Draft')
        self.assertEqual(consult_data['patient'], self.patient.id)
        self.assertEqual(consult_data['doctor'], self.doctor.id)
        consult_id = consult_data['id']

        # 3. Doctor saves consultation draft
        draft_payload = {
            'symptoms': 'Throbbing headache, light sensitivity for 3 days',
            'examination': 'Pupils equal and reactive, neck supple',
            'vitals': {'bloodPressure': '125/82', 'heartRate': 76, 'temperature': 98.4},
            'diagnosis': 'Severe Migraine with Aura',
            'treatment_plan': 'Rest in dark room, hydration, oral sumatriptan',
            'prescription_items': [
                {'medicineName': 'Sumatriptan 50mg', 'dosage': '1 tablet', 'frequency': 'As needed', 'duration': '5 days', 'instructions': 'Take at onset of migraine'}
            ],
            'follow_up_instructions': 'Follow up in 2 weeks if symptoms persist',
            'notes': 'Patient tolerating oral fluids well',
        }
        res_draft = self.client.post(f'/api/consultations/{consult_id}/save_draft/', draft_payload, format='json')
        self.assertEqual(res_draft.status_code, status.HTTP_200_OK)
        self.assertEqual(res_draft.data['status'], 'Draft')
        self.assertEqual(res_draft.data['diagnosis'], 'Severe Migraine with Aura')

        # 4. Doctor finalizes consultation
        res_finalize = self.client.post(f'/api/consultations/{consult_id}/finalize/', draft_payload, format='json')
        self.assertEqual(res_finalize.status_code, status.HTTP_200_OK)
        self.assertEqual(res_finalize.data['status'], 'Finalized')
        self.assertIsNotNone(res_finalize.data['finalized_at'])

        # 5. Verify Appointment marked Completed
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, 'Completed')
        self.assertIsNotNone(self.appointment.consultation_completed_at)

        # 6. Verify Patient EHR updated with diagnosis and vitals
        self.patient.refresh_from_db()
        self.assertIn('Severe Migraine with Aura', self.patient.medical_history)
        self.assertEqual(self.patient.vitals.get('bloodPressure'), '125/82')

        # 7. Verify Prescription record created
        prescriptions = Prescription.objects.filter(patient=self.patient, hospital=self.hospital)
        self.assertTrue(prescriptions.exists())
        self.assertEqual(prescriptions.first().medicines[0]['medicineName'], 'Sumatriptan 50mg')

        # 8. Locked records cannot be edited
        res_re_edit = self.client.post(f'/api/consultations/{consult_id}/save_draft/', {'diagnosis': 'Overwritten'}, format='json')
        self.assertEqual(res_re_edit.status_code, status.HTTP_400_BAD_REQUEST)

    def test_prevent_unauthorized_cross_hospital_access(self):
        # Attempt to start consultation on hospital 1's appointment with token header for hospital 2
        res = self.client.post(
            f'/api/appointments/{self.appointment.id}/start_consultation/',
            {'doctor_id': self.doctor.id},
            HTTP_AUTHORIZATION=f'Token token-user-{self.other_hospital.id}',
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_start_cancelled_or_completed_appointment(self):
        self.appointment.status = 'Cancelled'
        self.appointment.save()
        res = self.client.post(f'/api/appointments/{self.appointment.id}/start_consultation/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class SupportTicketWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.hospital = Hospital.objects.create(
            id='HOSP-ST-01',
            name='Metro Care Hospital',
            slug='metro-care',
            city='Mumbai',
            address='12 Marine Drive',
            phone='+91 99999 11111',
            email='info@metrocare.org'
        )

    def test_create_and_manage_support_ticket(self):
        # 1. Create a dynamic ticket
        payload = {
            'id': 'TICK-TEST-99',
            'hospital': self.hospital.id,
            'title': 'DICOM PACS Gateway Connection Drop',
            'description': 'Diagnostic imaging studies fail to sync to cloud storage.',
            'category': 'Technical',
            'priority': 'high',
            'status': 'open',
            'requester_name': 'Chief Radiologist',
            'requester_email': 'radiology@metrocare.org',
            'messages': [
                {
                    'id': 'msg-1',
                    'sender': 'Chief Radiologist',
                    'senderRole': 'hospital',
                    'message': 'PACS gateway dropping packets during MRI study transmission.',
                    'timestamp': '2026-10-20 10:00'
                }
            ]
        }
        res = self.client.post('/api/support-tickets/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['hospital_name'], 'Metro Care Hospital')

        # 2. Add reply from platform support
        reply_res = self.client.post(
            f'/api/support-tickets/{res.data["id"]}/add_reply/',
            {
                'message': 'Increased TCP keep-alive on DICOM proxy to 300 seconds.',
                'sender': 'Platform Operations Support',
                'sender_role': 'platform_support'
            },
            format='json'
        )
        self.assertEqual(reply_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(reply_res.data['messages']), 2)

        # 3. Update status to resolved
        count_before_status = SupportTicket.objects.count()
        status_res = self.client.post(
            f'/api/support-tickets/{res.data["id"]}/update_status/',
            {'status': 'resolved'},
            format='json'
        )
        self.assertEqual(status_res.status_code, status.HTTP_200_OK)
        self.assertEqual(status_res.data['status'], 'resolved')
        self.assertEqual(SupportTicket.objects.count(), count_before_status)

        # 4. Partial update (PATCH) does not duplicate ticket or alter ID
        patch_res = self.client.patch(
            f'/api/support-tickets/{res.data["id"]}/',
            {'status': 'closed'},
            format='json'
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data['id'], res.data['id'])
        self.assertEqual(patch_res.data['status'], 'closed')
        self.assertEqual(SupportTicket.objects.count(), count_before_status)

        # 5. Metrics endpoint returns accurate counts
        metrics_res = self.client.get('/api/support-tickets/metrics/')
        self.assertEqual(metrics_res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(metrics_res.data['total'], 1)
        self.assertGreaterEqual(metrics_res.data['closed'], 1)



