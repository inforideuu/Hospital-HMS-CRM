from django.db import models

class Organization(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    headquarters_city = models.CharField(max_length=100, default='Chennai')
    headquarters_address = models.TextField(blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_phone = models.CharField(max_length=50, blank=True, null=True)
    subscription_tier = models.CharField(max_length=50, default='enterprise')
    subscription_status = models.CharField(max_length=20, default='active')
    max_branches = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Hospital(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    city = models.CharField(max_length=100)
    address = models.TextField()
    phone = models.CharField(max_length=50)
    email = models.EmailField()
    status = models.CharField(max_length=20, default='Active')
    plan = models.CharField(max_length=50, default='Standard')
    beds_count = models.IntegerField(default=120)
    doctors_count = models.IntegerField(default=8)
    image = models.TextField(blank=True, null=True)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name='branches')
    organization_name = models.CharField(max_length=255, blank=True, null=True)
    is_branch = models.BooleanField(default=False)
    branch_code = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


from django.contrib.auth.hashers import make_password, check_password

class UserProfile(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    normalized_email = models.CharField(max_length=255)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=50)  # super_admin, hospital_admin, doctor, receptionist, nurse, accountant, pharmacist, lab_technician, ambulance_driver, patient
    portal = models.CharField(max_length=50) # platform, hospital, patient, ambulance_driver
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    hospital_name = models.CharField(max_length=255, blank=True, null=True)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    is_organization_admin = models.BooleanField(default=False)
    permitted_branch_ids = models.JSONField(default=list, blank=True)
    patient_id = models.CharField(max_length=50, blank=True, null=True)
    driver_id = models.CharField(max_length=50, blank=True, null=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['hospital', 'normalized_email'],
                name='unique_hospital_normalized_email'
            ),
        ]

    def set_password(self, raw_password):
        if raw_password:
            self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        if not self.password_hash:
            return False
        return check_password(raw_password, self.password_hash)

    def save(self, *args, **kwargs):
        if self.email:
            self.normalized_email = self.email.strip().lower()
        super().save(*args, **kwargs)

    def __str__(self):
        hosp_str = f" - {self.hospital_name or (self.hospital.name if self.hospital else '')}" if self.hospital else " - Platform"
        return f"{self.name} ({self.role}){hosp_str}"


class Patient(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='patients')
    name = models.CharField(max_length=255)
    age = models.IntegerField()
    gender = models.CharField(max_length=20)
    phone = models.CharField(max_length=50)
    email = models.EmailField(blank=True, null=True)
    date_of_birth = models.CharField(max_length=50, blank=True, null=True)
    blood_group = models.CharField(max_length=10)
    address = models.TextField()
    emergency_contact_name = models.CharField(max_length=255, blank=True, null=True)
    emergency_contact_phone = models.CharField(max_length=50, blank=True, null=True)
    emergency_contact_relation = models.CharField(max_length=100, blank=True, null=True)
    allergies = models.JSONField(default=list, blank=True)
    medical_history = models.JSONField(default=list, blank=True)
    registered_date = models.CharField(max_length=50, blank=True, null=True)
    assigned_doctor_id = models.CharField(max_length=50, blank=True, null=True)
    assigned_doctor_name = models.CharField(max_length=255, blank=True, null=True)
    room_bed_number = models.CharField(max_length=50, blank=True, null=True)
    vitals = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, default='Outpatient')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['hospital', 'email'],
                name='unique_patient_hospital_email'
            ),
        ]

    def __str__(self):
        return self.name


