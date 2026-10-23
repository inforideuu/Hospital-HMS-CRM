from django.core.management.base import BaseCommand
from api.models import UserProfile

class Command(BaseCommand):
    help = 'Seed the database with platform superadmin credentials'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Seeding platform superadmin accounts...'))

        superadmins = [
            ('usr-superadmin', 'superadmin@pulse-crm.com', 'Platform Admin', 'super_admin', 'SuperAdmin@2026'),
            ('USR-ADMIN-CORE', 'admin@pulsecore.com', 'Platform Super Admin', 'super_admin', 'SuperAdmin@2026'),
            ('USR-PLAT-01', 'superadmin@pulsecore.io', 'Sarah Jenkins', 'super_admin', 'SuperAdmin@2026'),
            ('usr-manager', 'manager@pulse-crm.com', 'Platform Manager', 'superadmin_manager', 'Manager@2026'),
            ('USR-PLAT-02', 'manager@pulsecore.io', 'David Thorne', 'superadmin_manager', 'Manager@2026'),
        ]

        for uid, email, name, role, pwd in superadmins:
            u, created = UserProfile.objects.update_or_create(
                id=uid,
                defaults={
                    'name': name,
                    'email': email,
                    'role': role,
                    'portal': 'platform',
                    'hospital': None,
                    'hospital_name': None,
                    'status': 'active',
                }
            )
            u.set_password(pwd)
            u.save()
            action = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f"{action} Superadmin: {email} ({role})"))

        self.stdout.write(self.style.SUCCESS('Platform superadmin accounts successfully configured!'))
