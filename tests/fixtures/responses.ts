export const SANDBOX_TOKEN_RESPONSE = {
  access_token: 'test_access_token_abc123',
  expires_in: '3600',
  token_type: 'Bearer',
}

export const STK_PUSH_SUCCESS = {
  MerchantRequestID: 'merchant-req-001',
  CheckoutRequestID: 'ws_CO_123456789',
  ResponseCode: '0',
  ResponseDescription: 'Success. Request accepted for processing',
  CustomerMessage: 'Success. Request accepted for processing',
}

export const STK_QUERY_SUCCESS = {
  ResponseCode: '0',
  ResponseDescription: 'The service request has been accepted successfully.',
  MerchantRequestID: 'merchant-req-001',
  CheckoutRequestID: 'ws_CO_123456789',
  ResultCode: '0',
  ResultDesc: 'The service request is processed successfully.',
}

export const STK_QUERY_PENDING = {
  ResponseCode: '0',
  ResponseDescription: 'The service request has been accepted successfully.',
  MerchantRequestID: 'merchant-req-001',
  CheckoutRequestID: 'ws_CO_123456789',
  ResultCode: '1032',
  ResultDesc: 'Request cancelled by user',
}

export const DARAJA_AUTH_ERROR = {
  requestId: '16813-1234567-1',
  errorCode: '401.002.01',
  errorMessage: 'Error Occurred - Invalid Access Token',
}

export const C2B_REGISTER_SUCCESS = {
  OriginatorCoversationID: 'conv-001',
  ResponseCode: '0',
  ResponseDescription: 'Success',
}

export const B2C_SUCCESS = {
  ConversationID: 'conv-b2c-001',
  OriginatorConversationID: 'orig-b2c-001',
  ResponseCode: '0',
  ResponseDescription: 'Accept the service request successfully.',
}
