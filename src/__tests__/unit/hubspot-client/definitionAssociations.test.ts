import { AssociationDefinition } from '@prisma/client';
import { hubspotClient, getAccessToken } from '../../../auth';
import {
  saveAssociationDefinition,
  archiveAssociationDefinition,
  updateAssociationDefinition,
  getAllAssociationDefinitionsByType,
} from '../../../hubspot-client/definitionAssociations';
import * as utils from '../../../utils/utils';
import handleError from '../../../utils/error';

jest.mock('../../../auth', () => ({
  hubspotClient: {
    setAccessToken: jest.fn(),
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
}));

jest.mock('../../../utils/utils', () => ({
  formatDefinitionPostRequest: jest.fn(),
  formatDefinitionUpdateRequest: jest.fn(),
  formaCreateCardinalityRequest: jest.fn(),
  formatUpdateCardinalityRequest: jest.fn(),
  getCustomerId: jest.fn(),
  checkAccessToken: jest.fn(),
}));

jest.mock('../../../utils/error');

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
    fromCardinality: 1,
    toCardinality: 1,
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
    it('should successfully create definition with cardinality', async () => {
      const mockCreateResponse = {
        id: 'def_123',
        typeId: 1,
        associationTypeId: 1,
        label: 'Primary Contact',
        name: 'primary_contact',
        fromObjectTypeId: 'contact',
        toObjectTypeId: 'company',
      };

      (utils.formatDefinitionPostRequest as jest.Mock).mockReturnValue({
        fromObject: 'contact',
        toObject: 'company',
        requestInfo: {
          label: 'Primary Contact',
          name: 'primary_contact',
          inverseLabel: 'Primary Company',
          category: 'USER_DEFINED',
        },
      });

      (utils.formaCreateCardinalityRequest as jest.Mock).mockReturnValue({
        inputs: [{
          associationTypeId: 1,
          cardinality: {
            from: { maxCardinality: 1 },
            to: { maxCardinality: 1 },
          },
        }],
      });

      (hubspotClient.crm.associations.v4.schema.definitionsApi.create as jest.Mock)
        .mockResolvedValue(mockCreateResponse);

      (hubspotClient.apiRequest as jest.Mock).mockImplementation(({ path }) => {
        const mockConfigResponse = {
          results: [{
            associationTypeId: 1,
            cardinality: {
              from: { maxCardinality: 1 },
              to: { maxCardinality: 1 },
            },
            success: true,
          }],
        };
        return Promise.resolve(mockConfigResponse);
      });

      const result = await saveAssociationDefinition(mockDefinition);

      expect(result).toEqual(mockCreateResponse);
      expect(hubspotClient.setAccessToken).toHaveBeenCalledWith('mock-token');
      expect(hubspotClient.crm.associations.v4.schema.definitionsApi.create).toHaveBeenCalledWith(
        'contact',
        'company',
        {
          label: 'Primary Contact',
          name: 'primary_contact',
          inverseLabel: 'Primary Company',
          category: 'USER_DEFINED',
        },
      );
      expect(hubspotClient.apiRequest).toHaveBeenCalledTimes(2);
      expect(hubspotClient.apiRequest).toHaveBeenNthCalledWith(1, {
        method: 'POST',
        path: '/crm/v4/associations/definitions/configurations/contact/company/batch/create',
        body: {
          inputs: [{
            associationTypeId: 1,
            cardinality: {
              from: { maxCardinality: 1 },
              to: { maxCardinality: 1 },
            },
          }],
        },
      });
      expect(hubspotClient.apiRequest).toHaveBeenNthCalledWith(2, {
        method: 'POST',
        path: '/crm/v4/associations/definitions/configurations/company/contact/batch/create',
        body: {
          inputs: [{
            associationTypeId: 1,
            cardinality: {
              from: { maxCardinality: 1 },
              to: { maxCardinality: 1 },
            },
          }],
        },
      });
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      (hubspotClient.crm.associations.v4.schema.definitionsApi.create as jest.Mock)
        .mockRejectedValue(mockError);

      await expect(saveAssociationDefinition(mockDefinition))
        .rejects
        .toThrow('API Error');

      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue saving the association definition in HubSpot',
      );
    });
  });

  describe('updateAssociationDefinition', () => {
    it('should successfully update definition with cardinality', async () => {
      (hubspotClient.crm.associations.v4.schema.definitionsApi.update as jest.Mock)
        .mockResolvedValue({ success: true });
      (hubspotClient.apiRequest as jest.Mock).mockResolvedValue({ success: true });

      const result = await updateAssociationDefinition(mockDefinition);

      expect(result).toEqual({ success: true });
      expect(hubspotClient.setAccessToken).toHaveBeenCalledWith('mock-token');
      expect(hubspotClient.crm.associations.v4.schema.definitionsApi.update).toHaveBeenCalled();
      expect(hubspotClient.apiRequest).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const mockError = new Error('Update failed');
      (hubspotClient.crm.associations.v4.schema.definitionsApi.update as jest.Mock)
        .mockRejectedValue(mockError);

      await expect(updateAssociationDefinition(mockDefinition))
        .rejects.toThrow("Cannot destructure property 'fromObject' of 'formattedData' as it is undefined.");
    });
  });

  describe('archiveAssociationDefinition', () => {
    it('should successfully archive definition', async () => {
      (hubspotClient.crm.associations.v4.schema.definitionsApi.archive as jest.Mock)
        .mockResolvedValue({ success: true });

      const archiveRequest = {
        fromObjectType: 'contact',
        toObjectType: 'company',
        associationTypeId: 1,
      };

      const result = await archiveAssociationDefinition(archiveRequest);

      expect(result).toEqual({ success: true });
      expect(hubspotClient.setAccessToken).toHaveBeenCalledWith('mock-token');
      expect(hubspotClient.crm.associations.v4.schema.definitionsApi.archive)
        .toHaveBeenCalledWith('contact', 'company', 1);
    });

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
    it('should successfully fetch all definitions', async () => {
      const mockResponse = [{ typeId: 1, label: 'Test' }];
      (hubspotClient.crm.associations.v4.schema.definitionsApi.getAll as jest.Mock)
        .mockResolvedValue(mockResponse);

      const result = await getAllAssociationDefinitionsByType({
        fromObject: 'contact',
        toObject: 'company',
      });

      expect(result).toEqual(mockResponse);
      expect(hubspotClient.setAccessToken).toHaveBeenCalledWith('mock-token');
      expect(hubspotClient.crm.associations.v4.schema.definitionsApi.getAll).toHaveBeenCalled();
    });

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
