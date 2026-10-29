import zoneinfo
from django.utils import timezone as dj_timezone
from django.conf import settings as django_settings
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.db.models import Sum, Count
from django.utils.text import slugify

def parse_time_to_minutes(time_str):
    if not time_str:
        return None
    cleaned = str(time_str).strip().upper()
    is_pm = 'PM' in cleaned
    is_am = 'AM' in cleaned
    time_only = cleaned.replace('AM', '').replace('PM', '').strip()
    parts = time_only.split(':')
    if len(parts) < 2:
        return None
    try:
        hours = int(parts[0])
        minutes = int(parts[1])
    except ValueError:
        return None
    if is_pm and hours < 12:
        hours += 12
    elif is_am and hours == 12:
        hours = 0
    return hours * 60 + minutes
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
    WebsiteSection,
    DoctorSchedule,
    DoctorUnavailablePeriod,
    AppointmentSettings,
    Consultation,
    SupportTicket,
    Department,
    OPDRoom,
    Ward,
    Bed,
    Staff,
    ActivityLog,
    SalesLead,
    Ambulance,
    AmbulanceMaintenance,
    AmbulanceTrip,
    PatientAppointmentRequest,
    LabTestCatalog,
    CouponCode,
    BranchCreationRequest,
    AdmissionRequest,
    FollowUpRequest,
    LeadFollowUp,
    LeadActivity,
    ConvertedCustomer,
    PatientTestimonial,
    HospitalSetting,
    PlatformSetting,
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
    WebsiteSectionSerializer,
    DoctorScheduleSerializer,
    DoctorUnavailablePeriodSerializer,
    AppointmentSettingsSerializer,
    ConsultationSerializer,
    SupportTicketSerializer,
    DepartmentSerializer,
    OPDRoomSerializer,
    WardSerializer,
    BedSerializer,
    StaffSerializer,
    ActivityLogSerializer,
    SalesLeadSerializer,
    AmbulanceSerializer,
    AmbulanceMaintenanceSerializer,
    AmbulanceTripSerializer,
    PatientAppointmentRequestSerializer,
    LabTestCatalogSerializer,
    CouponCodeSerializer,
    BranchCreationRequestSerializer,
    AdmissionRequestSerializer,
    FollowUpRequestSerializer,
    LeadFollowUpSerializer,
    LeadActivitySerializer,
    ConvertedCustomerSerializer,
    PatientTestimonialSerializer,
    HospitalSettingSerializer,
    PlatformSettingSerializer,
)

class UpsertModelViewSetMixin:
    def create(self, request, *args, **kwargs):
        obj_id = request.data.get('id')
        if obj_id:
            model = self.get_queryset().model
            if model.objects.filter(id=obj_id).exists():
                instance = model.objects.get(id=obj_id)
                serializer = self.get_serializer(instance, data=request.data, partial=True)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)
                return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

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

    def create(self, request, *args, **kwargs):
        user_id = request.data.get('id')
        if user_id and UserProfile.objects.filter(id=user_id).exists():
            instance = UserProfile.objects.get(id=user_id)
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def perform_destroy(self, instance):
        email = instance.email
        if email and instance.role == 'doctor':
            normalized_email = email.strip().lower()
            Doctor.objects.filter(email__iexact=normalized_email).delete()
        instance.delete()

