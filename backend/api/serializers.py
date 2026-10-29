from rest_framework import serializers
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

class OrganizationSerializer(serializers.ModelSerializer):
    branches_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = '__all__'

    def get_branches_count(self, obj):
        return obj.branches.count()

class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'

def resolve_hospital_fk(data):
    if isinstance(data, dict) or hasattr(data, 'get'):
        if 'hospital' in data:
            hosp_id = data.get('hospital')
            if hosp_id and not Hospital.objects.filter(id=hosp_id).exists():
                matched = Hospital.objects.filter(id__iexact=str(hosp_id)).first()
                if not matched:
                    alias_map = {'hosp-1': 'HOSP-001', 'HOSP-001': 'hosp-1', 'hosp-abc': 'HOSP-ABC-CHN', 'HOSP-ABC-CHN': 'hosp-abc'}
                    alt_id = alias_map.get(str(hosp_id))
                    if alt_id:
                        matched = Hospital.objects.filter(id__iexact=alt_id).first()
                if not matched:
                    matched = Hospital.objects.first()
                if matched:
                    data = data.copy() if hasattr(data, 'copy') else dict(data)
                    data['hospital'] = matched.id
    return data

class UserProfileSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = UserProfile
        fields = '__all__'
        extra_kwargs = {
            'password_hash': {'write_only': True, 'required': False},
            'normalized_email': {'read_only': True},
        }

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        return super().to_internal_value(data)

    def validate(self, attrs):
        role = attrs.get('role', getattr(self.instance, 'role', None))
        hospital = attrs.get('hospital', getattr(self.instance, 'hospital', None))
        email = attrs.get('email', getattr(self.instance, 'email', None))
        user_id = self.initial_data.get('id') if hasattr(self, 'initial_data') else None

        if email:
            normalized = email.strip().lower()
            attrs['normalized_email'] = normalized

            if role == 'patient':
                # Hospital-scoped isolation: patient email cannot be duplicated in the SAME hospital, but can exist across different hospitals
                qs = UserProfile.objects.filter(role='patient', hospital=hospital, normalized_email=normalized)
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                elif user_id:
                    qs = qs.exclude(pk=user_id)
                if qs.exists():
                    scope_name = hospital.name if hospital else 'this hospital'
                    raise serializers.ValidationError({
                        'email': f'Duplicate Email: A patient account with email "{email.strip()}" already exists in {scope_name}.'
                    })
            else:
                # Staff, doctors, platform admins: strictly globally unique across the entire system
                qs = UserProfile.objects.filter(normalized_email=normalized).exclude(role='patient')
                if self.instance:
                    qs = qs.exclude(pk=self.instance.pk)
                elif user_id:
                    qs = qs.exclude(pk=user_id)
                if qs.exists():
                    existing = qs.first()
                    scope_name = existing.hospital.name if existing.hospital else 'the platform'
                    raise serializers.ValidationError({
                        'email': f'Duplicate Email: An account with email "{email.strip()}" already exists in the system (associated with {scope_name}).'
                    })
        return attrs

    def create(self, validated_data):
        raw_password = validated_data.pop('password', None)
        user = UserProfile(**validated_data)
        if raw_password:
            user.set_password(raw_password)
        user.save()
        return user

    def update(self, instance, validated_data):
        raw_password = validated_data.pop('password', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        if raw_password:
            instance.set_password(raw_password)
        instance.save()
        return instance

class PatientSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Patient
        fields = '__all__'
        extra_kwargs = {
            'email': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        return super().to_internal_value(data)

    def validate(self, attrs):
        email = attrs.get('email')
        if email and email.strip():
            normalized_email = email.strip().lower()
            attrs['email'] = normalized_email
            hospital = attrs.get('hospital') or getattr(self.instance, 'hospital', None)
            existing = Patient.objects.filter(hospital=hospital, email__iexact=normalized_email)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            patient_id = self.initial_data.get('id') if hasattr(self, 'initial_data') else None
            if patient_id:
                existing = existing.exclude(pk=patient_id)
            if existing.exists():
                raise serializers.ValidationError({"email": f'Duplicate Email: A patient with email "{email.strip()}" is already registered in this hospital.'})
        else:
            attrs['email'] = None
        return attrs

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        return super().to_internal_value(data)

    def validate(self, attrs):
        email = attrs.get('email')
        if email:
            normalized_email = email.strip().lower()
            attrs['email'] = normalized_email
            existing = Doctor.objects.filter(email__iexact=normalized_email)
            doc_id = self.initial_data.get('id') if hasattr(self, 'initial_data') else None
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            elif doc_id:
                existing = existing.exclude(pk=doc_id)
            if existing.exists():
                raise serializers.ValidationError({"email": f'Duplicate Email: A doctor with email "{email.strip()}" is already registered in the system.'})
        return attrs

class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'doctor_id' in data and 'doctor' not in data:
                data['doctor'] = data['doctor_id']
            if 'patient_id' in data and 'patient' not in data:
                data['patient'] = data['patient_id']
        return super().to_internal_value(data)

class ConsultationSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = Consultation
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'doctor_id' in data and 'doctor' not in data:
                data['doctor'] = data['doctor_id']
            if 'patient_id' in data and 'patient' not in data:
                data['patient'] = data['patient_id']
            if 'appointment_id' in data and 'appointment' not in data:
                data['appointment'] = data['appointment_id']
        return super().to_internal_value(data)

class AdmissionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = Admission
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        return super().to_internal_value(data)

class BillingInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingInvoice
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        return super().to_internal_value(data)

class PharmacyMedicineSerializer(serializers.ModelSerializer):
    class Meta:
        model = PharmacyMedicine
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        return super().to_internal_value(data)

class PrescriptionSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        return super().to_internal_value(data)

class LabOrderSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)

    class Meta:
        model = LabOrder
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        return super().to_internal_value(data)

class AmbulanceDriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = AmbulanceDriver
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'licenseNumber' in data and 'license_number' not in data:
                data['license_number'] = data['licenseNumber']
            if 'assignedAmbulanceReg' in data and 'assigned_ambulance_reg' not in data:
                data['assigned_ambulance_reg'] = data['assignedAmbulanceReg']
            if 'availabilityStatus' in data and 'availability_status' not in data:
                data['availability_status'] = data['availabilityStatus']
            if 'completedTrips' in data and 'completed_trips' not in data:
                data['completed_trips'] = data['completedTrips']
        return super().to_internal_value(data)

class EmergencyRequestSerializer(serializers.ModelSerializer):
    assigned_driver_name = serializers.CharField(source='assigned_driver.name', read_only=True)

    class Meta:
        model = EmergencyRequest
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'patientName' in data and 'patient_name' not in data:
                data['patient_name'] = data['patientName']
            if 'patientPhone' in data and 'patient_phone' not in data:
                data['patient_phone'] = data['patientPhone']
            if 'pickupLocation' in data and 'pickup_location' not in data:
                data['pickup_location'] = data['pickupLocation']
            if 'destinationHospital' in data and 'destination_hospital' not in data:
                data['destination_hospital'] = data['destinationHospital']
            if 'emergencyType' in data and 'emergency_type' not in data:
                data['emergency_type'] = data['emergencyType']
            if 'chiefComplaint' in data and 'chief_complaint' not in data:
                data['chief_complaint'] = data['chiefComplaint']
            if 'assignedDriverId' in data and 'assigned_driver' not in data:
                data['assigned_driver'] = data['assignedDriverId']
            elif 'assigned_driver_id' in data and 'assigned_driver' not in data:
                data['assigned_driver'] = data['assigned_driver_id']
        return super().to_internal_value(data)

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        return super().to_internal_value(data)

class HospitalWebsiteSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model = HospitalWebsite
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'heroTitle' in data and 'hero_title' not in data:
                data['hero_title'] = data['heroTitle']
            if 'heroSubtitle' in data and 'hero_subtitle' not in data:
                data['hero_subtitle'] = data['heroSubtitle']
            if 'primaryColor' in data and 'primary_color' not in data:
                data['primary_color'] = data['primaryColor']
            if 'isPublished' in data and 'is_published' not in data:
                data['is_published'] = data['isPublished']
        return super().to_internal_value(data)

class WebsiteSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebsiteSection
        fields = '__all__'

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['hospitalId'] = instance.hospital_id
        ret['sectionType'] = instance.section_type
        ret['imageUrl'] = instance.image_url
        ret['displayOrder'] = instance.display_order
        ret['isEnabled'] = instance.is_enabled
        if instance.website_id:
            ret['websiteId'] = instance.website_id
        return ret

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'sectionType' in data and 'section_type' not in data:
                data['section_type'] = data['sectionType']
            if 'imageUrl' in data and 'image_url' not in data:
                data['image_url'] = data['imageUrl']
            if 'displayOrder' in data and 'display_order' not in data:
                data['display_order'] = data['displayOrder']
            if 'isEnabled' in data and 'is_enabled' not in data:
                data['is_enabled'] = data['isEnabled']
            if 'websiteId' in data and 'website' not in data:
                data['website'] = data['websiteId']
        return super().to_internal_value(data)

class DoctorScheduleSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = DoctorSchedule
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'doctorId' in data and 'doctor' not in data:
                data['doctor'] = data['doctorId']
            elif 'doctor_id' in data and 'doctor' not in data:
                data['doctor'] = data['doctor_id']
            if 'departmentId' in data and 'department_id' not in data:
                data['department_id'] = data['departmentId']
            if 'departmentName' in data and 'department_name' not in data:
                data['department_name'] = data['departmentName']
            if 'opdRoomId' in data and 'opd_room_id' not in data:
                data['opd_room_id'] = data['opdRoomId']
            if 'opdRoomName' in data and 'opd_room_name' not in data:
                data['opd_room_name'] = data['opdRoomName']
            if 'workingDays' in data and 'working_days' not in data:
                data['working_days'] = data['workingDays']
            if 'consultationStartTime' in data and 'consultation_start_time' not in data:
                data['consultation_start_time'] = data['consultationStartTime']
            if 'consultationEndTime' in data and 'consultation_end_time' not in data:
                data['consultation_end_time'] = data['consultationEndTime']
            if 'slotDurationMinutes' in data and 'slot_duration_minutes' not in data:
                data['slot_duration_minutes'] = data['slotDurationMinutes']
            if 'effectiveStartDate' in data and 'effective_start_date' not in data:
                data['effective_start_date'] = data['effectiveStartDate']
            if 'effectiveEndDate' in data and 'effective_end_date' not in data:
                data['effective_end_date'] = data['effectiveEndDate']
            if 'isActive' in data and 'is_active' not in data:
                data['is_active'] = data['isActive']
        return super().to_internal_value(data)

class DoctorUnavailablePeriodSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source='doctor.name', read_only=True)

    class Meta:
        model = DoctorUnavailablePeriod
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'doctorId' in data and 'doctor' not in data:
                data['doctor'] = data['doctorId']
            elif 'doctor_id' in data and 'doctor' not in data:
                data['doctor'] = data['doctor_id']
            if 'periodType' in data and 'period_type' not in data:
                data['period_type'] = data['periodType']
            if 'startDate' in data and 'start_date' not in data:
                data['start_date'] = data['startDate']
            if 'endDate' in data and 'end_date' not in data:
                data['end_date'] = data['endDate']
            if 'startTime' in data and 'start_time' not in data:
                data['start_time'] = data['startTime']
            if 'endTime' in data and 'end_time' not in data:
                data['end_time'] = data['endTime']
            if 'isAllDay' in data and 'is_all_day' not in data:
                data['is_all_day'] = data['isAllDay']
        return super().to_internal_value(data)

class AppointmentSettingsSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True)

    class Meta:
        model = AppointmentSettings
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'maxAdvanceBookingDays' in data and 'max_advance_booking_days' not in data:
                data['max_advance_booking_days'] = data['maxAdvanceBookingDays']
            if 'minAdvanceBookingHours' in data and 'min_advance_booking_hours' not in data:
                data['min_advance_booking_hours'] = data['minAdvanceBookingHours']
            if 'cancellationDeadlineHours' in data and 'cancellation_deadline_hours' not in data:
                data['cancellation_deadline_hours'] = data['cancellationDeadlineHours']
            if 'reschedulingDeadlineHours' in data and 'rescheduling_deadline_hours' not in data:
                data['rescheduling_deadline_hours'] = data['reschedulingDeadlineHours']
            if 'appointmentBufferMinutes' in data and 'appointment_buffer_minutes' not in data:
                data['appointment_buffer_minutes'] = data['appointmentBufferMinutes']
            if 'allowSameDayBooking' in data and 'allow_same_day_booking' not in data:
                data['allow_same_day_booking'] = data['allowSameDayBooking']
        return super().to_internal_value(data)


class SupportTicketSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    hospital_id = serializers.CharField(source='hospital.id', read_only=True)
    hospitalId = serializers.CharField(source='hospital.id', read_only=True)

    class Meta:
        model = SupportTicket
        fields = '__all__'
        extra_kwargs = {
            'id': {'required': False},
        }

    def to_internal_value(self, data):
        import uuid
        data = data.copy() if hasattr(data, 'copy') else dict(data)
        if self.instance and self.instance.id:
            data['id'] = self.instance.id
        elif not data.get('id'):
            data['id'] = f"TICK-{uuid.uuid4().hex[:6].upper()}"
        if 'hospital' not in data:
            if 'hospital_id' in data:
                data['hospital'] = data['hospital_id']
            elif 'hospitalId' in data:
                data['hospital'] = data['hospitalId']
        if 'hospitalName' in data and 'hospital_name' not in data:
            data['hospital_name'] = data['hospitalName']
        if 'requesterName' in data and 'requester_name' not in data:
            data['requester_name'] = data['requesterName']
        if 'requesterEmail' in data and 'requester_email' not in data:
            data['requester_email'] = data['requesterEmail']
        if 'assignedTo' in data and 'assigned_to' not in data:
            data['assigned_to'] = data['assignedTo']
        return super().to_internal_value(data)

    def update(self, instance, validated_data):
        validated_data.pop('id', None)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalId'] = str(instance.hospital_id or '')
        data['hospitalName'] = instance.hospital_name or (instance.hospital.name if instance.hospital else '')
        data['requesterName'] = instance.requester_name
        data['requesterEmail'] = instance.requester_email
        data['assignedTo'] = instance.assigned_to or ''
        data['createdAt'] = instance.created_at.strftime('%Y-%m-%d %H:%M') if instance.created_at else ''
        data['updatedAt'] = instance.updated_at.strftime('%Y-%m-%d %H:%M') if instance.updated_at else ''
        if isinstance(data.get('messages'), list):
            for msg in data['messages']:
                if 'sender_role' in msg and 'senderRole' not in msg:
                    msg['senderRole'] = msg['sender_role']
                elif 'senderRole' in msg and 'sender_role' not in msg:
                    msg['sender_role'] = msg['senderRole']
        return data


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'phoneExtension' in data and 'phone_extension' not in data:
                data['phone_extension'] = data['phoneExtension']
            if 'headDoctorId' in data and 'head_doctor_id' not in data:
                data['head_doctor_id'] = data['headDoctorId']
            if 'headDoctorName' in data and 'head_doctor_name' not in data:
                data['head_doctor_name'] = data['headDoctorName']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalId'] = str(instance.hospital_id or '')
        data['phoneExtension'] = instance.phone_extension
        data['headDoctorId'] = instance.head_doctor_id or ''
        data['headDoctorName'] = instance.head_doctor_name or ''
        return data


class OPDRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = OPDRoom
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'departmentId' in data and 'department_id' not in data:
                data['department_id'] = data['departmentId']
            if 'departmentName' in data and 'department_name' not in data:
                data['department_name'] = data['departmentName']
            if 'assignedDoctorId' in data and 'assigned_doctor_id' not in data:
                data['assigned_doctor_id'] = data['assignedDoctorId']
            if 'assignedDoctorName' in data and 'assigned_doctor_name' not in data:
                data['assigned_doctor_name'] = data['assignedDoctorName']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalId'] = str(instance.hospital_id or '')
        data['departmentId'] = instance.department_id or ''
        data['departmentName'] = instance.department_name or ''
        data['assignedDoctorId'] = instance.assigned_doctor_id or ''
        data['assignedDoctorName'] = instance.assigned_doctor_name or ''
        return data


class WardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ward
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'wardType' in data and 'ward_type' not in data:
                data['ward_type'] = data['wardType']
            if 'departmentName' in data and 'department_name' not in data:
                data['department_name'] = data['departmentName']
            if 'dailyRate' in data and 'daily_rate' not in data:
                data['daily_rate'] = data['dailyRate']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalId'] = str(instance.hospital_id or '')
        data['wardType'] = instance.ward_type
        data['departmentName'] = instance.department_name
        data['dailyRate'] = float(instance.daily_rate)
        return data


class BedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bed
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'wardId' in data and 'ward_id' not in data:
                data['ward_id'] = data['wardId']
            if 'wardName' in data and 'ward_name' not in data:
                data['ward_name'] = data['wardName']
            if 'bedNumber' in data and 'bed_number' not in data:
                data['bed_number'] = data['bedNumber']
            if 'wardType' in data and 'ward_type' not in data:
                data['ward_type'] = data['wardType']
            if 'currentPatientId' in data and 'current_patient_id' not in data:
                data['current_patient_id'] = data['currentPatientId']
            if 'currentPatientName' in data and 'current_patient_name' not in data:
                data['current_patient_name'] = data['currentPatientName']
            if 'dailyRate' in data and 'daily_rate' not in data:
                data['daily_rate'] = data['dailyRate']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalId'] = str(instance.hospital_id or '')
        data['wardId'] = instance.ward_id or ''
        data['wardName'] = instance.ward_name or ''
        data['bedNumber'] = instance.bed_number
        data['wardType'] = instance.ward_type
        data['currentPatientId'] = instance.current_patient_id or ''
        data['currentPatientName'] = instance.current_patient_name or ''
        data['dailyRate'] = float(instance.daily_rate)
        return data


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'systemRole' in data and 'system_role' not in data:
                data['system_role'] = data['systemRole']
            if 'joiningDate' in data and 'joining_date' not in data:
                data['joining_date'] = data['joiningDate']
            if 'avatarUrl' in data and 'avatar_url' not in data:
                data['avatar_url'] = data['avatarUrl']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalId'] = str(instance.hospital_id or '')
        data['systemRole'] = instance.system_role
        data['joiningDate'] = str(instance.joining_date) if instance.joining_date else ''
        data['avatarUrl'] = instance.avatar_url or ''
        return data


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'actorName' in data and 'actor_name' not in data:
                data['actor_name'] = data['actorName']
            if 'actorRole' in data and 'actor_role' not in data:
                data['actor_role'] = data['actorRole']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalId'] = str(instance.hospital_id or '')
        data['actorName'] = instance.actor_name
        data['actorRole'] = instance.actor_role
        data['timestamp'] = instance.timestamp.strftime('%Y-%m-%d %H:%M') if instance.timestamp else ''
        return data


class SalesLeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesLead
        fields = '__all__'

    def to_internal_value(self, data):
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'hospitalName' in data and 'hospital_name' not in data:
                data['hospital_name'] = data['hospitalName']
            if 'contactPerson' in data and 'contact_person' not in data:
                data['contact_person'] = data['contactPerson']
            if 'hospitalType' in data and 'hospital_type' not in data:
                data['hospital_type'] = data['hospitalType']
            if 'bedCount' in data and 'bed_count' not in data:
                data['bed_count'] = data['bedCount']
            if 'leadSource' in data and 'lead_source' not in data:
                data['lead_source'] = data['leadSource']
            if 'interestedPlan' in data and 'interested_plan' not in data:
                data['interested_plan'] = data['interestedPlan']
            if 'assignedSalesExecutiveId' in data and 'assigned_sales_executive_id' not in data:
                data['assigned_sales_executive_id'] = data['assignedSalesExecutiveId']
            if 'assignedSalesExecutiveName' in data and 'assigned_sales_executive_name' not in data:
                data['assigned_sales_executive_name'] = data['assignedSalesExecutiveName']
            if 'nextFollowUpDate' in data and 'next_follow_up_date' not in data:
                data['next_follow_up_date'] = data['nextFollowUpDate']
            if 'expectedDecisionDate' in data and 'expected_decision_date' not in data:
                data['expected_decision_date'] = data['expectedDecisionDate']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalName'] = instance.hospital_name
        data['contactPerson'] = instance.contact_person
        data['hospitalType'] = instance.hospital_type
        data['bedCount'] = instance.bed_count
        data['leadSource'] = instance.lead_source
        data['interestedPlan'] = instance.interested_plan
        data['assignedSalesExecutiveId'] = instance.assigned_sales_executive_id
        data['assignedSalesExecutiveName'] = instance.assigned_sales_executive_name
        data['nextFollowUpDate'] = str(instance.next_follow_up_date) if instance.next_follow_up_date else ''
        data['expectedDecisionDate'] = str(instance.expected_decision_date) if instance.expected_decision_date else ''
        data['createdAt'] = instance.created_at.strftime('%Y-%m-%d %H:%M') if instance.created_at else ''
        return data


class AmbulanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ambulance
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'regNumber' in data and 'reg_number' not in data:
                data['reg_number'] = data['regNumber']
            if 'mileageKm' in data and 'mileage_km' not in data:
                data['mileage_km'] = data['mileageKm']
            if 'fuelLevel' in data and 'fuel_level' not in data:
                data['fuel_level'] = data['fuelLevel']
            if 'equipmentCategory' in data and 'equipment_category' not in data:
                data['equipment_category'] = data['equipmentCategory']
            if 'currentLocation' in data and 'current_location' not in data:
                data['current_location'] = data['currentLocation']
            if 'assignedDriverId' in data and 'assigned_driver' not in data:
                data['assigned_driver'] = data['assignedDriverId']
            if 'assignedDriverName' in data and 'assigned_driver_name' not in data:
                data['assigned_driver_name'] = data['assignedDriverName']
            if 'driverPhone' in data and 'driver_phone' not in data:
                data['driver_phone'] = data['driverPhone']
            if 'lastMaintenanceDate' in data and 'last_maintenance_date' not in data:
                data['last_maintenance_date'] = data['lastMaintenanceDate']
            if 'nextMaintenanceDate' in data and 'next_maintenance_date' not in data:
                data['next_maintenance_date'] = data['nextMaintenanceDate']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['regNumber'] = instance.reg_number
        data['mileageKm'] = instance.mileage_km
        data['fuelLevel'] = instance.fuel_level
        data['equipmentCategory'] = instance.equipment_category
        data['currentLocation'] = instance.current_location
        data['assignedDriverId'] = instance.assigned_driver_id
        data['assignedDriverName'] = instance.assigned_driver_name
        data['driverPhone'] = instance.driver_phone
        data['lastMaintenanceDate'] = str(instance.last_maintenance_date) if instance.last_maintenance_date else ''
        data['nextMaintenanceDate'] = str(instance.next_maintenance_date) if instance.next_maintenance_date else ''
        return data


class AmbulanceMaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AmbulanceMaintenance
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'ambulanceId' in data and 'ambulance' not in data:
                data['ambulance'] = data['ambulanceId']
            if 'ambulanceReg' in data and 'ambulance_reg' not in data:
                data['ambulance_reg'] = data['ambulanceReg']
            if 'serviceDate' in data and 'service_date' not in data:
                data['service_date'] = data['serviceDate']
            if 'maintenanceStatus' in data and 'maintenance_status' not in data:
                data['maintenance_status'] = data['maintenanceStatus']
            if 'serviceType' in data and 'service_type' not in data:
                data['service_type'] = data['serviceType']
            if 'servicedBy' in data and 'serviced_by' not in data:
                data['serviced_by'] = data['servicedBy']
            if 'partsCost' in data and 'parts_cost' not in data:
                data['parts_cost'] = data['partsCost']
            if 'labourCost' in data and 'labour_cost' not in data:
                data['labour_cost'] = data['labourCost']
            if 'otherCharges' in data and 'other_charges' not in data:
                data['other_charges'] = data['otherCharges']
            if 'reportedIssue' in data and 'reported_issue' not in data:
                data['reported_issue'] = data['reportedIssue']
            if 'partsReplaced' in data and 'parts_replaced' not in data:
                data['parts_replaced'] = data['partsReplaced']
            if 'technicianName' in data and 'technician_name' not in data:
                data['technician_name'] = data['technicianName']
            if 'nextServiceDate' in data and 'next_service_date' not in data:
                data['next_service_date'] = data['nextServiceDate']
            if 'vehicleAvailability' in data and 'vehicle_availability' not in data:
                data['vehicle_availability'] = data['vehicleAvailability']
            if 'safetyInspectionResult' in data and 'safety_inspection_result' not in data:
                data['safety_inspection_result'] = data['safetyInspectionResult']
            if 'returnToServiceDate' in data and 'return_to_service_date' not in data:
                data['return_to_service_date'] = data['returnToServiceDate']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['ambulanceId'] = instance.ambulance_id
        data['ambulanceReg'] = instance.ambulance_reg
        data['serviceDate'] = str(instance.service_date) if instance.service_date else ''
        data['maintenanceStatus'] = instance.maintenance_status
        data['serviceType'] = instance.service_type
        data['servicedBy'] = instance.serviced_by
        data['partsCost'] = float(instance.parts_cost)
        data['labourCost'] = float(instance.labour_cost)
        data['otherCharges'] = float(instance.other_charges)
        data['cost'] = float(instance.cost)
        data['reportedIssue'] = instance.reported_issue
        data['partsReplaced'] = instance.parts_replaced
        data['technicianName'] = instance.technician_name
        data['nextServiceDate'] = str(instance.next_service_date) if instance.next_service_date else ''
        data['vehicleAvailability'] = instance.vehicle_availability
        data['safetyInspectionResult'] = instance.safety_inspection_result
        data['returnToServiceDate'] = str(instance.return_to_service_date) if instance.return_to_service_date else ''
        return data


class AmbulanceTripSerializer(serializers.ModelSerializer):
    class Meta:
        model = AmbulanceTrip
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'requestId' in data and 'request_id' not in data:
                data['request_id'] = data['requestId']
            if 'ambulanceId' in data and 'ambulance_id' not in data:
                data['ambulance_id'] = data['ambulanceId']
            if 'ambulanceReg' in data and 'ambulance_reg' not in data:
                data['ambulance_reg'] = data['ambulanceReg']
            if 'driverId' in data and 'driver_id' not in data:
                data['driver_id'] = data['driverId']
            if 'driverName' in data and 'driver_name' not in data:
                data['driver_name'] = data['driverName']
            if 'patientName' in data and 'patient_name' not in data:
                data['patient_name'] = data['patientName']
            if 'patientPhone' in data and 'patient_phone' not in data:
                data['patient_phone'] = data['patientPhone']
            if 'pickupAddress' in data and 'pickup_address' not in data:
                data['pickup_address'] = data['pickupAddress']
            if 'startTime' in data and 'start_time' not in data:
                data['start_time'] = data['startTime']
            if 'pickupTime' in data and 'pickup_time' not in data:
                data['pickup_time'] = data['pickupTime']
            if 'hospitalArrivalTime' in data and 'hospital_arrival_time' not in data:
                data['hospital_arrival_time'] = data['hospitalArrivalTime']
            if 'endTime' in data and 'end_time' not in data:
                data['end_time'] = data['endTime']
            if 'distanceKm' in data and 'distance_km' not in data:
                data['distance_km'] = data['distanceKm']
            if 'paramedicNotes' in data and 'paramedic_notes' not in data:
                data['paramedic_notes'] = data['paramedicNotes']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['requestId'] = instance.request_id
        data['ambulanceId'] = instance.ambulance_id
        data['ambulanceReg'] = instance.ambulance_reg
        data['driverId'] = instance.driver_id
        data['driverName'] = instance.driver_name
        data['patientName'] = instance.patient_name
        data['patientPhone'] = instance.patient_phone
        data['pickupAddress'] = instance.pickup_address
        data['startTime'] = instance.start_time
        data['pickupTime'] = instance.pickup_time
        data['hospitalArrivalTime'] = instance.hospital_arrival_time
        data['endTime'] = instance.end_time
        data['distanceKm'] = float(instance.distance_km)
        data['paramedicNotes'] = instance.paramedic_notes
        return data


class PatientAppointmentRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientAppointmentRequest
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'patientId' in data and 'patient' not in data:
                data['patient'] = data['patientId']
            if 'patientName' in data and 'patient_name' not in data:
                data['patient_name'] = data['patientName']
            if 'patientPhone' in data and 'patient_phone' not in data:
                data['patient_phone'] = data['patientPhone']
            if 'patientAge' in data and 'patient_age' not in data:
                data['patient_age'] = data['patientAge']
            if 'patientGender' in data and 'patient_gender' not in data:
                data['patient_gender'] = data['patientGender']
            if 'doctorId' in data and 'doctor' not in data:
                data['doctor'] = data['doctorId']
            if 'doctorName' in data and 'doctor_name' not in data:
                data['doctor_name'] = data['doctorName']
            if 'doctorSpecialization' in data and 'doctor_specialization' not in data:
                data['doctor_specialization'] = data['doctorSpecialization']
            if 'departmentId' in data and 'department' not in data:
                data['department'] = data['departmentId']
            if 'departmentName' in data and 'department_name' not in data:
                data['department_name'] = data['departmentName']
            if 'preferredDate' in data and 'preferred_date' not in data:
                data['preferred_date'] = data['preferredDate']
            if 'preferredTime' in data and 'preferred_time' not in data:
                data['preferred_time'] = data['preferredTime']
            if 'receptionistNote' in data and 'receptionist_note' not in data:
                data['receptionist_note'] = data['receptionistNote']
            if 'respondedBy' in data and 'responded_by' not in data:
                data['responded_by'] = data['respondedBy']
            if 'respondedAt' in data and 'responded_at' not in data:
                data['responded_at'] = data['respondedAt']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['patientId'] = instance.patient_id
        data['patientName'] = instance.patient_name
        data['patientPhone'] = instance.patient_phone
        data['patientAge'] = instance.patient_age
        data['patientGender'] = instance.patient_gender
        data['doctorId'] = instance.doctor_id
        data['doctorName'] = instance.doctor_name
        data['doctorSpecialization'] = instance.doctor_specialization
        data['departmentId'] = instance.department_id
        data['departmentName'] = instance.department_name
        data['preferredDate'] = str(instance.preferred_date) if instance.preferred_date else ''
        data['preferredTime'] = instance.preferred_time
        data['receptionistNote'] = instance.receptionist_note
        data['respondedBy'] = instance.responded_by
        data['respondedAt'] = instance.responded_at.strftime('%Y-%m-%d %H:%M') if instance.responded_at else ''
        data['createdAt'] = instance.created_at.strftime('%Y-%m-%d %H:%M') if instance.created_at else ''
        return data


class LabTestCatalogSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTestCatalog
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'testName' in data and 'test_name' not in data:
                data['test_name'] = data['testName']
            if 'turnaroundHours' in data and 'turnaround_hours' not in data:
                data['turnaround_hours'] = data['turnaroundHours']
            if 'sampleType' in data and 'sample_type' not in data:
                data['sample_type'] = data['sampleType']
            if 'tubeColor' in data and 'tube_color' not in data:
                data['tube_color'] = data['tubeColor']
            if 'normalRange' in data and 'normal_range' not in data:
                data['normal_range'] = data['normalRange']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['testName'] = instance.test_name
        data['turnaroundHours'] = instance.turnaround_hours
        data['sampleType'] = instance.sample_type
        data['tubeColor'] = instance.tube_color
        data['normalRange'] = instance.normal_range
        data['price'] = float(instance.price)
        return data


class CouponCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CouponCode
        fields = '__all__'

    def to_internal_value(self, data):
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'discountPercentage' in data and 'discount_percentage' not in data:
                data['discount_percentage'] = data['discountPercentage']
            if 'isActive' in data and 'is_active' not in data:
                data['is_active'] = data['isActive']
            if 'validUntil' in data and 'valid_until' not in data:
                data['valid_until'] = data['validUntil']
            if 'maxUses' in data and 'max_uses' not in data:
                data['max_uses'] = data['maxUses']
            if 'usedCount' in data and 'used_count' not in data:
                data['used_count'] = data['usedCount']
            if 'usedByHospitals' in data and 'used_by_hospitals' not in data:
                data['used_by_hospitals'] = data['usedByHospitals']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['discountPercentage'] = float(instance.discount_percentage)
        data['isActive'] = instance.is_active
        data['validUntil'] = str(instance.valid_until) if instance.valid_until else ''
        data['maxUses'] = instance.max_uses
        data['usedCount'] = instance.used_count
        data['usedByHospitals'] = instance.used_by_hospitals or []
        data['createdAt'] = instance.created_at.strftime('%Y-%m-%d %H:%M') if instance.created_at else ''
        return data


class BranchCreationRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchCreationRequest
        fields = '__all__'

    def to_internal_value(self, data):
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'organizationId' in data and 'organization_id' not in data:
                data['organization_id'] = data['organizationId']
            if 'organizationName' in data and 'organization_name' not in data:
                data['organization_name'] = data['organizationName']
            if 'branchName' in data and 'branch_name' not in data:
                data['branch_name'] = data['branchName']
            if 'branchCode' in data and 'branch_code' not in data:
                data['branch_code'] = data['branchCode']
            if 'contactPerson' in data and 'contact_person' not in data:
                data['contact_person'] = data['contactPerson']
            if 'contactPhone' in data and 'contact_phone' not in data:
                data['contact_phone'] = data['contactPhone']
            if 'contactEmail' in data and 'contact_email' not in data:
                data['contact_email'] = data['contactEmail']
            if 'branchAdminName' in data and 'branch_admin_name' not in data:
                data['branch_admin_name'] = data['branchAdminName']
            if 'branchAdminEmail' in data and 'branch_admin_email' not in data:
                data['branch_admin_email'] = data['branchAdminEmail']
            if 'branchAdminPhone' in data and 'branch_admin_phone' not in data:
                data['branch_admin_phone'] = data['branchAdminPhone']
            if 'createdHospitalId' in data and 'created_hospital_id' not in data:
                data['created_hospital_id'] = data['createdHospitalId']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['organizationId'] = instance.organization_id
        data['organizationName'] = instance.organization_name
        data['branchName'] = instance.branch_name
        data['branchCode'] = instance.branch_code
        data['contactPerson'] = instance.contact_person
        data['contactPhone'] = instance.contact_phone
        data['contactEmail'] = instance.contact_email
        data['branchAdminName'] = instance.branch_admin_name
        data['branchAdminEmail'] = instance.branch_admin_email
        data['branchAdminPhone'] = instance.branch_admin_phone
        data['createdHospitalId'] = instance.created_hospital_id
        data['createdAt'] = instance.created_at.strftime('%Y-%m-%d %H:%M') if instance.created_at else ''
        return data


class AdmissionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionRequest
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'consultationId' in data and 'consultation_id' not in data:
                data['consultation_id'] = data['consultationId']
            if 'appointmentId' in data and 'appointment_id' not in data:
                data['appointment_id'] = data['appointmentId']
            if 'patientId' in data and 'patient_id' not in data:
                data['patient_id'] = data['patientId']
            if 'patientName' in data and 'patient_name' not in data:
                data['patient_name'] = data['patientName']
            if 'patientPhone' in data and 'patient_phone' not in data:
                data['patient_phone'] = data['patientPhone']
            if 'patientAge' in data and 'patient_age' not in data:
                data['patient_age'] = data['patientAge']
            if 'patientGender' in data and 'patient_gender' not in data:
                data['patient_gender'] = data['patientGender']
            if 'doctorId' in data and 'doctor_id' not in data:
                data['doctor_id'] = data['doctorId']
            if 'doctorName' in data and 'doctor_name' not in data:
                data['doctor_name'] = data['doctorName']
            if 'departmentName' in data and 'department_name' not in data:
                data['department_name'] = data['departmentName']
            if 'recommendedWardType' in data and 'recommended_ward_type' not in data:
                data['recommended_ward_type'] = data['recommendedWardType']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalId'] = str(instance.hospital_id or '')
        data['consultationId'] = instance.consultation_id
        data['appointmentId'] = instance.appointment_id
        data['patientId'] = instance.patient_id
        data['patientName'] = instance.patient_name
        data['patientPhone'] = instance.patient_phone
        data['patientAge'] = instance.patient_age
        data['patientGender'] = instance.patient_gender
        data['doctorId'] = instance.doctor_id
        data['doctorName'] = instance.doctor_name
        data['departmentName'] = instance.department_name
        data['recommendedWardType'] = instance.recommended_ward_type
        data['createdAt'] = instance.created_at.strftime('%Y-%m-%d %H:%M') if instance.created_at else ''
        return data


class FollowUpRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUpRequest
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'consultationId' in data and 'consultation_id' not in data:
                data['consultation_id'] = data['consultationId']
            if 'originalAppointmentId' in data and 'original_appointment_id' not in data:
                data['original_appointment_id'] = data['originalAppointmentId']
            if 'patientId' in data and 'patient_id' not in data:
                data['patient_id'] = data['patientId']
            if 'patientName' in data and 'patient_name' not in data:
                data['patient_name'] = data['patientName']
            if 'patientPhone' in data and 'patient_phone' not in data:
                data['patient_phone'] = data['patientPhone']
            if 'patientAge' in data and 'patient_age' not in data:
                data['patient_age'] = data['patientAge']
            if 'patientGender' in data and 'patient_gender' not in data:
                data['patient_gender'] = data['patientGender']
            if 'doctorId' in data and 'doctor_id' not in data:
                data['doctor_id'] = data['doctorId']
            if 'doctorName' in data and 'doctor_name' not in data:
                data['doctor_name'] = data['doctorName']
            if 'departmentId' in data and 'department_id' not in data:
                data['department_id'] = data['departmentId']
            if 'departmentName' in data and 'department_name' not in data:
                data['department_name'] = data['departmentName']
            if 'suggestedDate' in data and 'suggested_date' not in data:
                data['suggested_date'] = data['suggestedDate']
            if 'intervalDays' in data and 'interval_days' not in data:
                data['interval_days'] = data['intervalDays']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalId'] = str(instance.hospital_id or '')
        data['consultationId'] = instance.consultation_id
        data['originalAppointmentId'] = instance.original_appointment_id
        data['patientId'] = instance.patient_id
        data['patientName'] = instance.patient_name
        data['patientPhone'] = instance.patient_phone
        data['patientAge'] = instance.patient_age
        data['patientGender'] = instance.patient_gender
        data['doctorId'] = instance.doctor_id
        data['doctorName'] = instance.doctor_name
        data['departmentId'] = instance.department_id
        data['departmentName'] = instance.department_name
        data['suggestedDate'] = str(instance.suggested_date) if instance.suggested_date else ''
        data['intervalDays'] = instance.interval_days
        data['createdAt'] = instance.created_at.strftime('%Y-%m-%d %H:%M') if instance.created_at else ''
        return data


class LeadFollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadFollowUp
        fields = '__all__'

    def to_internal_value(self, data):
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'leadId' in data and 'lead_id' not in data:
                data['lead_id'] = data['leadId']
            if 'leadHospitalName' in data and 'lead_hospital_name' not in data:
                data['lead_hospital_name'] = data['leadHospitalName']
            if 'leadContactPerson' in data and 'lead_contact_person' not in data:
                data['lead_contact_person'] = data['leadContactPerson']
            if 'assignedTo' in data and 'assigned_to' not in data:
                data['assigned_to'] = data['assignedTo']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['leadId'] = instance.lead_id
        data['leadHospitalName'] = instance.lead_hospital_name
        data['leadContactPerson'] = instance.lead_contact_person
        data['assignedTo'] = instance.assigned_to
        data['date'] = str(instance.date) if instance.date else ''
        return data


class LeadActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadActivity
        fields = '__all__'

    def to_internal_value(self, data):
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'leadId' in data and 'lead_id' not in data:
                data['lead_id'] = data['leadId']
            if 'createdBy' in data and 'created_by' not in data:
                data['created_by'] = data['createdBy']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['leadId'] = instance.lead_id
        data['createdBy'] = instance.created_by
        data['createdAt'] = instance.created_at.strftime('%Y-%m-%d %H:%M') if instance.created_at else ''
        return data


class ConvertedCustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConvertedCustomer
        fields = '__all__'

    def to_internal_value(self, data):
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'leadId' in data and 'lead_id' not in data:
                data['lead_id'] = data['leadId']
            if 'hospitalId' in data and 'hospital_id' not in data:
                data['hospital_id'] = data['hospitalId']
            if 'hospitalName' in data and 'hospital_name' not in data:
                data['hospital_name'] = data['hospitalName']
            if 'contactPerson' in data and 'contact_person' not in data:
                data['contact_person'] = data['contactPerson']
            if 'convertedBy' in data and 'converted_by' not in data:
                data['converted_by'] = data['convertedBy']
            if 'convertedByName' in data and 'converted_by_name' not in data:
                data['converted_by_name'] = data['convertedByName']
            if 'convertedAt' in data and 'converted_at' not in data:
                data['converted_at'] = data['convertedAt']
            if 'interestedPlan' in data and 'interested_plan' not in data:
                data['interested_plan'] = data['interestedPlan']
            if 'subscriptionStatus' in data and 'subscription_status' not in data:
                data['subscription_status'] = data['subscriptionStatus']
            if 'hospitalAdminStatus' in data and 'hospital_admin_status' not in data:
                data['hospital_admin_status'] = data['hospitalAdminStatus']
            if 'onboardingStatus' in data and 'onboarding_status' not in data:
                data['onboarding_status'] = data['onboardingStatus']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['leadId'] = instance.lead_id
        data['hospitalId'] = instance.hospital_id
        data['hospitalName'] = instance.hospital_name
        data['contactPerson'] = instance.contact_person
        data['convertedBy'] = instance.converted_by
        data['convertedByName'] = instance.converted_by_name
        data['convertedAt'] = instance.converted_at.strftime('%Y-%m-%d %H:%M') if instance.converted_at else ''
        data['interestedPlan'] = instance.interested_plan
        data['subscriptionStatus'] = instance.subscription_status
        data['hospitalAdminStatus'] = instance.hospital_admin_status
        data['onboardingStatus'] = instance.onboarding_status
        data['createdAt'] = instance.created_at.strftime('%Y-%m-%d %H:%M') if instance.created_at else ''
        return data


class PatientTestimonialSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientTestimonial
        fields = '__all__'

    def to_internal_value(self, data):
        data = resolve_hospital_fk(data)
        if hasattr(data, 'copy') or isinstance(data, dict):
            data = data.copy() if hasattr(data, 'copy') else dict(data)
            if 'patientName' in data and 'patient_name' not in data:
                data['patient_name'] = data['patientName']
            if 'patientRole' in data and 'patient_role' not in data:
                data['patient_role'] = data['patientRole']
            if 'avatarUrl' in data and 'avatar_url' not in data:
                data['avatar_url'] = data['avatarUrl']
            if 'reviewText' in data and 'review_text' not in data:
                data['review_text'] = data['reviewText']
        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalId'] = str(instance.hospital_id or '')
        data['patientName'] = instance.patient_name
        data['patientRole'] = instance.patient_role
        data['avatarUrl'] = instance.avatar_url
        data['reviewText'] = instance.review_text
        return data


class HospitalSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = HospitalSetting
        fields = '__all__'

    def to_internal_value(self, data):
        return resolve_hospital_fk(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['hospitalId'] = str(instance.hospital_id or '')
        return data


class PlatformSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSetting
        fields = '__all__'





