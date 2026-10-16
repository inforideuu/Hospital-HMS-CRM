from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import (
    Hospital,
    Doctor,
    Patient,
    Appointment,
    DoctorSchedule,
    DoctorUnavailablePeriod,
    AppointmentSettings,
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
        # 1. Book first appointment
        res1 = self.client.post('/api/appointments/', {
            'id': 'APT-T1',
            'hospital': self.hospital.id,
            'patient': self.patient1.id,
            'doctor': self.doctor1.id,
            'date': '2026-10-20',
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
            'date': '2026-10-20',
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