def get_request_hospital_context(request):
    """
    Resolves authenticated tenant hospital from:
    1. Authorization token: Token token-<userId>-<hospitalId>
    2. Header: X-Hospital-Id
    3. Query parameter: hospital_id
    """
    auth_header = request.headers.get('Authorization', '')
    token_hosp = None
    token_user_id = None
    if auth_header.startswith('Bearer ') or auth_header.startswith('Token '):
        token_str = auth_header.split(' ', 1)[1].strip()
        parts = token_str.split('-')
        if len(parts) >= 3 and parts[0] == 'token':
            token_user_id = parts[1]
            token_hosp = parts[2]

    header_hosp = request.headers.get('X-Hospital-Id')
    param_hosp = request.query_params.get('hospital_id')
    return {
        'token_user_id': token_user_id,
        'token_hospital_id': token_hosp,
        'requested_hospital_id': header_hosp or param_hosp,
    }


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

    def get_queryset(self):
        ctx = get_request_hospital_context(self.request)
        token_hosp = ctx['token_hospital_id']
        requested_hosp = ctx['requested_hospital_id']

        # Enforce strict cross-tenant isolation:
        # If user is authenticated for Hospital A and attempts to access Hospital B -> Deny
        if token_hosp and token_hosp != 'platform' and requested_hosp and token_hosp != requested_hosp:
            raise PermissionDenied('Access Denied: Cross-hospital data access is prohibited.')

        effective_hosp = token_hosp if (token_hosp and token_hosp != 'platform') else requested_hosp

        queryset = Patient.objects.all()
        if effective_hosp:
            queryset = queryset.filter(hospital_id=effective_hosp)
        return queryset

    def retrieve(self, request, *args, **kwargs):
        ctx = get_request_hospital_context(request)
        token_hosp = ctx['token_hospital_id']
        patient_id = kwargs.get('pk')
        patient = Patient.objects.filter(pk=patient_id).first()
        if patient and token_hosp and token_hosp != 'platform' and patient.hospital_id != token_hosp:
            return Response(
                {'detail': 'Access Denied: You are not authorized to view records from another hospital.'},
                status=status.HTTP_403_FORBIDDEN
            )
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        pat_id = request.data.get('id')
        if pat_id and Patient.objects.filter(id=pat_id).exists():
            instance = Patient.objects.get(id=pat_id)
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer

    def get_queryset(self):
        queryset = Doctor.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

    def create(self, request, *args, **kwargs):
        doc_id = request.data.get('id')
        if doc_id and Doctor.objects.filter(id=doc_id).exists():
            instance = Doctor.objects.get(id=doc_id)
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def perform_destroy(self, instance):
        email = instance.email
        if email:
            normalized_email = email.strip().lower()
            UserProfile.objects.filter(normalized_email=normalized_email, role='doctor').delete()
        instance.delete()