class Doctor(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='doctors')
    name = models.CharField(max_length=255)
    department = models.CharField(max_length=100)
    department_id = models.CharField(max_length=50, blank=True, null=True)
    department_name = models.CharField(max_length=255, blank=True, null=True)
    specialization = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    qualifications = models.TextField(blank=True, null=True)
    experience_years = models.IntegerField(default=0)
    available_hours = models.CharField(max_length=100, blank=True, null=True)
    available_days = models.JSONField(default=list, blank=True)
    opd_room_id = models.CharField(max_length=50, blank=True, null=True)
    opd_room_name = models.CharField(max_length=255, blank=True, null=True)
    room_number = models.CharField(max_length=100, blank=True, null=True)
    avatar_url = models.TextField(blank=True, null=True)
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    availability_status = models.CharField(max_length=20, default='Available')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Appointment(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='appointments')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    date = models.DateField()
    time = models.CharField(max_length=20)
    type = models.CharField(max_length=50, default='General Checkup')
    status = models.CharField(max_length=20, default='Scheduled')
    notes = models.TextField(blank=True, null=True)
    opd_room_id = models.CharField(max_length=50, blank=True, null=True)
    opd_room_name = models.CharField(max_length=255, blank=True, null=True)
    reason = models.TextField(blank=True, null=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    consultation_started_at = models.DateTimeField(null=True, blank=True)
    consultation_completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.patient.name}"


class Consultation(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='consultations')
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='consultations', null=True, blank=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='consultations')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='consultations')
    doctor_name = models.CharField(max_length=255)
    patient_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, default='Draft')  # Draft, Finalized
    chief_complaint = models.TextField(blank=True, null=True)
    symptoms = models.TextField(blank=True, null=True)
    examination = models.TextField(blank=True, null=True)
    vitals = models.JSONField(default=dict, blank=True)
    diagnosis = models.TextField(blank=True, null=True)
    treatment_plan = models.TextField(blank=True, null=True)
    prescription_items = models.JSONField(default=list, blank=True)
    follow_up_instructions = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    started_at = models.DateTimeField(auto_now_add=True)
    finalized_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f"Consultation {self.id} - {self.patient_name} ({self.status})"


class Admission(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='admissions')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='admissions')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='admissions')
    room_number = models.CharField(max_length=50)
    bed_number = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='Admitted')
    admission_date = models.DateField()
    discharge_date = models.DateField(null=True, blank=True)
    diagnosis = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.id} - {self.patient.name}"


class BillingInvoice(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='invoices')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='invoices')
    patient_name = models.CharField(max_length=255)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=20, default='Pending')
    due_date = models.DateField()
    items = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.patient_name}"


class PharmacyMedicine(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='medicines')
    medicine_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    stock_quantity = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    expiry_date = models.DateField()
    status = models.CharField(max_length=20, default='In Stock')

    def __str__(self):
        return self.medicine_name


class Prescription(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='prescriptions')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='prescriptions')
    doctor_name = models.CharField(max_length=255)
    date = models.DateField()
    status = models.CharField(max_length=20, default='Active')
    medicines = models.JSONField(default=list)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.id} - {self.patient.name}"


class LabOrder(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='lab_orders')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='lab_orders')
    doctor_name = models.CharField(max_length=255)
    test_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='Pending')
    result = models.TextField(blank=True, null=True)
    report_url = models.URLField(max_length=500, blank=True, null=True)
    test_date = models.DateField()

    def __str__(self):
        return f"{self.id} - {self.test_name}"


class AmbulanceDriver(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='ambulance_drivers')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    license_number = models.CharField(max_length=50)
    assigned_ambulance_reg = models.CharField(max_length=50)
    availability_status = models.CharField(max_length=30, default='On Duty & Available')
    completed_trips = models.IntegerField(default=0)

    def __str__(self):
        return self.name


class EmergencyRequest(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='emergency_requests')
    patient_name = models.CharField(max_length=255)
    patient_phone = models.CharField(max_length=50)
    pickup_location = models.TextField()
    destination_hospital = models.CharField(max_length=255)
    emergency_type = models.CharField(max_length=100)
    priority = models.CharField(max_length=30, default='CRITICAL / CODE BLUE')
    status = models.CharField(max_length=30, default='Dispatched')
    assigned_driver = models.ForeignKey(AmbulanceDriver, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests')
    chief_complaint = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.emergency_type}"


