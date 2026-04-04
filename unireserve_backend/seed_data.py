import os
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'unireserve_backend.settings')
django.setup()

from facilities.models import Facility, FacilitySlot
from accounts.models import CustomUser

def seed_data():
    print("Seeding database with initial facilities and slots...")
    
    # 1. Ensure a manager exists
    manager, created = CustomUser.objects.get_or_create(
        email='manager@unireserve.edu',
        defaults={
            'name': 'Bob Manager',
            'role': 'manager',
            'account_status': 'active',
            'is_active': True,
            'is_staff': True
        }
    )
    if created:
        manager.set_password('Password123')
        manager.save()
    
    # 2. Standard Facilities
    facility_data = [
        {
            'name': 'Main Library - Quiet Zone',
            'type': 'library',
            'location': 'Level 2, West Wing',
            'description': 'A silent reading area with high-speed internet and power outlets.',
            'capacity_per_slot': 50,
            'manager': manager
        },
        {
            'name': 'Advanced Computing Lab',
            'type': 'computer_lab',
            'location': 'Tower A, Floor 4',
            'description': 'Equipped with high-end workstations and GPU support for research.',
            'capacity_per_slot': 30,
            'manager': manager
        },
        {
            'name': 'Indoor Sports Arena',
            'type': 'discussion', 
            'location': 'Student Activity Center',
            'description': 'Multi-purpose court for badminton and table tennis.',
            'capacity_per_slot': 10,
            'manager': manager
        },
        {
            'name': 'Creative Arts Studio',
            'type': 'music',
            'location': 'Arts Block, Room 12',
            'description': 'Sound-proof room for music practice and recording.',
            'capacity_per_slot': 5,
            'manager': manager
        }
    ]

    facilities = []
    for data in facility_data:
        f, created = Facility.objects.get_or_create(
            name=data['name'],
            defaults=data
        )
        facilities.append(f)
        if created:
            print(f"Created facility: {f.name}")
        else:
            print(f"Facility already exists: {f.name}")

    # 3. Create Slots
    now = timezone.now()
    dates = [now.date(), (now + timedelta(days=1)).date()]
    
    times = [
        ('09:00', '10:00'),
        ('10:00', '11:00'),
        ('11:00', '12:00'),
        ('14:00', '15:00'),
        ('15:00', '16:00'),
    ]

    for f in facilities:
        for d in dates:
            for start, end in times:
                FacilitySlot.objects.get_or_create(
                    facility=f,
                    date=d,
                    start_time=start,
                    end_time=end,
                    defaults={'capacity': f.capacity_per_slot}
                )
    
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_data()
