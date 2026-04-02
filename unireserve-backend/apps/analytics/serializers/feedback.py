from rest_framework import serializers
from apps.analytics.models import Feedback

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ('id', 'student', 'facility', 'overall_rating', 'is_flagged', 'created_at')

class FeedbackCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ('booking', 'cleanliness_rating', 'equipment_rating', 'experience_rating', 'comment')
