from django.db.models import Count, Avg, F
from django.utils import timezone
from datetime import timedelta
from .models import Booking, BookingRule
from facilities.models import FacilitySlot, Facility
from django.db.models.functions import ExtractHour

class RecommendationService:
    @staticmethod
    def get_recommendations(user):
        """
        1. Analyze last 30 days of user's active/attended bookings.
        2. Identify top 3 most-booked facility types.
        3. Identify preferred booking hour (average start time).
        4. Suggest slots for those types in the next 24 hours with lowest occupancy.
        """
        one_month_ago = timezone.now() - timedelta(days=30)
        
        # 1 & 2. Get top 3 facility types for this user
        preferred_types = Booking.objects.filter(
            user=user,
            created_at__gte=one_month_ago,
            status__in=['active', 'attended']
        ).values(
            type=F('slot__facility__type')
        ).annotate(
            usage_count=Count('id')
        ).order_by('-usage_count')[:3]

        type_list = [item['type'] for item in preferred_types]

        # 3. Preferred hour (simple average of start hours)
        # Handle cases with no history by defaulting to a generic "Peak"
        history = Booking.objects.filter(user=user, status__in=['active', 'attended'])
        if history.exists():
            avg_hour = history.annotate(
                start_hour=ExtractHour('slot__start_time')
            ).aggregate(Avg('start_hour'))['start_hour__avg'] or 10
        else:
            avg_hour = 10 # Default to 10 AM for new users

        # 4. Find matching slots in the next 24 hours
        tomorrow = timezone.now() + timedelta(days=1)
        
        # Base query for upcoming slots
        upcoming_slots = FacilitySlot.objects.filter(
            date__range=[timezone.now().date(), tomorrow.date()],
            is_blocked=False
        ).select_related('facility')

        recommendations = []
        
        # If user has no history, show "Quiet Right Now" global top 3
        if not type_list:
            global_quiet_slots = upcoming_slots.filter(
                current_bookings__lt=F('capacity') * 0.5 # Green status
            ).order_by('current_bookings')[:3]
            
            for slot in global_quiet_slots:
                recommendations.append({
                    'slot': slot,
                    'reason': "Quiet right now! Great time to explore campus."
                })
        else:
            for fac_type in type_list:
                # Find the quietest slot for this type closest to user's preferred hour
                best_slot = upcoming_slots.filter(
                    facility__type=fac_type,
                    current_bookings__lt=F('capacity') * 0.5 # Green status only
                ).annotate(
                    hour_diff=(ExtractHour('start_time') - avg_hour)
                ).order_by('current_bookings', 'hour_diff').first()

                if best_slot:
                    recommendations.append({
                        'slot': best_slot,
                        'reason': f"Matches your {best_slot.facility.get_type_display()} preference."
                    })

        return recommendations[:3]
