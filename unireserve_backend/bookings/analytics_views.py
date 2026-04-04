from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import Booking
from facilities.models import Facility

class ManagerAnalyticsView(APIView):
    """
    Manager-level analytics for their assigned facilities.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('manager', 'admin'):
            return Response({"error": "Unauthorized"}, status=403)

        facility_id = request.query_params.get('facility_id')
        now = timezone.now()
        last_7_days = now - timedelta(days=7)

        base_query = Booking.objects.all()

        if request.user.role == 'manager':
            base_query = base_query.filter(slot__facility__manager=request.user)

        if facility_id:
            base_query = base_query.filter(slot__facility_id=facility_id)

        stats = base_query.filter(created_at__gte=last_7_days).aggregate(
            total=Count('id'),
            attended=Count('id', filter=Q(status='attended')),
            no_shows=Count('id', filter=Q(status='no_show')),
            cancelled=Count('id', filter=Q(status='cancelled'))
        )

        daily_trends = []
        for i in range(7):
            day = now.date() - timedelta(days=i)
            day_count = base_query.filter(slot__date=day).count()
            daily_trends.append({
                "date": day.strftime("%b %d"),
                "bookings": day_count
            })
        daily_trends.reverse()

        status_data = [
            {"name": "Attended", "value": stats['attended']},
            {"name": "No-Shows", "value": stats['no_shows']},
            {"name": "Cancelled", "value": stats['cancelled']},
            {
                "name": "Active",
                "value": max(0, stats['total'] - (stats['attended'] + stats['no_shows'] + stats['cancelled']))
            }
        ]

        heatmap = base_query.values('slot__start_time').annotate(count=Count('id')).order_by('slot__start_time')
        heatmap_data = [
            {"hour": h['slot__start_time'].strftime("%H:%M"), "count": h['count']}
            for h in heatmap
        ]

        return Response({
            "kpis": stats,
            "daily_trends": daily_trends,
            "status_distribution": status_data,
            "heatmap": heatmap_data
        })

class SuperAdminAnalyticsView(APIView):
    """
    Global system analytics.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        popular_facilities = Facility.objects.annotate(
            booking_count=Count('slots__bookings')
        ).order_by('-booking_count')[:5]
        
        ranking_data = [
            {"name": f.name, "bookings": f.booking_count}
            for f in popular_facilities
        ]

        return Response({
            "popularity": ranking_data
        })