class SubscriptionPlan(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='subscription')
    plan_name = models.CharField(max_length=100, default='Enterprise Tier')
    monthly_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='Active')
    start_date = models.DateField()
    renewal_date = models.DateField()

    def __str__(self):
        return f"{self.hospital.name} ({self.plan_name})"


class HospitalWebsite(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='website')
    hero_title = models.CharField(max_length=255)
    hero_subtitle = models.TextField()
    primary_color = models.CharField(max_length=20, default='#0d9488')
    features = models.JSONField(default=list)
    testimonials = models.JSONField(default=list)
    is_published = models.BooleanField(default=True)

    def __str__(self):
        return f"Website for {self.hospital.name}"


class WebsiteSection(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    website = models.ForeignKey(HospitalWebsite, on_delete=models.CASCADE, related_name='sections', null=True, blank=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='website_sections')
    section_type = models.CharField(max_length=50)
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True, null=True)
    content = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    display_order = models.FloatField(default=1.0)
    is_enabled = models.BooleanField(default=True)
    settings = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order']

    def __str__(self):
        return f"{self.hospital.name} - {self.section_type} ({self.title})"


class DoctorSchedule(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='doctor_schedules')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')
    department_id = models.CharField(max_length=50, blank=True, null=True)
    department_name = models.CharField(max_length=255, blank=True, null=True)
    opd_room_id = models.CharField(max_length=50, blank=True, null=True)
    opd_room_name = models.CharField(max_length=255, blank=True, null=True)
    working_days = models.JSONField(default=list)
    consultation_start_time = models.CharField(max_length=20, default='09:00 AM')
    consultation_end_time = models.CharField(max_length=20, default='05:00 PM')
    slot_duration_minutes = models.IntegerField(default=30)
    breaks = models.JSONField(default=list)
    effective_start_date = models.DateField(default='2026-01-01')
    effective_end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Schedule: {self.doctor.name} ({self.hospital.name})"


class DoctorUnavailablePeriod(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='doctor_unavailabilities')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='unavailabilities')
    period_type = models.CharField(max_length=50, default='Leave')
    title = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    start_time = models.CharField(max_length=20, blank=True, null=True)
    end_time = models.CharField(max_length=20, blank=True, null=True)
    is_all_day = models.BooleanField(default=True)
    reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.period_type}: {self.doctor.name} ({self.start_date} to {self.end_date})"


class AppointmentSettings(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='appointment_settings')
    max_advance_booking_days = models.IntegerField(default=30)
    min_advance_booking_hours = models.IntegerField(default=2)
    cancellation_deadline_hours = models.IntegerField(default=4)
    rescheduling_deadline_hours = models.IntegerField(default=4)
    appointment_buffer_minutes = models.IntegerField(default=5)
    allow_same_day_booking = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Appointment Settings: {self.hospital.name}"


class SupportTicket(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='support_tickets')
    hospital_name = models.CharField(max_length=255, blank=True, null=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    category = models.CharField(
        max_length=50,
        choices=[
            ('Technical', 'Technical'),
            ('Billing', 'Billing'),
            ('Feature Request', 'Feature Request'),
            ('Clinical Workflow', 'Clinical Workflow'),
            ('Integration', 'Integration'),
        ],
        default='Technical'
    )
    priority = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('urgent', 'Urgent'),
        ],
        default='medium'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('open', 'Open'),
            ('in_progress', 'In Progress'),
            ('resolved', 'Resolved'),
            ('closed', 'Closed'),
        ],
        default='open'
    )
    requester_name = models.CharField(max_length=255)
    requester_email = models.EmailField()
    assigned_to = models.CharField(max_length=255, blank=True, null=True)
    messages = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.id}: {self.title} ({self.hospital_name or self.hospital_id})"


