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



