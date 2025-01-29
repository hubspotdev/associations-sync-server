export const associationSchemas = {
  AssociationResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      data: {
        $ref: '#/components/schemas/Association',
      },
    },
  },
  Association: {
    type: 'object',
    required: [
      'objectType',
      'objectId',
      'toObjectType',
      'toObjectId',
      'associationLabel',
      'associationTypeId',
      'associationCategory',
      'customerId',
      'cardinality',
    ],
    properties: {
      id: {
        type: 'string',
        description: 'Auto-generated CUID identifier for the association',
        example: 'clh1234abcdef',
      },
      objectType: {
        type: 'string',
        description: 'The type of the source object (e.g., contact, company, deal)',
        example: 'contact',
      },
      objectId: {
        type: 'string',
        description: 'Unique identifier of the source object',
        example: '123456',
      },
      toObjectType: {
        type: 'string',
        description: 'The type of the target object (e.g., contact, company, deal)',
        example: 'company',
      },
      toObjectId: {
        type: 'string',
        description: 'Unique identifier of the target object',
        example: '789012',
      },
      associationLabel: {
        type: 'string',
        description: 'Human-readable name for the association type',
        example: 'Primary Contact',
      },
      associationTypeId: {
        type: 'integer',
        description: 'Unique identifier for the association type',
        example: 1,
      },
      associationCategory: {
        type: 'string',
        description: 'Indicates who defined the association type',
        enum: ['HUBSPOT_DEFINED', 'INTEGRATOR_DEFINED', 'USER_DEFINED'],
        example: 'USER_DEFINED',
      },
      customerId: {
        type: 'string',
        description: 'Unique identifier of the customer who owns this association',
        example: 'cust_123',
      },
      cardinality: {
        type: 'string',
        description: 'Defines the relationship multiplicity between associated objects',
        enum: ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY'],
        example: 'ONE_TO_MANY',
      },
    },
  },
};

export const associationPaths = {
  '/api/associations/{associationId}': {
    get: {
      summary: 'Get a single association by ID',
      tags: ['Associations'],
      parameters: [
        {
          in: 'path',
          name: 'associationId',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'The association ID',
        },
      ],
      responses: {
        200: {
          description: 'Successfully retrieved association',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AssociationResponse',
              },
            },
          },
        },
        404: {
          description: 'Association not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  data: {
                    type: 'string',
                    example: 'Association not found',
                  },
                },
              },
            },
          },
        },
        500: {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  data: {
                    type: 'string',
                    example: 'There was an issue getting the association: Record not found in database',
                  },
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Delete an association by ID',
      tags: ['Associations'],
      parameters: [
        {
          in: 'path',
          name: 'associationId',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'The association ID to delete',
        },
      ],
      responses: {
        200: {
          description: 'Association deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  data: {
                    type: 'object',
                    properties: {
                      deletedAssociation: {
                        $ref: '#/components/schemas/Association',
                      },
                      deletedMappingsCount: {
                        type: 'number',
                        example: 1,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'Association not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  data: {
                    type: 'string',
                    example: 'Association not found',
                  },
                },
              },
            },
          },
        },
        500: {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  data: {
                    type: 'string',
                    example: 'Failed to delete association clh1234abcdef: Database connection error',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/associations': {
    post: {
      summary: 'Create a new association',
      tags: ['Associations'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Association',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Association created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AssociationResponse',
              },
            },
          },
        },
        400: {
          description: 'Invalid request body',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  data: {
                    type: 'string',
                    example: 'Request body is required',
                  },
                },
              },
            },
          },
        },
        500: {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  data: {
                    type: 'string',
                    example: 'Failed to save association: Invalid input data',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