class Department(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    head_doctor_id = models.CharField(max_length=50, blank=True, null=True)
    head_doctor_name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, default='')
    phone_extension = models.CharField(max_length=50, blank=True, default='')
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class OPDRoom(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='opd_rooms')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    department_id = models.CharField(max_length=50, blank=True, null=True)
    department_name = models.CharField(max_length=255, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, default='Available')
    description = models.TextField(blank=True, default='')
    assigned_doctor_id = models.CharField(max_length=50, blank=True, null=True)
    assigned_doctor_name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Ward(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='wards')
    name = models.CharField(max_length=255)
    ward_type = models.CharField(max_length=100, default='General Ward')
    floor = models.CharField(max_length=50, default='1st Floor')
    department_name = models.CharField(max_length=255, blank=True, default='General Medicine')
    description = models.TextField(blank=True, default='')
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.ward_type})"


class Bed(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='beds')
    ward_id = models.CharField(max_length=50, blank=True, null=True)
    ward_name = models.CharField(max_length=255, blank=True, default='')
    bed_number = models.CharField(max_length=50)
    ward_type = models.CharField(max_length=100, default='General Ward')
    floor = models.CharField(max_length=50, default='1st Floor')
    status = models.CharField(max_length=20, default='Available')
    current_patient_id = models.CharField(max_length=50, blank=True, null=True)
    current_patient_name = models.CharField(max_length=255, blank=True, null=True)
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, default=1000.00)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.bed_number} ({self.status})"


class Staff(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='staff')
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, default='')
    role = models.CharField(max_length=50, default='Staff')
    system_role = models.CharField(max_length=50, default='staff')
    department = models.CharField(max_length=100, blank=True, default='General')
    shift = models.CharField(max_length=50, default='Morning')
    joining_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, default='active')
    avatar_url = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.role})"


class ActivityLog(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='activity_logs', null=True, blank=True)
    actor_name = models.CharField(max_length=255, default='Staff')
    actor_role = models.CharField(max_length=100, default='Hospital User')
    action = models.CharField(max_length=255)
    target = models.CharField(max_length=255, blank=True, default='')
    type = models.CharField(max_length=50, default='system')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.actor_name} - {self.action} ({self.timestamp})"


class SalesLead(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    designation = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=50)
    email = models.EmailField()
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    hospital_type = models.CharField(max_length=100, default='General')
    bed_count = models.IntegerField(default=50)
    lead_source = models.CharField(max_length=100, default='Direct')
    interested_plan = models.CharField(max_length=100, default='basic')
    status = models.CharField(max_length=50, default='New')
    assigned_sales_executive_id = models.CharField(max_length=50, blank=True, default='')
    assigned_sales_executive_name = models.CharField(max_length=255, blank=True, default='')
    next_follow_up_date = models.DateField(null=True, blank=True)
    expected_decision_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.hospital_name} ({self.status})"


class Ambulance(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='ambulances')
    reg_number = models.CharField(max_length=50)
    type = models.CharField(max_length=50, default='Advanced Life Support (ALS)')
    model = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='Available')
    mileage_km = models.IntegerField(default=0)
    fuel_level = models.IntegerField(default=100)
    equipment_category = models.CharField(max_length=100, default='Class A (Critical Telemetry)')
    current_location = models.CharField(max_length=255, default='Base Station')
    assigned_driver = models.ForeignKey('AmbulanceDriver', on_delete=models.SET_NULL, null=True, blank=True, related_name='ambulances')
    assigned_driver_name = models.CharField(max_length=100, blank=True, null=True)
    driver_phone = models.CharField(max_length=50, blank=True, null=True)
    last_maintenance_date = models.DateField(null=True, blank=True)
    next_maintenance_date = models.DateField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reg_number} ({self.model})"


