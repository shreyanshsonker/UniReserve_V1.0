from django.core.mail import send_mail
from django.conf import settings

class EmailService:
    @staticmethod
    def _send_email(subject, template_name, context, recipient_list):
        """Helper to send HTML emails."""
        try:
            # We'll use simple text-based templates for now to keep it lightweight
            # In a real app, these would be in a templates/emails/ directory
            message = f"""
            Dear {context.get('name', 'Student')},
            
            {context.get('body', '')}
            
            Details:
            - Facility: {context.get('facility', 'N/A')}
            - Date: {context.get('date', 'N/A')}
            - Time: {context.get('time', 'N/A')}
            
            Thank you,
            The UniReserve Team
            """
            
            send_mail(
                subject=f"[UniReserve] {subject}",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=recipient_list,
                fail_silently=False,
            )
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

    @classmethod
    def send_booking_confirmation(cls, user, slot):
        subject = "Booking Confirmation"
        context = {
            'name': user.name,
            'body': "Your reservation has been approved by the facility manager. Please remember to check in within 15 minutes of your slot start time to avoid a no-show penalty.",
            'facility': slot.facility.name,
            'date': str(slot.date),
            'time': f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}"
        }
        return cls._send_email(subject, None, context, [user.email])

    @classmethod
    def send_booking_pending_approval(cls, user, slot):
        subject = "Booking Request Submitted"
        context = {
            'name': user.name,
            'body': "Your session request has been sent to the facility manager and will become valid only after approval.",
            'facility': slot.facility.name,
            'date': str(slot.date),
            'time': f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}"
        }
        return cls._send_email(subject, None, context, [user.email])

    @classmethod
    def send_booking_cancellation(cls, user, slot):
        subject = "Booking Cancelled"
        context = {
            'name': user.name,
            'body': "Your reservation has been cancelled as requested.",
            'facility': slot.facility.name,
            'date': str(slot.date),
            'time': f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}"
        }
        return cls._send_email(subject, None, context, [user.email])

    @classmethod
    def send_waitlist_promotion(cls, user, slot):
        subject = "Waitlist Update"
        context = {
            'name': user.name,
            'body': "A spot has opened up, and your waitlist entry has been turned into a booking request for manager approval.",
            'facility': slot.facility.name,
            'date': str(slot.date),
            'time': f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}"
        }
        return cls._send_email(subject, None, context, [user.email])

    @classmethod
    def send_manager_booking_request(cls, manager, student, slot):
        subject = "New Booking Approval Request"
        context = {
            'name': manager.name,
            'body': f"{student.name} has requested this facility session. Please review it in the manager approvals dashboard.",
            'facility': slot.facility.name,
            'date': str(slot.date),
            'time': f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}"
        }
        return cls._send_email(subject, None, context, [manager.email])

    @classmethod
    def send_booking_rejected(cls, user, slot, note=''):
        subject = "Booking Request Rejected"
        note_text = f" Manager note: {note}" if note else ""
        context = {
            'name': user.name,
            'body': f"Your booking request was not approved by the facility manager.{note_text}",
            'facility': slot.facility.name,
            'date': str(slot.date),
            'time': f"{slot.start_time.strftime('%H:%M')} - {slot.end_time.strftime('%H:%M')}"
        }
        return cls._send_email(subject, None, context, [user.email])

    @classmethod
    def send_no_show_warning(cls, user, booking):
        subject = "No-Show Warning"
        context = {
            'name': user.name,
            'body': f"You missed your recent reservation. This has been recorded as a no-show. You currently have {user.no_show_count} warning(s). At 3 warnings, your booking privileges will be suspended for 7 days.",
            'facility': booking.slot.facility.name,
            'date': str(booking.slot.date),
            'time': f"{booking.slot.start_time.strftime('%H:%M')} - {booking.slot.end_time.strftime('%H:%M')}"
        }
        return cls._send_email(subject, None, context, [user.email])

    @classmethod
    def send_suspension_alert(cls, user, end_date):
        subject = "Account Suspended"
        context = {
            'name': user.name,
            'body': f"Your account has been suspended for 7 days due to repeated no-shows. Your booking privileges will be restored on {end_date.strftime('%Y-%m-%d')}.",
            'facility': "N/A",
            'date': "N/A",
            'time': "N/A"
        }
        return cls._send_email(subject, None, context, [user.email])
