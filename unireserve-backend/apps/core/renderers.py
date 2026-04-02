from rest_framework.renderers import JSONRenderer

class EnvelopeJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context['response'] if renderer_context else None
        
        # If it's an error, let the custom exception handler define the structure
        if response and response.status_code >= 400:
            return super().render(data, accepted_media_type, renderer_context)
            
        # Already wrapped
        if isinstance(data, dict) and 'success' in data:
            return super().render(data, accepted_media_type, renderer_context)

        # Build envelope
        wrapped_data = {
            'success': True,
            'data': data,
            'message': ''
        }
        
        # Handle DRF Pagination default format (PageNumberPagination returns dict with count, next, previous, results)
        if isinstance(data, dict) and 'results' in data and 'count' in data:
            wrapped_data['data'] = data['results']
            wrapped_data['meta'] = {
                'total': data['count'],
                'next': data.get('next'),
                'previous': data.get('previous')
            }
            
        return super().render(wrapped_data, accepted_media_type, renderer_context)
