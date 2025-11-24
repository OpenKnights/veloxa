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