class AmbulanceMaintenance(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='ambulance_maintenances')
    ambulance = models.ForeignKey(Ambulance, on_delete=models.CASCADE, related_name='maintenances', null=True, blank=True)
    ambulance_reg = models.CharField(max_length=50)
    service_date = models.DateField()
    category = models.CharField(max_length=50, default='Preventive')
    maintenance_status = models.CharField(max_length=50, default='Scheduled')
    service_type = models.CharField(max_length=100)
    serviced_by = models.CharField(max_length=100)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    parts_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    labour_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    other_charges = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    reported_issue = models.TextField(blank=True, null=True)
    parts_replaced = models.TextField(blank=True, null=True)
    technician_name = models.CharField(max_length=100, blank=True, null=True)
    next_service_date = models.DateField(null=True, blank=True)
    vehicle_availability = models.CharField(max_length=50, default='Available')
    safety_inspection_result = models.CharField(max_length=50, default='Passed')
    return_to_service_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.ambulance_reg}"


class AmbulanceTrip(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='ambulance_trips')
    request_id = models.CharField(max_length=50, blank=True, null=True)
    ambulance_id = models.CharField(max_length=50, blank=True, null=True)
    ambulance_reg = models.CharField(max_length=50, blank=True, null=True)
    driver_id = models.CharField(max_length=50, blank=True, null=True)
    driver_name = models.CharField(max_length=100, blank=True, null=True)
    patient_name = models.CharField(max_length=100)
    patient_phone = models.CharField(max_length=50, blank=True, null=True)
    pickup_address = models.TextField()
    destination = models.TextField()
    status = models.CharField(max_length=50, default='Dispatched')
    start_time = models.CharField(max_length=50, blank=True, null=True)
    pickup_time = models.CharField(max_length=50, blank=True, null=True)
    hospital_arrival_time = models.CharField(max_length=50, blank=True, null=True)
    end_time = models.CharField(max_length=50, blank=True, null=True)
    distance_km = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    paramedic_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.patient_name}"


class PatientAppointmentRequest(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='appointment_requests')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointment_requests', null=True, blank=True)
    patient_name = models.CharField(max_length=100)
    patient_phone = models.CharField(max_length=50)
    patient_age = models.IntegerField(null=True, blank=True)
    patient_gender = models.CharField(max_length=20, blank=True, null=True)
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True, related_name='patient_requests')
    doctor_name = models.CharField(max_length=100)
    doctor_specialization = models.CharField(max_length=100, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointment_requests')
    department_name = models.CharField(max_length=100, blank=True, null=True)
    preferred_date = models.DateField()
    preferred_time = models.CharField(max_length=50)
    type = models.CharField(max_length=50, default='Consultation')
    reason = models.TextField()
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='Pending')
    receptionist_note = models.TextField(blank=True, null=True)
    responded_by = models.CharField(max_length=100, blank=True, null=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.patient_name} -> {self.doctor_name}"


class LabTestCatalog(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='lab_test_catalog')
    test_name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)
    category = models.CharField(max_length=100, default='Biochemistry')
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    turnaround_hours = models.IntegerField(default=24)
    sample_type = models.CharField(max_length=100, default='Blood')
    tube_color = models.CharField(max_length=100, blank=True, null=True)
    normal_range = models.CharField(max_length=255, blank=True, null=True)
    parameters = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.test_name} ({self.code})"


class CouponCode(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    code = models.CharField(max_length=50, unique=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    valid_until = models.DateField(null=True, blank=True)
    max_uses = models.IntegerField(null=True, blank=True)
    used_count = models.IntegerField(default=0)
    used_by_hospitals = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} ({self.discount_percentage}%)"


class BranchCreationRequest(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    organization_id = models.CharField(max_length=50)
    organization_name = models.CharField(max_length=255)
    branch_name = models.CharField(max_length=255)
    branch_code = models.CharField(max_length=50)
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    contact_person = models.CharField(max_length=255)
    contact_phone = models.CharField(max_length=50)
    contact_email = models.EmailField()
    description = models.TextField(blank=True, default='')
    branch_admin_name = models.CharField(max_length=255)
    branch_admin_email = models.EmailField()
    branch_admin_phone = models.CharField(max_length=50, blank=True, default='')
    status = models.CharField(max_length=50, default='pending')
    created_hospital_id = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.branch_name} ({self.status})"


class AdmissionRequest(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='admission_requests')
    consultation_id = models.CharField(max_length=50, blank=True, null=True)
    appointment_id = models.CharField(max_length=50, blank=True, null=True)
    patient_id = models.CharField(max_length=50)
    patient_name = models.CharField(max_length=255)
    patient_phone = models.CharField(max_length=50, blank=True, default='')
    patient_age = models.IntegerField(null=True, blank=True)
    patient_gender = models.CharField(max_length=20, blank=True, null=True)
    doctor_id = models.CharField(max_length=50)
    doctor_name = models.CharField(max_length=255)
    department_name = models.CharField(max_length=100, blank=True, default='')
    recommended_ward_type = models.CharField(max_length=100, default='General Ward')
    priority = models.CharField(max_length=50, default='Normal')
    reason = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=50, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.patient_name} ({self.status})"


