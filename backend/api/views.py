from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from django.db.models import Sum, Count
from django.utils.text import slugify
from .models import (
    Organization,
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
    DoctorSchedule,
    DoctorUnavailablePeriod,
    AppointmentSettings,
)
from .serializers import (
    OrganizationSerializer,
    HospitalSerializer,
    UserProfileSerializer,
    PatientSerializer,
    DoctorSerializer,
    AppointmentSerializer,
    AdmissionSerializer,
    BillingInvoiceSerializer,
    PharmacyMedicineSerializer,
    PrescriptionSerializer,
    LabOrderSerializer,
    AmbulanceDriverSerializer,
    EmergencyRequestSerializer,
    SubscriptionPlanSerializer,
    HospitalWebsiteSerializer,
    DoctorScheduleSerializer,
    DoctorUnavailablePeriodSerializer,
    AppointmentSettingsSerializer,
)

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer

    @action(detail=True, methods=['get'])
    def branches(self, request, pk=None):
        org = self.get_object()
        branches = org.branches.all()
        serializer = HospitalSerializer(branches, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_branch(self, request, pk=None):
        org = self.get_object()
        if org.subscription_status != 'active' or org.subscription_tier != 'enterprise':
            return Response(
                {'error': 'Active Enterprise Health Network subscription required to provision branches.'},
                status=status.HTTP_403_FORBIDDEN
            )

        current_branches_count = org.branches.count()
        if current_branches_count >= org.max_branches:
            return Response(
                {'error': f'Branch limit reached ({current_branches_count}/{org.max_branches}). Please contact Super Admin to expand your Enterprise tier limit.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = request.data
        branch_code = data.get('branch_code', '').strip().upper()
        if not branch_code:
            return Response({'error': 'Branch code is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check for duplicate branch codes within organization
        if org.branches.filter(branch_code=branch_code).exists():
            return Response({'error': f'Branch code "{branch_code}" already exists in this organization.'}, status=status.HTTP_400_BAD_REQUEST)

        branch_name = data.get('name', '').strip()
        if not branch_name:
            return Response({'error': 'Branch name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        slug = slugify(branch_name) + '-' + branch_code.lower()
        branch_id = f"HOSP-{branch_code}"

        branch = Hospital.objects.create(
            id=branch_id,
            name=branch_name,
            slug=slug,
            city=data.get('city', org.headquarters_city),
            address=data.get('address', ''),
            phone=data.get('phone', ''),
            email=data.get('email', ''),
            status='Active',
            plan='Enterprise',
            beds_count=int(data.get('beds_count', 50)),
            doctors_count=int(data.get('doctors_count', 10)),
            organization=org,
            organization_name=org.name,
            is_branch=True,
            branch_code=branch_code,
        )

        # Provision draft website for the new branch
        HospitalWebsite.objects.create(
            id=f"WEB-{branch_id}",
            hospital=branch,
            hero_title=f"Welcome to {branch_name}",
            hero_subtitle=f"A proud healthcare branch of {org.name}.",
            primary_color="#6366f1",
            is_published=False,
        )

        # Provision Branch Admin if provided
        admin_email = data.get('admin_email', '').strip()
        admin_name = data.get('admin_name', '').strip()
        admin_user = None
        if admin_email and admin_name:
            admin_user = UserProfile.objects.create(
                id=f"USR-{branch_id}-ADM",
                name=admin_name,
                email=admin_email,
                role='hospital_admin',
                portal='hospital',
                hospital=branch,
                hospital_name=branch.name,
                organization=org,
                is_organization_admin=False,
                permitted_branch_ids=[branch.id],
            )

        return Response({
            'success': True,
            'message': f'Branch "{branch_name}" ({branch_code}) provisioned successfully.',
            'branch': HospitalSerializer(branch).data,
            'admin': UserProfileSerializer(admin_user).data if admin_user else None,
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def consolidated_report(self, request, pk=None):
        org = self.get_object()
        branches = org.branches.all()
        branch_reports = []

        total_patients = 0
        total_appointments = 0
        total_admissions = 0
        total_revenue = 0.0

        for b in branches:
            patients_count = b.patients.count()
            appointments_count = b.appointments.count()
            admissions_count = b.admissions.count()
            revenue = float(b.invoices.aggregate(total=Sum('paid_amount'))['total'] or 0.0)

            total_patients += patients_count
            total_appointments += appointments_count
            total_admissions += admissions_count
            total_revenue += revenue

            branch_reports.append({
                'branch_id': b.id,
                'branch_name': b.name,
                'branch_code': b.branch_code,
                'city': b.city,
                'status': b.status,
                'beds_count': b.beds_count,
                'doctors_count': b.doctors_count,
                'patients_count': patients_count,
                'appointments_count': appointments_count,
                'admissions_count': admissions_count,
                'revenue': revenue,
            })

        return Response({
            'organization': {
                'id': org.id,
                'name': org.name,
                'total_branches': branches.count(),
                'active_branches': branches.filter(status='Active').count(),
                'max_branches': org.max_branches,
            },
            'summary': {
                'total_patients': total_patients,
                'total_appointments': total_appointments,
                'total_admissions': total_admissions,
                'total_revenue': total_revenue,
            },
            'branch_breakdown': branch_reports,
        })


class HospitalViewSet(viewsets.ModelViewSet):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer

    def get_queryset(self):
        queryset = Hospital.objects.all()
        org_id = self.request.query_params.get('organization_id')
        if org_id:
            queryset = queryset.filter(organization_id=org_id)
        return queryset


class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        queryset = UserProfile.objects.all()
        org_id = self.request.query_params.get('organization_id')
        hospital_id = self.request.query_params.get('hospital_id')
        if org_id:
            queryset = queryset.filter(organization_id=org_id)
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

    def get_queryset(self):
        queryset = Patient.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer

    def get_queryset(self):
        queryset = Doctor.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        queryset = Appointment.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor_id')
        date_param = self.request.query_params.get('date')
        status_param = self.request.query_params.get('status')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if date_param:
            queryset = queryset.filter(date=date_param)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def create(self, request, *args, **kwargs):
        doctor_id = request.data.get('doctor') or request.data.get('doctor_id')
        date = request.data.get('date')
        time = request.data.get('time')
        opd_room_id = request.data.get('opd_room_id')

        # Check doctor overlapping appointment
        if doctor_id and date and time:
            overlapping_doc = Appointment.objects.filter(
                doctor_id=doctor_id,
                date=date,
                time=time
            ).exclude(status='Cancelled').exists()
            if overlapping_doc:
                return Response(
                    {'error': 'Doctor already has an active consultation scheduled for this time slot.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Check room overlapping appointment
        if opd_room_id and date and time:
            overlapping_room = Appointment.objects.filter(
                opd_room_id=opd_room_id,
                date=date,
                time=time
            ).exclude(status='Cancelled').exists()
            if overlapping_room:
                return Response(
                    {'error': 'Selected OPD Chamber is already occupied by another consultation in this time slot.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Check doctor leave/unavailability
        if doctor_id and date:
            leave_conflict = DoctorUnavailablePeriod.objects.filter(
                doctor_id=doctor_id,
                start_date__lte=date,
                end_date__gte=date
            ).exists()
            if leave_conflict:
                return Response(
                    {'error': 'Doctor is on leave or marked unavailable during this date.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().create(request, *args, **kwargs)


class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer

    def get_queryset(self):
        queryset = Admission.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

class BillingInvoiceViewSet(viewsets.ModelViewSet):
    queryset = BillingInvoice.objects.all()
    serializer_class = BillingInvoiceSerializer

    def get_queryset(self):
        queryset = BillingInvoice.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        patient_id = self.request.query_params.get('patient_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

class PharmacyMedicineViewSet(viewsets.ModelViewSet):
    queryset = PharmacyMedicine.objects.all()
    serializer_class = PharmacyMedicineSerializer

    def get_queryset(self):
        queryset = PharmacyMedicine.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        queryset = Prescription.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        patient_id = self.request.query_params.get('patient_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

class LabOrderViewSet(viewsets.ModelViewSet):
    queryset = LabOrder.objects.all()
    serializer_class = LabOrderSerializer

    def get_queryset(self):
        queryset = LabOrder.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        patient_id = self.request.query_params.get('patient_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset

class AmbulanceDriverViewSet(viewsets.ModelViewSet):
    queryset = AmbulanceDriver.objects.all()
    serializer_class = AmbulanceDriverSerializer

    def get_queryset(self):
        queryset = AmbulanceDriver.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

class EmergencyRequestViewSet(viewsets.ModelViewSet):
    queryset = EmergencyRequest.objects.all()
    serializer_class = EmergencyRequestSerializer

    def get_queryset(self):
        queryset = EmergencyRequest.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        driver_id = self.request.query_params.get('driver_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if driver_id:
            queryset = queryset.filter(assigned_driver_id=driver_id)
        return queryset

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer

class HospitalWebsiteViewSet(viewsets.ModelViewSet):
    queryset = HospitalWebsite.objects.all()
    serializer_class = HospitalWebsiteSerializer

    def get_queryset(self):
        queryset = HospitalWebsite.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset


class DoctorScheduleViewSet(viewsets.ModelViewSet):
    queryset = DoctorSchedule.objects.all()
    serializer_class = DoctorScheduleSerializer

    def get_queryset(self):
        queryset = DoctorSchedule.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        doctor_id = self.request.query_params.get('doctor_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        return queryset


class DoctorUnavailablePeriodViewSet(viewsets.ModelViewSet):
    queryset = DoctorUnavailablePeriod.objects.all()
    serializer_class = DoctorUnavailablePeriodSerializer

    def get_queryset(self):
        queryset = DoctorUnavailablePeriod.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        doctor_id = self.request.query_params.get('doctor_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        return queryset


class AppointmentSettingsViewSet(viewsets.ModelViewSet):
    queryset = AppointmentSettings.objects.all()
    serializer_class = AppointmentSettingsSerializer

    def get_queryset(self):
        queryset = AppointmentSettings.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset


@api_view(['POST'])

def auth_login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role')

    try:
        user = UserProfile.objects.get(email=email)
        serializer = UserProfileSerializer(user)
        return Response({
            'success': True,
            'user': serializer.data,
            'token': 'demo-jwt-token-123456789'
        })
    except UserProfile.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invalid credentials'
        }, status=status.HTTP_400_BAD_REQUEST)
