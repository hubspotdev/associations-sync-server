export const mappingSchemas = {
  AssociationMapping: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Unique identifier for the mapping',
        example: 'clh1234abcdef',
      },
      nativeAssociationId: {
        type: 'string',
        description: 'ID of the native association',
        example: 'native_123',
      },
      nativeObjectId: {
        type: 'string',
        description: 'ID of the source object in the native system',
        example: 'contact_456',
      },
      toNativeObjectId: {
        type: 'string',
        description: 'ID of the target object in the native system',
        example: 'company_789',
      },
      fromObjectType: {
        type: 'string',
        description: 'Type of the source object',
        example: 'contact',
      },
      toObjectType: {
        type: 'string',
        description: 'Type of the target object',
        example: 'company',
      },
      nativeAssociationLabel: {
        type: 'string',
        description: 'Label of the association in the native system',
        example: 'Primary Contact',
      },
      hubSpotAssociationLabel: {
        type: 'string',
        description: 'Label of the association in HubSpot',
        example: 'contact_to_company',
      },
      fromHubSpotObjectId: {
        type: 'string',
        description: 'HubSpot ID of the source object',
        example: '12345',
      },
      toHubSpotObjectId: {
        type: 'string',
        description: 'HubSpot ID of the target object',
        example: '67890',
      },
      customerId: {
        type: 'string',
        description: 'ID of the customer who owns this mapping',
        example: 'cust_123',
      },
      associationTypeId: {
        type: 'integer',
        description: 'HubSpot association type ID',
        example: 1,
      },
      associationCategory: {
        type: 'string',
        description: 'Category of the association',
        enum: ['HUBSPOT_DEFINED', 'INTEGRATOR_DEFINED', 'USER_DEFINED'],
        example: 'USER_DEFINED',
      },
      cardinality: {
        type: 'string',
        description: 'Cardinality of the association relationship',
        enum: ['ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY'],
        example: 'ONE_TO_MANY',
      },
    },
  },
  BatchDeleteResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true,
      },
      data: {
        type: 'object',
        properties: {
          deletedCount: {
            type: 'number',
            example: 5,
          },
          deletedRecords: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/AssociationMapping',
            },
          },
        },
      },
    },
  },
};

export const mappingPaths = {
  '/api/associations/mappings': {
    post: {
      summary: 'Create single association mapping',
      description: 'Create a new association mapping in both HubSpot and database',
      tags: ['Mappings'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AssociationMapping',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Successfully created mapping',
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
                    $ref: '#/components/schemas/AssociationMapping',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
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
                    example: 'Failed to save association mapping: Database error',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/associations/mappings/batch': {
    post: {
      summary: 'Create batch association mappings',
      description: 'Create multiple association mappings in both HubSpot and database',
      tags: ['Mappings'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AssociationMapping',
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Successfully created mappings',
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
                      hubspotResponse: {
                        type: 'object',
                      },
                      dbResponse: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/AssociationMapping',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Invalid request: mappings must be a non-empty array',
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
                    example: 'Error saving mapping',
                  },
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Delete multiple mappings',
      description: 'Delete multiple association mappings by their IDs',
      tags: ['Mappings'],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mappingIds'],
              properties: {
                mappingIds: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['clh1234abcdef', 'clh5678ghijk'],
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Successfully deleted mappings',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BatchDeleteResponse',
              },
            },
          },
        },
        400: {
          description: 'Invalid request',
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
                    example: 'Invalid or empty mappingIds array',
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'No mappings found',
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
                    example: 'No mappings were deleted',
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
                    example: 'Failed to delete mappings: Database error',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/associations/mappings/basic/{mappingId}': {
    get: {
      summary: 'Get a single mapping',
      description: 'Retrieve a single association mapping by ID',
      tags: ['Mappings'],
      parameters: [
        {
          in: 'path',
          name: 'mappingId',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID of the mapping to retrieve',
        },
      ],
      responses: {
        200: {
          description: 'Successfully retrieved mapping',
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
                    $ref: '#/components/schemas/AssociationMapping',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid request',
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
                    example: 'Missing mappingId parameter',
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'Mapping not found',
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
                    example: 'Mapping not found',
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
                    example: 'Error retrieving mapping: Database error',
                  },
                },
              },
            },
          },
        },
      },
    },
    delete: {
      summary: 'Delete a single mapping',
      description: 'Delete a single association mapping by ID',
      tags: ['Mappings'],
      parameters: [
        {
          in: 'path',
          name: 'mappingId',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'ID of the mapping to delete',
        },
      ],
      responses: {
        200: {
          description: 'Successfully deleted mapping',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  deletedId: {
                    type: 'string',
                    example: 'clh1234abcdef',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Invalid request',
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
                    example: 'Missing mappingId parameter',
                  },
                },
              },
            },
          },
        },
        404: {
          description: 'Mapping not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Mapping not found',
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
                    example: 'Failed to delete mapping: Database error',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  '/api/associations/mappings/all': {
    get: {
      summary: 'Get all mappings',
      description: 'Retrieve all association mappings',
      tags: ['Mappings'],
      responses: {
        200: {
          description: 'Successfully retrieved mappings',
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
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/AssociationMapping',
                    },
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
                    example: 'Error fetching mappings: Database error',
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
