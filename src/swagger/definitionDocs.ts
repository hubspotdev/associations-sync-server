export const definitionSchemas = {
  AssociationDefinition: {
    type: 'object',
    required: [
      'fromObjectType',
      'toObjectType',
      'associationLabel',
      'name',
      'customerId',
      'cardinality',
      'associationCategory',
    ],
    properties: {
      fromObjectType: {
        type: 'string',
        description: 'The source object type in HubSpot (e.g., contact, company, deal)',
        example: 'contact',
      },
      toObjectType: {
        type: 'string',
        description: 'The target object type in HubSpot (e.g., company, deal, ticket)',
        example: 'company',
      },
      associationLabel: {
        type: 'string',
        description: 'Human-readable name for the association',
        example: 'Primary Company',
      },
      name: {
        type: 'string',
        description: 'The label that describes the relationship from source to target',
        example: 'primary_company',
      },
      inverseLabel: {
        type: 'string',
        description: 'Optional label for the reverse relationship (target to source)',
        nullable: true,
        example: 'Employee of',
      },
      associationTypeId: {
        type: 'integer',
        description: "HubSpot's unique identifier for this association type",
        nullable: true,
        example: 1,
      },
      customerId: {
        type: 'string',
        description: 'Unique identifier for the customer/portal',
        example: 'cust_12345',
      },
      cardinality: {
        type: 'string',
        description: 'Defines the relationship multiplicity between objects',
        enum: ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY'],
        example: 'ONE_TO_MANY',
      },
      fromMaxObjects: {
        type: 'integer',
        description: 'Maximum number of associations allowed from the source object',
        nullable: true,
        example: 1,
      },
      toMaxObjects: {
        type: 'integer',
        description: 'Maximum number of associations allowed to the target object',
        nullable: true,
        example: 100,
      },
      associationCategory: {
        type: 'string',
        description: 'Indicates who defined the association type',
        enum: ['HUBSPOT_DEFINED', 'INTEGRATOR_DEFINED', 'USER_DEFINED'],
        example: 'USER_DEFINED',
      },
    },
  },
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      data: {
        type: 'object',
      },
    },
  },
  DefinitionsResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      data: {
        type: 'object',
        properties: {
          dbAssociations: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/AssociationDefinition',
            },
          },
          hubspotAssociations: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/AssociationDefinition',
            },
          },
        },
      },
    },
  },
};

export const definitionPaths = {
  '/api/associations/definitions/{fromObject}/{toObject}': {
    get: {
      summary: 'Get association definitions',
      tags: ['Definitions'],
      parameters: [
        {
          in: 'path',
          name: 'fromObject',
          required: true,
          schema: {
            type: 'string',
          },
          description: "Source object type (e.g., 'contact', 'company')",
        },
        {
          in: 'path',
          name: 'toObject',
          required: true,
          schema: {
            type: 'string',
          },
          description: "Target object type (e.g., 'deal', 'ticket')",
        },
      ],
      responses: {
        200: {
          description: 'Successfully retrieved definitions',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DefinitionsResponse',
              },
            },
          },
        },
        400: {
          description: 'Missing parameters',
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
                    example: 'Missing required parameters: fromObject and toObject',
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
                    example: 'Failed to fetch association definitions: Database error',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/associations/definitions/{AssociationDefinitionId}': {
    delete: {
      summary: 'Delete association definition',
      description: 'Delete an association definition and its related mappings from the database',
      tags: ['Definitions'],
      parameters: [
        {
          in: 'path',
          name: 'associationId',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID of the association definition to delete',
        },
      ],
      responses: {
        200: {
          description: 'Successfully deleted definition',
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
                      message: {
                        type: 'string',
                        example: 'Successfully deleted association definition clh1234abcdef',
                      },
                      deletedMappingsCount: {
                        type: 'number',
                        example: 5,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'Association definition not found',
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
                    example: 'Association definition with id clh1234abcdef not found',
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
                    example: 'Failed to archive association definition: Database error',
                  },
                },
              },
            },
          },
        },
      },
    },
    put: {
      summary: 'Update association definition',
      description: 'Update an existing association definition in both database and HubSpot',
      tags: ['Definitions'],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID of the association definition to update',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AssociationDefinition',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully updated definition',
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
                    description: 'Response from HubSpot API',
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
                    example: 'Error updating association definition: Database error',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/associations/definitions': {
    post: {
      summary: 'Create association definition',
      description: 'Create a new association definition in both HubSpot and database',
      tags: ['Definitions'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AssociationDefinition',
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully created definition',
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
                      configResponse: {
                        type: 'object',
                        description: 'Optional configuration response',
                        properties: {
                          config1: {
                            type: 'object',
                            properties: {
                              size: { type: 'number' },
                              timeout: { type: 'number' },
                            },
                          },
                          config2: {
                            type: 'object',
                            properties: {
                              size: { type: 'number' },
                              timeout: { type: 'number' },
                            },
                          },
                        },
                        nullable: true,
                      },
                      response: {
                        type: 'object',
                        description: 'Optional wrapped response',
                        properties: {
                          results: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                typeId: { type: 'number' },
                                label: { type: 'string' },
                                category: { type: 'string' },
                              },
                            },
                          },
                        },
                        nullable: true,
                      },
                      results: {
                        type: 'array',
                        description: 'Direct results array when no wrapper is present',
                        items: {
                          type: 'object',
                          properties: {
                            typeId: { type: 'number' },
                            label: { type: 'string' },
                            category: { type: 'string' },
                          },
                        },
                        nullable: true,
                      },
                    },
                    example: {
                      results: [
                        {
                          typeId: 156,
                          label: 'tester17 Of',
                          category: 'USER_DEFINED',
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Missing or invalid request body',
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
        422: {
          description: 'Invalid response from HubSpot',
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
                    example: 'Invalid response from Hubspot',
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
                    example: 'Failed to save association definition: Database error',
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
