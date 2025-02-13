import { AssociationMapping } from '@prisma/client';
import { beforeEach } from 'node:test';
import { jest } from '@jest/globals';
import { hubspotClient } from '../../../auth';
import { saveSingleHubspotAssociation, archiveSingleHubspotAssociation } from '../../../hubspot-client/singleAssociations';
import * as utils from '../../../utils/utils';
import * as auth from '../../../auth';

// Mock the auth module
jest.mock('../../../auth', () => {
  const mockHubspotClient = {
    setAccessToken: jest.fn(),
    crm: {
      associations: {
        v4: {
          basicApi: {
            create: jest.fn(),
            archive: jest.fn(),
          },
        },
      },
    },
  };

  return {
    hubspotClient: mockHubspotClient,
    setAccessToken: jest.fn().mockImplementation(async () => {
      mockHubspotClient.setAccessToken('mock-token');
      return mockHubspotClient;
    }),
    getAccessToken: jest.fn().mockResolvedValue('mock-token'),
  };
});

jest.mock('../../../utils/utils', () => ({
  formatSingleRequestData: jest.fn(),
  getCustomerId: jest.fn().mockReturnValue('cust_123'),
}));

describe('Single Associations HubSpot Client', () => {
  const mockMapping: AssociationMapping = {
    id: 'map_123',
    nativeAssociationId: 'nat_123',
    nativeObjectId: 'obj_123',
    toNativeObjectId: 'obj_456',
    fromObjectType: 'contact',
    toObjectType: 'company',
    nativeAssociationLabel: 'Primary Contact',
    hubSpotAssociationLabel: 'primary_contact',
    fromHubSpotObjectId: 'hub_123',
    toHubSpotObjectId: 'hub_456',
    customerId: 'cust_123',
    associationTypeId: 1,
    associationCategory: 'USER_DEFINED',
    cardinality: 'ONE_TO_ONE',
  };

  const mockFormattedData = {
    objectType: 'contact',
    objectId: 'hub_123',
    toObjectType: 'company',
    toObjectId: 'hub_456',
    associationType: [{
      associationCategory: 'USER_DEFINED',
      typeId: 1,
    }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (utils.formatSingleRequestData as jest.Mock).mockReturnValue(mockFormattedData);
  });

  describe('saveSingleHubspotAssociation', () => {
    it('should successfully create single association', async () => {
      await saveSingleHubspotAssociation(mockMapping);

      // Verify authentication flow
      expect(auth.setAccessToken).toHaveBeenCalled();
      expect(hubspotClient.setAccessToken).toHaveBeenCalledWith('mock-token');

      // Verify API call
      expect(hubspotClient.crm.associations.v4.basicApi.create).toHaveBeenCalledWith(
        mockFormattedData.objectType,
        mockFormattedData.objectId,
        mockFormattedData.toObjectType,
        mockFormattedData.toObjectId,
        mockFormattedData.associationType,
      );
    });

    it('should handle authentication errors', async () => {
      (auth.setAccessToken as jest.Mock).mockRejectedValue(new Error('Failed to authenticate HubSpot client'));

      await expect(saveSingleHubspotAssociation(mockMapping))
        .rejects
        .toThrow('Failed to authenticate HubSpot client');
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      (hubspotClient.crm.associations.v4.basicApi.create as jest.Mock).mockRejectedValue(mockError);

      await expect(saveSingleHubspotAssociation(mockMapping)).rejects.toThrow('API Error');
    });
  });

  describe('archiveSingleHubspotAssociation', () => {
    it('should successfully archive single association', async () => {
      await archiveSingleHubspotAssociation(mockMapping);

      // Verify authentication flow
      expect(auth.setAccessToken).toHaveBeenCalled();
      expect(hubspotClient.setAccessToken).toHaveBeenCalledWith('mock-token');

      // Verify API call
      expect(hubspotClient.crm.associations.v4.basicApi.archive).toHaveBeenCalledWith(
        mockFormattedData.objectType,
        mockFormattedData.objectId,
        mockFormattedData.toObjectType,
        mockFormattedData.toObjectId,
      );
    });

    it('should handle authentication errors', async () => {
      (auth.setAccessToken as jest.Mock).mockRejectedValue(new Error('Failed to authenticate HubSpot client'));

      await expect(archiveSingleHubspotAssociation(mockMapping))
        .rejects
        .toThrow('Failed to authenticate HubSpot client');
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      (hubspotClient.crm.associations.v4.basicApi.archive as jest.Mock).mockRejectedValue(mockError);

      await expect(archiveSingleHubspotAssociation(mockMapping)).rejects.toThrow('API Error');
    });
  });
});
