import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_hms_backend.settings')
django.setup()

from api.models import Hospital, WebsiteSection

hospitals = list(Hospital.objects.all())

def seed_sections_for(hosp):
    base_sections = [
        {
            'section_type': 'hero',
            'title': f'World-Class Medical Care & OPD Excellence at {hosp.name}',
            'subtitle': f'Leading Healthcare Innovation in {hosp.city}',
            'content': 'Experience 24/7 tertiary care, interventional cardiology, advanced neurosurgery, and dedicated patient-first clinical services.',
            'image_url': '/light_hero_bg_1790313418511.jpg',
            'display_order': 1.0,
            'is_enabled': True,
            'settings': {'buttonText': 'Schedule Telehealth / OPD Visit', 'buttonLink': '#booking'}
        },
        {
            'section_type': 'about',
            'title': f'About {hosp.name}',
            'subtitle': 'Over 25 Years of Healing Communities',
            'content': f'{hosp.name} is a JCI-accredited {hosp.beds_count}-bed multi-specialty institution equipped with modular surgical suites, 24/7 cardiac ICU, and automated pathology labs.',
            'image_url': '/card_hospital_hms_1790313910509.jpg',
            'display_order': 2.0,
            'is_enabled': True,
            'settings': {}
        },
        {
            'section_type': 'services',
            'title': 'Clinical Services & Centers of Excellence',
            'subtitle': 'Comprehensive Multidisciplinary Care',
            'content': 'Interventional Cardiology, Stroke Unit & Neurosurgery, Robotic Surgery, Emergency & Trauma, Pediatric ICU, and Oncology.',
            'image_url': '',
            'display_order': 3.0,
            'is_enabled': True,
            'settings': {}
        },
        {
            'section_type': 'departments',
            'title': 'Hospital Clinical Departments',
            'subtitle': 'Specialized Clinical Faculties',
            'content': '',
            'image_url': '',
            'display_order': 4.0,
            'is_enabled': True,
            'settings': {}
        },
        {
            'section_type': 'doctors',
            'title': 'Our Specialist Physicians',
            'subtitle': 'Board-Certified Medical Faculty',
            'content': '',
            'image_url': '',
            'display_order': 5.0,
            'is_enabled': True,
            'settings': {}
        },
        {
            'section_type': 'facilities',
            'title': 'Hospital Facilities & Infrastructure',
            'subtitle': 'State-of-the-art Medical Technology',
            'content': '',
            'image_url': '',
            'display_order': 6.0,
            'is_enabled': True,
            'settings': {}
        },
        {
            'section_type': 'appointment_cta',
            'title': 'Need Immediate Medical Consultation?',
            'subtitle': 'Book Your OPD Consultation Online in Seconds',
            'content': 'Choose your preferred specialist, select convenient timeslots, and receive digital appointment confirmations.',
            'image_url': '',
            'display_order': 7.0,
            'is_enabled': True,
            'settings': {'buttonText': 'Book Appointment Now'}
        },
        {
            'section_type': 'branches',
            'title': 'Our Hospital Branches & Healthcare Network',
            'subtitle': 'Delivering Clinical Excellence Across Regional Locations',
            'content': 'Access our advanced healthcare network, specialized clinical departments, and 24/7 emergency response across all regional branch campuses.',
            'image_url': '',
            'display_order': 8.0,
            'is_enabled': True,
            'settings': {
                'branchCardCount': 3,
                'branchCard1Title': f'{hosp.name} (Flagship Campus)',
                'branchCard1Location': hosp.address,
                'branchCard1Desc': 'Flagship tertiary hospital featuring 24/7 Level-1 trauma care, interventional cardiology, and inpatient beds.',
                'branchCard1Img': 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
                'branchCard1Link': f'/hospital/{hosp.id}',
                'branchCard1Phone': hosp.phone,
                'branchCard2Title': f'{hosp.name} Bangalore Hospital',
                'branchCard2Location': '88 Hosur Road, Koramangala 5th Block, Bengaluru, Karnataka',
                'branchCard2Desc': 'Comprehensive multispecialty hospital with robotic surgery, pediatric ICU, and day surgery suites.',
                'branchCard2Img': 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
                'branchCard2Link': f'/hospital/{hosp.id}-blr',
                'branchCard2Phone': '+91 80 4123 4567',
                'branchCard3Title': f'{hosp.name} Hyderabad Medical Center',
                'branchCard3Location': '12 Cyber Hills, HITEC City, Hyderabad, Telangana',
                'branchCard3Desc': 'Specialized digital diagnostic center and orthopedic institute providing advanced joint replacement.',
                'branchCard3Img': 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80',
                'branchCard3Link': f'/hospital/{hosp.id}-hyd',
                'branchCard3Phone': '+91 40 6789 1234'
            }
        },
        {
            'section_type': 'contact',
            'title': f'Contact {hosp.name} Front Desk & Emergency',
            'subtitle': f'Emergency Line: {hosp.phone} • 24/7 Front Desk',
            'content': hosp.address,
            'image_url': '',
            'display_order': 9.0,
            'is_enabled': True,
            'settings': {}
        },
        {
            'section_type': 'footer',
            'title': hosp.name,
            'subtitle': f'© 2026 {hosp.name}. All Rights Reserved.',
            'content': '',
            'image_url': '',
            'display_order': 10.0,
            'is_enabled': True,
            'settings': {}
        }
    ]
    for s in base_sections:
        sec_id = f'SEC-{s["section_type"].upper()}-{hosp.id}'
        WebsiteSection.objects.update_or_create(
            id=sec_id,
            defaults={
                'hospital': hosp,
                'section_type': s['section_type'],
                'title': s['title'],
                'subtitle': s['subtitle'],
                'content': s['content'],
                'image_url': s['image_url'],
                'display_order': s['display_order'],
                'is_enabled': s['is_enabled'],
                'settings': s['settings']
            }
        )

for h in hospitals:
    seed_sections_for(h)

print(f"Successfully seeded {WebsiteSection.objects.count()} website sections in MySQL database.")
