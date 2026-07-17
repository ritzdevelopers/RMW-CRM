import { env } from '../config/env.js';

/** Hand-authored OpenAPI spec covering the primary endpoints.
 *  Extend as modules grow. Served via swagger-ui-express at /api/docs. */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MPF CRM API',
    version: '1.0.0',
    description: 'Real Estate CRM for My Property Fact — Leads, Builders, Auth, Dashboard.',
  },
  servers: [{ url: env.apiPrefix }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': { post: authOp('Register a new account', ['name', 'email', 'password']) },
    '/auth/login': { post: authOp('Login with email + password', ['email', 'password']) },
    '/auth/refresh': { post: simpleOp('Rotate refresh token (cookie based)') },
    '/auth/logout': { post: simpleOp('Logout & revoke refresh token') },
    '/auth/me': { get: secureOp('Get current user profile & permissions') },
    '/auth/forgot-password': { post: authOp('Request a password reset email', ['email']) },
    '/auth/reset-password': { post: authOp('Reset password with token', ['token', 'password']) },
    '/auth/change-password': { post: secureOp('Change password (authenticated)') },
    '/leads': {
      get: secureOp('List leads (filter, sort, paginate)'),
      post: secureOp('Create a lead'),
    },
    '/leads/{id}': {
      get: secureOp('Get a lead with activity timeline'),
      patch: secureOp('Update a lead'),
      delete: secureOp('Delete a lead'),
    },
    '/leads/{id}/status': { patch: secureOp('Change lead status') },
    '/leads/{id}/assign': { patch: secureOp('Assign lead to a user') },
    '/leads/{id}/activities': { post: secureOp('Add activity (note/call/etc.)') },
    '/leads/bulk': { post: secureOp('Bulk assign/status/delete') },
    '/builders': { get: secureOp('List builders'), post: secureOp('Create a builder') },
    '/builders/{id}': {
      get: secureOp('Get a builder'),
      patch: secureOp('Update a builder'),
      delete: secureOp('Delete a builder'),
    },
    '/dashboard/overview': { get: secureOp('Executive dashboard metrics') },
    '/dashboard/team': { get: secureOp('Team performance leaderboard') },
    '/dashboard/tasks': { get: secureOp("Today's follow-up tasks") },
    '/search': { get: secureOp('Global search across leads/builders/users') },
    '/notifications': { get: secureOp('List notifications') },
  },
};

function secureOp(summary: string) {
  return {
    summary,
    responses: {
      '200': { description: 'OK' },
      '401': { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
    },
  };
}

function simpleOp(summary: string) {
  return { summary, security: [], responses: { '200': { description: 'OK' } } };
}

function authOp(summary: string, required: string[]) {
  return {
    summary,
    security: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required,
            properties: Object.fromEntries(required.map((f) => [f, { type: 'string' }])),
          },
        },
      },
    },
    responses: { '200': { description: 'OK' }, '400': { description: 'Validation error' } },
  };
}
