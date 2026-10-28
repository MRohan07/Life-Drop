export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'LifeDrop Blood Donation & Emergency Coordination API',
    version: '1.0.0',
    description:
      'High-reliability REST API for voluntary blood donation, hospital emergency coordination, blood bank lot-level inventory management, and state oversight governance.',
    contact: {
      name: 'LifeDrop Engineering Team',
      email: 'engineering@lifedrop.io',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1 Base Endpoint',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      BloodGroup: {
        type: 'string',
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      },
      UserRole: {
        type: 'string',
        enum: ['USER', 'HOSPITAL', 'BLOOD_BANK', 'ADMIN'],
      },
      EmergencyLevel: {
        type: 'string',
        enum: ['CRITICAL', 'URGENT', 'NORMAL'],
      },
      RequestStatus: {
        type: 'string',
        enum: [
          'SEARCHING',
          'ACTIVE',
          'PARTIALLY_FULFILLED',
          'RESERVED',
          'FULFILLED',
          'CLOSED',
          'CANCELLED',
          'EXPIRED',
        ],
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new User, Hospital, or Blood Bank',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'phone', 'city'],
                properties: {
                  role: { $ref: '#/components/schemas/UserRole' },
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  city: { type: 'string' },
                  bloodGroup: { $ref: '#/components/schemas/BloodGroup' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Registration successful' },
          400: { description: 'Validation error' },
          409: { description: 'Phone or email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Sign in with phone/email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier'],
                properties: {
                  identifier: { type: 'string' },
                  password: { type: 'string' },
                  role: { $ref: '#/components/schemas/UserRole' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Logged in successfully' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/otp/request': {
      post: {
        summary: 'Request 6-digit verification OTP',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone'],
                properties: {
                  phone: { type: 'string' },
                  purpose: { type: 'string', enum: ['LOGIN', 'REGISTER', 'VERIFY_PHONE'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP dispatched' },
        },
      },
    },
    '/auth/otp/verify': {
      post: {
        summary: 'Verify OTP code and authenticate',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['phone', 'code'],
                properties: {
                  phone: { type: 'string' },
                  code: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP verified and session created' },
          400: { description: 'Incorrect or expired OTP code' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Retrieve authenticated user session profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current authenticated user profile' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/blood-requests': {
      get: {
        summary: 'List active emergency requisitions',
        tags: ['Blood Requests'],
        parameters: [
          { name: 'status', in: 'query', schema: { $ref: '#/components/schemas/RequestStatus' } },
          { name: 'bloodGroup', in: 'query', schema: { $ref: '#/components/schemas/BloodGroup' } },
          { name: 'emergencyLevel', in: 'query', schema: { $ref: '#/components/schemas/EmergencyLevel' } },
        ],
        responses: {
          200: { description: 'List of blood requests' },
        },
      },
      post: {
        summary: 'Issue a new emergency blood requisition (Hospitals only)',
        tags: ['Blood Requests'],
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Requisition broadcast initiated' },
        },
      },
    },
    '/blood-banks/me/inventory': {
      get: {
        summary: 'Get facility inventory balances and expiring lots',
        tags: ['Inventory'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Facility inventory lots and balances' },
        },
      },
    },
    '/admin/dashboard': {
      get: {
        summary: 'Platform summary analytics and governance queue',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Platform health and KPI metrics' },
          403: { description: 'Admin access required' },
        },
      },
    },
  },
};