class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        ctx = get_request_hospital_context(self.request)
        token_hosp = ctx['token_hospital_id']
        requested_hosp = ctx['requested_hospital_id']

        if token_hosp and token_hosp != 'platform' and requested_hosp and token_hosp != requested_hosp:
            raise PermissionDenied('Access Denied: Cross-hospital data access is prohibited.')

        effective_hosp = token_hosp if (token_hosp and token_hosp != 'platform') else requested_hosp

        queryset = Appointment.objects.all()
        if effective_hosp:
            queryset = queryset.filter(hospital_id=effective_hosp)

        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor_id')
        date_param = self.request.query_params.get('date')
        status_param = self.request.query_params.get('status')
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
        apt_id = request.data.get('id')
        if apt_id and Appointment.objects.filter(id=apt_id).exists():
            instance = Appointment.objects.get(id=apt_id)
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)

        doctor_id = request.data.get('doctor') or request.data.get('doctor_id')
        hospital_id = request.data.get('hospital') or request.data.get('hospital_id')
        date = request.data.get('date')
        time = request.data.get('time')
        opd_room_id = request.data.get('opd_room_id')
        tz_name = request.data.get('timezone')

        # 1. Determine hospital timezone and current hospital-local date/time
        if not tz_name and hospital_id:
            try:
                settings_obj = AppointmentSettings.objects.filter(hospital_id=hospital_id).first()
                if settings_obj and getattr(settings_obj, 'timezone', None):
                    tz_name = settings_obj.timezone
            except Exception:
                pass
        if not tz_name:
            tz_name = getattr(django_settings, 'TIME_ZONE', 'Asia/Kolkata') or 'Asia/Kolkata'

        try:
            hospital_tz = zoneinfo.ZoneInfo(tz_name)
        except Exception:
            hospital_tz = zoneinfo.ZoneInfo('Asia/Kolkata')

        now_hospital = dj_timezone.now().astimezone(hospital_tz)
        today_hospital_str = now_hospital.strftime('%Y-%m-%d')
        now_minutes = now_hospital.hour * 60 + now_hospital.minute

        # 2. Reject booking on past dates
        if date and str(date) < today_hospital_str:
            return Response(
                {'error': 'Cannot schedule appointments in the past.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3. Reject booking for passed slots on the current date
        if date and time and str(date) == today_hospital_str:
            slot_mins = parse_time_to_minutes(time)
            if slot_mins is not None and slot_mins <= now_minutes:
                return Response(
                    {'error': 'Selected consultation slot has already passed.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 4. Check doctor overlapping appointment
        if doctor_id and date and time:
            overlapping_doc = Appointment.objects.filter(
                doctor_id=doctor_id,
                date=date,
                time=time
            ).exclude(status='Cancelled')
            if apt_id:
                overlapping_doc = overlapping_doc.exclude(id=apt_id)
            if overlapping_doc.exists():
                return Response(
                    {'error': 'Doctor already has an active consultation scheduled for this time slot.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 5. Check room overlapping appointment
        if opd_room_id and date and time:
            overlapping_room = Appointment.objects.filter(
                opd_room_id=opd_room_id,
                date=date,
                time=time
            ).exclude(status='Cancelled')
            if apt_id:
                overlapping_room = overlapping_room.exclude(id=apt_id)
            if overlapping_room.exists():
                return Response(
                    {'error': 'Selected OPD Chamber is already occupied by another consultation in this time slot.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # 6. Check doctor leave/unavailability
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

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')
        if new_status and new_status != instance.status:
            valid_transitions = {
                'Scheduled': ['Confirmed', 'Cancelled', 'No Show', 'Checked In'],
                'Confirmed': ['Checked In', 'Cancelled', 'No Show'],
                'Checked In': ['In Consultation', 'Completed', 'Cancelled', 'No Show'],
                'In Consultation': ['Completed', 'Cancelled'],
                'Completed': [],
                'Cancelled': [],
                'No Show': [],
            }
            allowed = valid_transitions.get(instance.status, [])
            if new_status not in allowed:
                return Response(
                    {'error': f"Invalid status transition from '{instance.status}' to '{new_status}'."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if new_status == 'Checked In' and not instance.checked_in_at:
                instance.checked_in_at = dj_timezone.now()
            elif new_status == 'In Consultation' and not instance.consultation_started_at:
                instance.consultation_started_at = dj_timezone.now()
            elif new_status == 'Completed' and not instance.consultation_completed_at:
                instance.consultation_completed_at = dj_timezone.now()

        return super().partial_update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        apt_id = pk
        appointment = Appointment.objects.filter(pk=apt_id).first()
        if not appointment:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        ctx = get_request_hospital_context(request)
        token_hosp = ctx['token_hospital_id']
        if token_hosp and token_hosp != 'platform' and appointment.hospital_id != token_hosp:
            return Response(
                {'error': 'Unauthorized: Appointment belongs to a different hospital facility.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if appointment.status in ['Cancelled', 'No Show', 'Completed']:
            return Response(
                {'error': f"Cannot check in appointment with status '{appointment.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        appointment.status = 'Checked In'
        if not appointment.checked_in_at:
            appointment.checked_in_at = dj_timezone.now()
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)

    @action(detail=True, methods=['post'])
    def start_consultation(self, request, pk=None):
        apt_id = pk
        appointment = Appointment.objects.filter(pk=apt_id).first()
        if not appointment:
            return Response({'error': 'Appointment not found.'}, status=status.HTTP_404_NOT_FOUND)

        ctx = get_request_hospital_context(request)
        token_hosp = ctx['token_hospital_id']
        if token_hosp and token_hosp != 'platform' and appointment.hospital_id != token_hosp:
            return Response(
                {'error': 'Unauthorized: Appointment belongs to a different hospital facility.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if appointment.status in ['Cancelled', 'No Show', 'Completed']:
            return Response(
                {'error': f"Cannot start consultation for an appointment with status '{appointment.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        doctor_id = request.data.get('doctor_id') or request.data.get('doctorId')
        if doctor_id and appointment.doctor_id != doctor_id:
            return Response(
                {'error': 'Doctor assignment conflict: Logged-in doctor is not assigned to this appointment.'},
                status=status.HTTP_403_FORBIDDEN
            )

        appointment.status = 'In Consultation'
        if not appointment.consultation_started_at:
            appointment.consultation_started_at = dj_timezone.now()
        appointment.save()

        # Retrieve or initialize draft consultation
        consultation = Consultation.objects.filter(appointment=appointment).first()
        if not consultation:
            consult_id = f"CON-{appointment.id.replace('APT-', '')}-{dj_timezone.now().strftime('%H%M%S')}"
            consultation = Consultation.objects.create(
                id=consult_id,
                hospital=appointment.hospital,
                appointment=appointment,
                patient=appointment.patient,
                doctor=appointment.doctor,
                doctor_name=appointment.doctor.name,
                patient_name=appointment.patient.name,
                status='Draft',
                chief_complaint=appointment.reason or appointment.notes or '',
                vitals=appointment.patient.vitals or {},
            )

        return Response({
            'appointment': AppointmentSerializer(appointment).data,
            'consultation': ConsultationSerializer(consultation).data,
        })


class ConsultationViewSet(viewsets.ModelViewSet):
    queryset = Consultation.objects.all()
    serializer_class = ConsultationSerializer

    def get_queryset(self):
        ctx = get_request_hospital_context(self.request)
        token_hosp = ctx['token_hospital_id']
        requested_hosp = ctx['requested_hospital_id']

        if token_hosp and token_hosp != 'platform' and requested_hosp and token_hosp != requested_hosp:
            raise PermissionDenied('Access Denied: Cross-hospital data access is prohibited.')

        effective_hosp = token_hosp if (token_hosp and token_hosp != 'platform') else requested_hosp

        queryset = Consultation.objects.all()
        if effective_hosp:
            queryset = queryset.filter(hospital_id=effective_hosp)

        doctor_id = self.request.query_params.get('doctor_id')
        patient_id = self.request.query_params.get('patient_id')
        appointment_id = self.request.query_params.get('appointment_id')
        status_param = self.request.query_params.get('status')

        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if appointment_id:
            queryset = queryset.filter(appointment_id=appointment_id)
        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset

    def create(self, request, *args, **kwargs):
        con_id = request.data.get('id')
        if con_id and Consultation.objects.filter(id=con_id).exists():
            instance = Consultation.objects.get(id=con_id)
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        appointment_id = self.request.data.get('appointment') or self.request.data.get('appointment_id')
        appointment = None
        if appointment_id:
            appointment = Appointment.objects.filter(pk=appointment_id).first()

        doctor = serializer.validated_data.get('doctor')
        doctor_name = doctor.name if doctor else (appointment.doctor.name if appointment else '')
        patient = serializer.validated_data.get('patient')
        patient_name = patient.name if patient else (appointment.patient.name if appointment else '')

        serializer.save(
            doctor_name=doctor_name,
            patient_name=patient_name,
        )

    @action(detail=True, methods=['post'])
    def save_draft(self, request, pk=None):
        consultation = self.get_object()
        if consultation.status == 'Finalized':
            return Response(
                {'error': 'Cannot modify finalized clinical documentation. Records are locked.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(consultation, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(status='Draft')
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def finalize(self, request, pk=None):
        consultation = self.get_object()
        if consultation.status == 'Finalized':
            return Response(
                {'error': 'Consultation is already finalized and cannot be re-finalized.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        diagnosis = request.data.get('diagnosis') or consultation.diagnosis
        treatment_plan = request.data.get('treatment_plan') or consultation.treatment_plan
        chief_complaint = request.data.get('chief_complaint') or consultation.chief_complaint

        if not diagnosis and not chief_complaint:
            return Response(
                {'error': 'Clinical diagnosis or chief complaint is required before finalization.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(consultation, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        finalized_at = dj_timezone.now()
        consultation = serializer.save(status='Finalized', finalized_at=finalized_at)

        # 1. Update associated Appointment to Completed
        if consultation.appointment:
            apt = consultation.appointment
            apt.status = 'Completed'
            apt.consultation_completed_at = finalized_at
            apt.save()

        # 2. Update Patient EHR:
        patient = consultation.patient
        if diagnosis:
            history = list(patient.medical_history or [])
            if diagnosis not in history:
                history.append(diagnosis)
                patient.medical_history = history
        if consultation.vitals:
            vitals = dict(patient.vitals or {})
            vitals.update(consultation.vitals)
            vitals['recordedAt'] = finalized_at.strftime('%Y-%m-%d %H:%M')
            patient.vitals = vitals
        patient.save()

        # 3. Create or update Prescription record if medicines are prescribed
        prescriptions = consultation.prescription_items
        if prescriptions and isinstance(prescriptions, list) and len(prescriptions) > 0:
            rx_id = f"RX-{consultation.id.replace('CON-', '')}"
            Prescription.objects.update_or_create(
                id=rx_id,
                defaults={
                    'hospital': consultation.hospital,
                    'patient': consultation.patient,
                    'doctor_name': consultation.doctor_name,
                    'date': finalized_at.date(),
                    'status': 'Active',
                    'medicines': prescriptions,
                    'notes': consultation.notes or f"Generated during consultation {consultation.id}",
                }
            )

        return Response(ConsultationSerializer(consultation).data)


class AdmissionViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer

    def get_queryset(self):
        queryset = Admission.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

    def perform_create(self, serializer):
        admission = serializer.save()
        self._sync_bed_status(admission)

    def perform_update(self, serializer):
        admission = serializer.save()
        self._sync_bed_status(admission)

    def _sync_bed_status(self, admission):
        try:
            if not admission.bed_number:
                return
            # Find bed by bed_number and hospital
            bed = Bed.objects.filter(bed_number=admission.bed_number, hospital_id=admission.hospital_id).first()
            if not bed:
                bed = Bed.objects.filter(bed_number=admission.bed_number).first()
            if bed:
                if admission.status in ['Discharged', 'Cancelled']:
                    bed.status = 'Available'
                    bed.current_patient_id = None
                    bed.current_patient_name = None
                else:
                    bed.status = 'Occupied'
                    bed.current_patient_id = str(admission.patient_id)
                    bed.current_patient_name = str(admission.patient.name if admission.patient else '')
                bed.save()
        except Exception:
            pass

class BillingInvoiceViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
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

class PharmacyMedicineViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = PharmacyMedicine.objects.all()
    serializer_class = PharmacyMedicineSerializer

    def get_queryset(self):
        queryset = PharmacyMedicine.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

class PrescriptionViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
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

class LabOrderViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
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

class AmbulanceDriverViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = AmbulanceDriver.objects.all()
    serializer_class = AmbulanceDriverSerializer

    def get_queryset(self):
        queryset = AmbulanceDriver.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

class EmergencyRequestViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
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

class HospitalWebsiteViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = HospitalWebsite.objects.all()
    serializer_class = HospitalWebsiteSerializer

    def get_queryset(self):
        queryset = HospitalWebsite.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset


class WebsiteSectionViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = WebsiteSection.objects.all()
    serializer_class = WebsiteSectionSerializer

    def get_queryset(self):
        queryset = WebsiteSection.objects.all()
        hospital_id = self.request.query_params.get('hospital_id') or self.request.query_params.get('hospitalId')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset

    @action(detail=False, methods=['post'])
    def bulk_save(self, request):
        hospital_id = request.data.get('hospital_id') or request.data.get('hospitalId')
        sections_data = request.data.get('sections', [])
        if not hospital_id or not isinstance(sections_data, list):
            return Response({'error': 'hospital_id and sections list are required'}, status=status.HTTP_400_BAD_REQUEST)

        WebsiteSection.objects.filter(hospital_id=hospital_id).delete()
        created = []
        for sec in sections_data:
            sec_dict = dict(sec)
            sec_id = sec_dict.get('id') or f"SEC-{sec_dict.get('sectionType', 'sec')}-{hospital_id}"
            obj = WebsiteSection.objects.create(
                id=sec_id,
                hospital_id=hospital_id,
                section_type=sec_dict.get('sectionType') or sec_dict.get('section_type', 'hero'),
                title=sec_dict.get('title', ''),
                subtitle=sec_dict.get('subtitle'),
                content=sec_dict.get('content'),
                image_url=sec_dict.get('imageUrl') or sec_dict.get('image_url'),
                display_order=float(sec_dict.get('displayOrder') or sec_dict.get('display_order', 1.0)),
                is_enabled=bool(sec_dict.get('isEnabled', True) if 'isEnabled' in sec_dict else sec_dict.get('is_enabled', True)),
                settings=sec_dict.get('settings', {})
            )
            created.append(WebsiteSectionSerializer(obj).data)
        return Response({'success': True, 'count': len(created), 'sections': created})


class DoctorScheduleViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
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


class DoctorUnavailablePeriodViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
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


class AppointmentSettingsViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
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
    """
    Hospital-specific user authentication with strict tenant isolation.
    Combination of (hospital identity + normalized email) identifies the account.
    Platform-level accounts authenticate against platform scope.
    """
    email = request.data.get('email', '').strip()
    password = request.data.get('password', '')
    hospital_id = request.data.get('hospital_id')
    hospital_slug = request.data.get('hospital_slug')

    if not email or not password:
        return Response({
            'success': False,
            'message': 'Email and password are required.'
        }, status=status.HTTP_400_BAD_REQUEST)

    normalized_email = email.lower()

    # 1. Resolve Hospital Context if provided via hospital_id or hospital_slug
    hospital = None
    if hospital_id:
        hospital = Hospital.objects.filter(id=hospital_id).first()
        if not hospital:
            return Response({
                'success': False,
                'message': f'Hospital "{hospital_id}" not found.'
            }, status=status.HTTP_404_NOT_FOUND)
    elif hospital_slug:
        hospital = Hospital.objects.filter(slug=hospital_slug).first()
        if not hospital:
            return Response({
                'success': False,
                'message': f'Hospital with slug "{hospital_slug}" not found.'
            }, status=status.HTTP_404_NOT_FOUND)

    # 2. Authenticate based on resolved tenant scope
    if hospital:
        # Hospital-specific login: strictly look up by (hospital, normalized_email)
        user = UserProfile.objects.filter(hospital=hospital, normalized_email=normalized_email).first()
        if not user:
            # Generic error to prevent cross-hospital enumeration
            return Response({
                'success': False,
                'message': 'Invalid credentials for the selected hospital.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Verify password
        if not user.check_password(password):
            return Response({
                'success': False,
                'message': 'Invalid credentials for the selected hospital.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        # Check account status
        if getattr(user, 'status', 'active') != 'active':
            return Response({
                'success': False,
                'message': 'Account is inactive or suspended. Please contact hospital administrator.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Check if patient has any pending bills at this hospital
        if user.role == 'patient':
            patient_ids = []
            if user.patient_id:
                patient_ids.append(user.patient_id)
            matched_pats = Patient.objects.filter(hospital=hospital, email__iexact=user.email)
            for mp in matched_pats:
                patient_ids.append(mp.id)

            pending_invoices = BillingInvoice.objects.filter(
                hospital=hospital,
                status__in=['Pending', 'Partially Paid', 'Overdue', 'Unpaid']
            )
            if patient_ids:
                pending_invoices = pending_invoices.filter(patient_id__in=patient_ids)
            else:
                pending_invoices = pending_invoices.none()

            if pending_invoices.exists():
                first_inv = pending_invoices.first()
                balance = float(first_inv.total_amount - first_inv.paid_amount) if (first_inv.total_amount - first_inv.paid_amount) > 0 else float(first_inv.total_amount)
                return Response({
                    'success': False,
                    'message': f'Access Denied: You have an outstanding pending bill (${balance:.2f}) at {hospital.name}. Please settle your pending dues at the hospital billing desk to regain portal access.'
                }, status=status.HTTP_403_FORBIDDEN)

        serializer = UserProfileSerializer(user)
        token_payload = f"token-{user.id}-{hospital.id}"
        return Response({
            'success': True,
            'user': serializer.data,
            'hospital': {
                'id': hospital.id,
                'name': hospital.name,
                'slug': hospital.slug,
            },
            'token': token_payload
        })
    else:
        # Direct email login or platform-level login (when facility is not explicitly specified)
        matching_users = list(UserProfile.objects.filter(normalized_email=normalized_email))
        if not matching_users:
            return Response({
                'success': False,
                'message': 'Invalid credentials or account not found.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        valid_users = [u for u in matching_users if u.check_password(password)]
        if not valid_users:
            return Response({
                'success': False,
                'message': 'Invalid credentials.'
            }, status=status.HTTP_401_UNAUTHORIZED)

        if len(valid_users) > 1:
            accounts_data = []
            for u in valid_users:
                accounts_data.append({
                    'id': u.id,
                    'hospital_id': u.hospital.id if u.hospital else None,
                    'hospital_name': u.hospital.name if u.hospital else 'Platform',
                    'role': u.role,
                    'name': u.name,
                })
            return Response({
                'success': False,
                'requires_hospital_selection': True,
                'message': 'Multiple hospital accounts found for this email. Please select the hospital facility to enter.',
                'accounts': accounts_data,
            }, status=status.HTTP_200_OK)

        user = valid_users[0]

        if getattr(user, 'status', 'active') != 'active':
            return Response({
                'success': False,
                'message': 'Account is inactive or suspended.'
            }, status=status.HTTP_403_FORBIDDEN)

        if user.role == 'patient' and user.hospital:
            patient_ids = []
            if user.patient_id:
                patient_ids.append(user.patient_id)
            matched_pats = Patient.objects.filter(hospital=user.hospital, email__iexact=user.email)
            for mp in matched_pats:
                patient_ids.append(mp.id)

            pending_invoices = BillingInvoice.objects.filter(
                hospital=user.hospital,
                status__in=['Pending', 'Partially Paid', 'Overdue', 'Unpaid']
            )
            if patient_ids:
                pending_invoices = pending_invoices.filter(patient_id__in=patient_ids)
            else:
                pending_invoices = pending_invoices.none()

            if pending_invoices.exists():
                first_inv = pending_invoices.first()
                balance = float(first_inv.total_amount - first_inv.paid_amount) if (first_inv.total_amount - first_inv.paid_amount) > 0 else float(first_inv.total_amount)
                return Response({
                    'success': False,
                    'message': f'Access Denied: You have an outstanding pending bill (${balance:.2f}) at {user.hospital.name}. Please settle your pending dues at the hospital billing desk to regain portal access.'
                }, status=status.HTTP_403_FORBIDDEN)

        serializer = UserProfileSerializer(user)
        hospital_data = None
        if user.hospital:
            hospital_data = {
                'id': user.hospital.id,
                'name': user.hospital.name,
                'slug': user.hospital.slug,
            }
        token_payload = f"token-{user.id}-{user.hospital.id if user.hospital else 'platform'}"
        return Response({
            'success': True,
            'user': serializer.data,
            'hospital': hospital_data,
            'token': token_payload
        })


class SupportTicketViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = SupportTicket.objects.all().order_by('-updated_at')
    serializer_class = SupportTicketSerializer

    def get_queryset(self):
        from django.db.models import Q
        qs = super().get_queryset()
        hospital_id = self.request.query_params.get('hospital_id') or self.request.query_params.get('hospital')
        if hospital_id:
            qs = qs.filter(Q(hospital_id=hospital_id) | Q(hospital__id=hospital_id))
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            qs = qs.filter(status=status_param)
        priority_param = self.request.query_params.get('priority')
        if priority_param and priority_param != 'all':
            qs = qs.filter(priority=priority_param)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(title__icontains=search) |
                Q(id__icontains=search) |
                Q(hospital_name__icontains=search) |
                Q(description__icontains=search) |
                Q(requester_name__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        import uuid
        data = serializer.validated_data
        if not data.get('id'):
            data['id'] = f"TICK-{uuid.uuid4().hex[:6].upper()}"
        hospital = data.get('hospital')
        if hospital and not data.get('hospital_name'):
            data['hospital_name'] = hospital.name
        serializer.save()

    @action(detail=True, methods=['post'])
    def add_reply(self, request, pk=None):
        ticket = self.get_object()
        message_text = request.data.get('message', '').strip()
        if not message_text:
            return Response({'error': 'Message cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
        sender = request.data.get('sender', 'Support Specialist')
        sender_role = request.data.get('sender_role', 'platform_support')
        
        import uuid
        msg = {
            'id': f"msg-{uuid.uuid4().hex[:8]}",
            'sender': sender,
            'senderRole': sender_role,
            'message': message_text,
            'timestamp': dj_timezone.now().strftime('%Y-%m-%d %H:%M'),
        }
        messages = list(ticket.messages or [])
        messages.append(msg)
        ticket.messages = messages
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get('status')
        if new_status not in ['open', 'in_progress', 'resolved', 'closed']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        ticket.status = new_status
        ticket.save()
        return Response(self.get_serializer(ticket).data)

    @action(detail=False, methods=['get'])
    def metrics(self, request):
        qs = self.get_queryset()
        return Response({
            'total': qs.count(),
            'open': qs.filter(status='open').count(),
            'in_progress': qs.filter(status='in_progress').count(),
            'resolved': qs.filter(status='resolved').count(),
            'closed': qs.filter(status='closed').count(),
            'urgent': qs.filter(priority='urgent').count(),
        })


class DepartmentViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def get_queryset(self):
        queryset = Department.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset


class OPDRoomViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = OPDRoom.objects.all()
    serializer_class = OPDRoomSerializer

    def get_queryset(self):
        queryset = OPDRoom.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        dept_id = self.request.query_params.get('department_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if dept_id:
            queryset = queryset.filter(department_id=dept_id)
        return queryset


class WardViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Ward.objects.all()
    serializer_class = WardSerializer

    def get_queryset(self):
        queryset = Ward.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset


class BedViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer

    def get_queryset(self):
        queryset = Bed.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        ward_id = self.request.query_params.get('ward_id')
        status_param = self.request.query_params.get('status')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if ward_id:
            queryset = queryset.filter(ward_id=ward_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset


class StaffViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer

    def get_queryset(self):
        queryset = Staff.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        role_param = self.request.query_params.get('role')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if role_param:
            queryset = queryset.filter(role=role_param)
        return queryset


class ActivityLogViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer

    def get_queryset(self):
        queryset = ActivityLog.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset


class SalesLeadViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = SalesLead.objects.all().order_by('-created_at')
    serializer_class = SalesLeadSerializer

    def get_queryset(self):
        queryset = SalesLead.objects.all().order_by('-created_at')
        status_param = self.request.query_params.get('status')
        if status_param and status_param != 'all':
            queryset = queryset.filter(status=status_param)
        return queryset


class AmbulanceViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = Ambulance.objects.all().order_by('-created_at')
    serializer_class = AmbulanceSerializer

    def get_queryset(self):
        queryset = Ambulance.objects.all().order_by('-created_at')
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset


class AmbulanceMaintenanceViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = AmbulanceMaintenance.objects.all().order_by('-created_at')
    serializer_class = AmbulanceMaintenanceSerializer

    def get_queryset(self):
        queryset = AmbulanceMaintenance.objects.all().order_by('-created_at')
        hospital_id = self.request.query_params.get('hospital_id')
        ambulance_id = self.request.query_params.get('ambulance_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if ambulance_id:
            queryset = queryset.filter(ambulance_id=ambulance_id)
        return queryset


class AmbulanceTripViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = AmbulanceTrip.objects.all().order_by('-created_at')
    serializer_class = AmbulanceTripSerializer

    def get_queryset(self):
        queryset = AmbulanceTrip.objects.all().order_by('-created_at')
        hospital_id = self.request.query_params.get('hospital_id')
        ambulance_id = self.request.query_params.get('ambulance_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if ambulance_id:
            queryset = queryset.filter(ambulance_id=ambulance_id)
        return queryset


class PatientAppointmentRequestViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = PatientAppointmentRequest.objects.all().order_by('-created_at')
    serializer_class = PatientAppointmentRequestSerializer

    def get_queryset(self):
        queryset = PatientAppointmentRequest.objects.all().order_by('-created_at')
        hospital_id = self.request.query_params.get('hospital_id')
        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor_id')
        status_param = self.request.query_params.get('status')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset


class LabTestCatalogViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = LabTestCatalog.objects.all().order_by('test_name')
    serializer_class = LabTestCatalogSerializer

    def get_queryset(self):
        queryset = LabTestCatalog.objects.all().order_by('test_name')
        hospital_id = self.request.query_params.get('hospital_id')
        category = self.request.query_params.get('category')
        status_param = self.request.query_params.get('status')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if category:
            queryset = queryset.filter(category=category)
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset


class CouponCodeViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = CouponCode.objects.all().order_by('-created_at')
    serializer_class = CouponCodeSerializer


class BranchCreationRequestViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = BranchCreationRequest.objects.all().order_by('-created_at')
    serializer_class = BranchCreationRequestSerializer

    def get_queryset(self):
        queryset = BranchCreationRequest.objects.all().order_by('-created_at')
        org_id = self.request.query_params.get('organization_id')
        if org_id:
            queryset = queryset.filter(organization_id=org_id)
        return queryset


class AdmissionRequestViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = AdmissionRequest.objects.all().order_by('-created_at')
    serializer_class = AdmissionRequestSerializer

    def get_queryset(self):
        queryset = AdmissionRequest.objects.all().order_by('-created_at')
        hospital_id = self.request.query_params.get('hospital_id')
        patient_id = self.request.query_params.get('patient_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        return queryset


class FollowUpRequestViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = FollowUpRequest.objects.all().order_by('-created_at')
    serializer_class = FollowUpRequestSerializer

    def get_queryset(self):
        queryset = FollowUpRequest.objects.all().order_by('-created_at')
        hospital_id = self.request.query_params.get('hospital_id')
        patient_id = self.request.query_params.get('patient_id')
        doctor_id = self.request.query_params.get('doctor_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
        return queryset


class LeadFollowUpViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = LeadFollowUp.objects.all().order_by('-date')
    serializer_class = LeadFollowUpSerializer

    def get_queryset(self):
        queryset = LeadFollowUp.objects.all().order_by('-date')
        lead_id = self.request.query_params.get('lead_id')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        return queryset


class LeadActivityViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = LeadActivity.objects.all().order_by('-created_at')
    serializer_class = LeadActivitySerializer

    def get_queryset(self):
        queryset = LeadActivity.objects.all().order_by('-created_at')
        lead_id = self.request.query_params.get('lead_id')
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        return queryset


class ConvertedCustomerViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = ConvertedCustomer.objects.all().order_by('-created_at')
    serializer_class = ConvertedCustomerSerializer


class PatientTestimonialViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = PatientTestimonial.objects.all().order_by('-created_at')
    serializer_class = PatientTestimonialSerializer

    def get_queryset(self):
        queryset = PatientTestimonial.objects.all().order_by('-created_at')
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset


class HospitalSettingViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = HospitalSetting.objects.all()
    serializer_class = HospitalSettingSerializer

    def get_queryset(self):
        queryset = HospitalSetting.objects.all()
        hospital_id = self.request.query_params.get('hospital_id')
        if hospital_id:
            queryset = queryset.filter(hospital_id=hospital_id)
        return queryset


class PlatformSettingViewSet(UpsertModelViewSetMixin, viewsets.ModelViewSet):
    queryset = PlatformSetting.objects.all()
    serializer_class = PlatformSettingSerializer



