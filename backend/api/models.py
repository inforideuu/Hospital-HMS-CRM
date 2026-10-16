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


class UserProfile(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=50)  # super_admin, hospital_admin, doctor, receptionist, nurse, accountant, pharmacist, lab_technician, ambulance_driver, patient
    portal = models.CharField(max_length=50) # platform, hospital, patient, ambulance_driver
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    hospital_name = models.CharField(max_length=255, blank=True, null=True)
    organization = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    is_organization_admin = models.BooleanField(default=False)
    permitted_branch_ids = models.JSONField(default=list, blank=True)
    patient_id = models.CharField(max_length=50, blank=True, null=True)
    driver_id = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.role})"


class Patient(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='patients')
    name = models.CharField(max_length=255)
    age = models.IntegerField()
    gender = models.CharField(max_length=20)
    phone = models.CharField(max_length=50)
    email = models.EmailField(blank=True, null=True)
    blood_group = models.CharField(max_length=10)
    address = models.TextField()
    medical_history = models.JSONField(default=list, blank=True)
    vitals = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, default='Outpatient')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Doctor(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='doctors')
    name = models.CharField(max_length=255)
    department = models.CharField(max_length=100)
    specialization = models.CharField(max_length=255)
    phone = models.CharField(max_length=50)
    email = models.EmailField()
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
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.id} - {self.patient.name}"


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