class FollowUpRequest(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='follow_up_requests')
    consultation_id = models.CharField(max_length=50)
    original_appointment_id = models.CharField(max_length=50)
    patient_id = models.CharField(max_length=50)
    patient_name = models.CharField(max_length=255)
    patient_phone = models.CharField(max_length=50)
    patient_age = models.IntegerField(null=True, blank=True)
    patient_gender = models.CharField(max_length=20, blank=True, null=True)
    doctor_id = models.CharField(max_length=50)
    doctor_name = models.CharField(max_length=255)
    department_id = models.CharField(max_length=50, blank=True, null=True)
    department_name = models.CharField(max_length=100)
    suggested_date = models.DateField()
    interval_days = models.IntegerField(null=True, blank=True)
    reason = models.TextField(blank=True, default='')
    instructions = models.TextField(blank=True, default='')
    status = models.CharField(max_length=50, default='Scheduled')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.patient_name} -> {self.doctor_name}"


class LeadFollowUp(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    lead_id = models.CharField(max_length=50)
    lead_hospital_name = models.CharField(max_length=255, blank=True, default='')
    lead_contact_person = models.CharField(max_length=255, blank=True, default='')
    assigned_to = models.CharField(max_length=50)
    date = models.DateField()
    time = models.CharField(max_length=50, blank=True, null=True)
    type = models.CharField(max_length=50, default='Call')
    notes = models.TextField(blank=True, default='')
    status = models.CharField(max_length=50, default='Pending')
    reminder = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - Lead {self.lead_id} ({self.status})"


class LeadActivity(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    lead_id = models.CharField(max_length=50)
    type = models.CharField(max_length=50, default='Note')
    description = models.TextField(blank=True, default='')
    created_by = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.lead_id}: {self.type}"


class ConvertedCustomer(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    lead_id = models.CharField(max_length=50)
    hospital_id = models.CharField(max_length=50)
    hospital_name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    converted_by = models.CharField(max_length=255)
    converted_by_name = models.CharField(max_length=255, blank=True, default='')
    converted_at = models.DateTimeField(null=True, blank=True)
    interested_plan = models.CharField(max_length=100, default='basic')
    subscription_status = models.CharField(max_length=50, default='Trial')
    hospital_admin_status = models.CharField(max_length=50, default='Created')
    onboarding_status = models.CharField(max_length=50, default='Pending Onboarding')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.hospital_name} ({self.onboarding_status})"


class PatientTestimonial(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='testimonials')
    patient_name = models.CharField(max_length=255)
    patient_role = models.CharField(max_length=100, blank=True, default='')
    avatar_url = models.TextField(blank=True, null=True)
    rating = models.IntegerField(default=5)
    headline = models.CharField(max_length=255, blank=True, default='')
    review_text = models.TextField()
    verified = models.BooleanField(default=True)
    date = models.CharField(max_length=50, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient_name} - {self.rating} stars"


class HospitalSetting(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='custom_settings')
    data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Settings for {self.hospital_id}"


class PlatformSetting(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default='global')
    data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Platform Settings ({self.id})"





