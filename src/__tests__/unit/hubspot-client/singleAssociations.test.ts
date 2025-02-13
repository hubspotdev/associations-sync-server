/**
 * @jest-environment node
 */

import { AssociationMapping } from '@prisma/client';
import { saveSingleHubspotAssociation, archiveSingleHubspotAssociation } from '../../../hubspot-client/singleAssociations';
import * as utils from '../../../utils/utils';
import handleError from '../../../utils/error';

// Import mocked modules after mock definitions
import * as auth from '../../../auth';

// Set necessary environment variables for the test environment
process.env.CLIENT_ID = 'mock-client-id';
process.env.CLIENT_SECRET = 'mock-client-secret';
process.env.PORT = '3001';

// Mock the auth module before importing it
jest.mock('../../../auth', () => {
  const mockClient = {
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
    __esModule: true,
    hubspotClient: mockClient,
    setAccessToken: jest.fn().mockResolvedValue(mockClient),
  };
});

// Mock other dependencies
jest.mock('../../../utils/utils', () => ({
  formatSingleRequestData: jest.fn(),
  getCustomerId: jest.fn().mockReturnValue('cust_123'),
}));

jest.mock('../../../utils/error', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock Prisma client
jest.mock('../../../prisma-client/prisma-initialization', () => ({
  __esModule: true,
  default: {
    authorization: {
      findFirst: jest.fn(),
      upsert: jest.fn().mockImplementation((args: any) => ({
        ...args.create,
      })),
    },
  },
}));

describe('Single Associations Client', () => {
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

    // Mock Prisma's findFirst and upsert methods
    const prisma = require('../../../prisma-client/prisma-initialization').default;
    prisma.authorization.findFirst.mockResolvedValue({
      accessToken: 'existing-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      refreshToken: 'existing-refresh-token',
      customerId: 'cust_123',
    });
    prisma.authorization.upsert.mockResolvedValue({
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 3600,
      expiresAt: new Date(Date.now() + 3600 * 1000),
      hsPortalId: 'hubspot-portal-id',
      customerId: 'cust_123',
    });
  });

  describe('saveSingleHubspotAssociation', () => {
    it('should successfully create an association', async () => {
      await saveSingleHubspotAssociation(mockMapping);

      // Verify authentication
      expect(auth.setAccessToken).toHaveBeenCalled();

      // Verify data formatting
      expect(utils.formatSingleRequestData).toHaveBeenCalledWith(mockMapping);

      // Verify API call
      expect(auth.hubspotClient.crm.associations.v4.basicApi.create).toHaveBeenCalledWith(
        mockFormattedData.objectType,
        mockFormattedData.objectId,
        mockFormattedData.toObjectType,
        mockFormattedData.toObjectId,
        mockFormattedData.associationType,
      );
    });

    it('should skip creation if associationCategory is missing', async () => {
      const formattedDataWithoutCategory = {
        ...mockFormattedData,
        associationType: [{ typeId: 1 }],
      };
      (utils.formatSingleRequestData as jest.Mock).mockReturnValue(formattedDataWithoutCategory);

      await saveSingleHubspotAssociation(mockMapping);

      expect(auth.hubspotClient.crm.associations.v4.basicApi.create).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      (auth.hubspotClient.crm.associations.v4.basicApi.create as jest.Mock).mockRejectedValue(mockError);

      await expect(saveSingleHubspotAssociation(mockMapping)).rejects.toThrow('API Error');
      expect(handleError).toHaveBeenCalledWith(mockError, 'There was an issue saving this association in HubSpot');
    });

    it('should handle authentication errors', async () => {
      (auth.setAccessToken as jest.Mock).mockRejectedValue(new Error('Auth failed'));

      await expect(saveSingleHubspotAssociation(mockMapping)).rejects.toThrow('Auth failed');
    });
  });

  describe('archiveSingleHubspotAssociation', () => {
    it('should successfully archive an association', async () => {
      await archiveSingleHubspotAssociation(mockMapping);

      // Verify authentication
      expect(auth.setAccessToken).toHaveBeenCalled();

      // Verify data formatting
      expect(utils.formatSingleRequestData).toHaveBeenCalledWith(mockMapping);

      // Verify API call
      expect(auth.hubspotClient.crm.associations.v4.basicApi.archive).toHaveBeenCalledWith(
        mockFormattedData.objectType,
        mockFormattedData.objectId,
        mockFormattedData.toObjectType,
        mockFormattedData.toObjectId,
      );
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      (auth.hubspotClient.crm.associations.v4.basicApi.archive as jest.Mock).mockRejectedValue(mockError);

      await expect(archiveSingleHubspotAssociation(mockMapping)).rejects.toThrow('API Error');
      expect(handleError).toHaveBeenCalledWith(mockError, 'There was an issue archiving this association in HubSpot');
    });

    it('should handle authentication errors', async () => {
      (auth.setAccessToken as jest.Mock).mockRejectedValue(new Error('Auth failed'));

      await expect(archiveSingleHubspotAssociation(mockMapping)).rejects.toThrow('Auth failed');
    });

    it('should handle malformed data', async () => {
      (utils.formatSingleRequestData as jest.Mock).mockReturnValue({});

      await expect(archiveSingleHubspotAssociation(mockMapping)).rejects.toThrow();
    });
  });
});
