from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    OrganizationViewSet,
    HospitalViewSet,
    UserProfileViewSet,
    PatientViewSet,
    DoctorViewSet,
    AppointmentViewSet,
    AdmissionViewSet,
    BillingInvoiceViewSet,
    PharmacyMedicineViewSet,
    PrescriptionViewSet,
    LabOrderViewSet,
    AmbulanceDriverViewSet,
    EmergencyRequestViewSet,
    SubscriptionPlanViewSet,
    HospitalWebsiteViewSet,
    WebsiteSectionViewSet,
    DoctorScheduleViewSet,
    DoctorUnavailablePeriodViewSet,
    AppointmentSettingsViewSet,
    ConsultationViewSet,
    SupportTicketViewSet,
    DepartmentViewSet,
    OPDRoomViewSet,
    WardViewSet,
    BedViewSet,
    StaffViewSet,
    ActivityLogViewSet,
    SalesLeadViewSet,
    AmbulanceViewSet,
    AmbulanceMaintenanceViewSet,
    AmbulanceTripViewSet,
    PatientAppointmentRequestViewSet,
    LabTestCatalogViewSet,
    CouponCodeViewSet,
    BranchCreationRequestViewSet,
    AdmissionRequestViewSet,
    FollowUpRequestViewSet,
    LeadFollowUpViewSet,
    LeadActivityViewSet,
    ConvertedCustomerViewSet,
    PatientTestimonialViewSet,
    HospitalSettingViewSet,
    PlatformSettingViewSet,
    auth_login,
)

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet)
router.register(r'hospitals', HospitalViewSet)
router.register(r'users', UserProfileViewSet)
router.register(r'patients', PatientViewSet)
router.register(r'doctors', DoctorViewSet)
router.register(r'appointments', AppointmentViewSet)
router.register(r'consultations', ConsultationViewSet)
router.register(r'support-tickets', SupportTicketViewSet)
router.register(r'doctor-schedules', DoctorScheduleViewSet)
router.register(r'doctor-unavailability', DoctorUnavailablePeriodViewSet)
router.register(r'appointment-settings', AppointmentSettingsViewSet)
router.register(r'admissions', AdmissionViewSet)
router.register(r'invoices', BillingInvoiceViewSet)
router.register(r'medicines', PharmacyMedicineViewSet)
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'lab-orders', LabOrderViewSet)
router.register(r'drivers', AmbulanceDriverViewSet)
router.register(r'emergency-requests', EmergencyRequestViewSet)
router.register(r'subscriptions', SubscriptionPlanViewSet)
router.register(r'websites', HospitalWebsiteViewSet)
router.register(r'website-sections', WebsiteSectionViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'opd-rooms', OPDRoomViewSet)
router.register(r'wards', WardViewSet)
router.register(r'beds', BedViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'activity-logs', ActivityLogViewSet)
router.register(r'sales-leads', SalesLeadViewSet)
router.register(r'ambulances', AmbulanceViewSet)
router.register(r'ambulance-maintenance', AmbulanceMaintenanceViewSet)
router.register(r'ambulance-trips', AmbulanceTripViewSet)
router.register(r'appointment-requests', PatientAppointmentRequestViewSet)
router.register(r'lab-catalog', LabTestCatalogViewSet)
router.register(r'coupons', CouponCodeViewSet)
router.register(r'branch-requests', BranchCreationRequestViewSet)
router.register(r'admission-requests', AdmissionRequestViewSet)
router.register(r'follow-up-requests', FollowUpRequestViewSet)
router.register(r'lead-followups', LeadFollowUpViewSet)
router.register(r'lead-activities', LeadActivityViewSet)
router.register(r'converted-customers', ConvertedCustomerViewSet)
router.register(r'testimonials', PatientTestimonialViewSet)
router.register(r'hospital-settings', HospitalSettingViewSet)
router.register(r'platform-settings', PlatformSettingViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', auth_login, name='auth_login'),
]
