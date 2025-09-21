// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
export const RETRY_STATUS_CODES = new Set([
  408, // Request Timeout
  409, // Conflict
  425, // Too Early (Experimental)
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504 // Gateway Timeout
])

// https://developer.mozilla.org/en-US/docs/Web/API/Response/body
export const NULL_BODY_RESPONSES = new Set([101, 204, 205, 304])

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
export const PAYLOAD_METHODS = new Set(
  Object.freeze(['PATCH', 'POST', 'PUT', 'DELETE'])
)

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types
export const TEXT_TYPES = new Set([
  'image/svg',
  'application/xml',
  'application/xhtml',
  'application/html'
])
