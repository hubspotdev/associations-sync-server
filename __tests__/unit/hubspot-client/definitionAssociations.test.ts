import { AssociationDefinition } from '@prisma/client';
import { expect } from '@jest/globals';
import { hubspotClient, getAccessToken } from '../../../src/auth';
import {
  saveAssociationDefinition,
  archiveAssociationDefinition,
  updateAssociationDefinition,
  getAllAssociationDefinitionsByType,
} from '../../../src/hubspot-client/definitionAssociations';
import * as utils from '../../../src/utils/utils';
import handleError from '../../../src/utils/error';

jest.mock('../../../src/auth', () => ({
  hubspotClient: {
   authenticateHubspotClient: jest.fn(),
    apiRequest: jest.fn(),
    crm: {
      associations: {
        v4: {
          schema: {
            definitionsApi: {
              create: jest.fn(),
              update: jest.fn(),
              archive: jest.fn(),
              getAll: jest.fn(),
            },
          },
        },
      },
    },
  },
  getAccessToken: jest.fn(),
 authenticateHubspotClient: jest.fn(),
}));

jest.mock('../../../src/utils/utils', () => ({
  formatDefinitionPostRequest: jest.fn(),
  formatDefinitionUpdateRequest: jest.fn(),
  formatCreateCardinalityRequest: jest.fn(),
  formatUpdateCardinalityRequest: jest.fn(),
  getCustomerId: jest.fn(),
  checkAccessToken: jest.fn(),
}));

jest.mock('../../../src/utils/error');

describe('Definition Associations HubSpot Client', () => {
  const mockDefinition: AssociationDefinition = {
    id: 'def_123',
    fromTypeId: 1,
    toTypeId: 2,
    fromObjectType: 'contact',
    toObjectType: 'company',
    associationLabel: 'Primary Contact',
    name: 'primary_contact',
    inverseLabel: 'Primary Company',
    associationTypeId: 1,
    customerId: 'cust_123',
    cardinality: 'ONE_TO_ONE',
    fromMaxObjects: 1,
    toMaxObjects: 1,
    associationCategory: 'USER_DEFINED',
  };

  // Mock console methods before all tests
  const originalConsole = { ...console };

  beforeAll(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  });

  // Restore console methods after all tests
  afterAll(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (utils.getCustomerId as jest.Mock).mockReturnValue('cust_123');
    (getAccessToken as jest.Mock).mockResolvedValue('mock-token');
  });

  describe('saveAssociationDefinition', () => {
    it('should handle archive errors', async () => {
      const mockError = new Error('Archive failed');
      (hubspotClient.crm.associations.v4.schema.definitionsApi.archive as jest.Mock)
        .mockRejectedValue(mockError);

      const archiveRequest = {
        fromObjectType: 'contact',
        toObjectType: 'company',
        associationTypeId: 1,
      };

      await expect(archiveAssociationDefinition(archiveRequest))
        .rejects
        .toThrow('Archive failed');

      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue archiving the association definition in HubSpot',
      );
    });
  });

  describe('getAllAssociationDefinitionsByType', () => {
    it('should handle fetch errors', async () => {
      const mockError = new Error('Fetch failed');
      (hubspotClient.crm.associations.v4.schema.definitionsApi.getAll as jest.Mock)
        .mockRejectedValue(mockError);

      await expect(getAllAssociationDefinitionsByType({
        fromObject: 'contact',
        toObject: 'company',
      })).rejects.toThrow('Fetch failed');

      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an error getting all association definitions',
      );
    });
  });
});
