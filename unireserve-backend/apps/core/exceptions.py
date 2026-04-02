from rest_framework.views import exception_handler
from rest_framework.exceptions import APIException

class BusinessLogicException(APIException):
    status_code = 400
    default_detail = 'A business rule was violated.'
    default_code = 'BUSINESS_RULE_VIOLATION'

    def __init__(self, detail, code=None, status_code=None):
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.default_code = code
        super().__init__(detail=detail, code=self.default_code)

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        # Don't double-wrap if already wrapped
        if isinstance(response.data, dict) and 'success' in response.data:
            return response

        # Format error response according to PRD
        code = getattr(exc, 'default_code', 'ERROR')
        if hasattr(exc, 'get_codes'):
            codes = exc.get_codes()
            if isinstance(codes, dict):
                code = list(codes.values())[0]
            elif isinstance(codes, list):
                code = codes[0]

        message = response.data.get('detail', str(exc)) if isinstance(response.data, dict) else str(response.data)

        response.data = {
            'success': False,
            'error': {
                'code': str(code).upper(),
                'message': message
            }
        }
    return response
