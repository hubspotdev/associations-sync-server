import { AssociationMapping } from '@prisma/client';
import { hubspotClient, getAccessToken } from '../../../auth';
import { saveSingleHubspotAssociation, archiveSingleHubspotAssociation } from '../../../hubspot-client/singleAssociations';
import * as utils from '../../../utils/utils';

jest.mock('../../../auth', () => ({
  hubspotClient: {
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
  },
  getAccessToken: jest.fn(),
}));

jest.mock('../../../utils/utils', () => ({
  formatSingleRequestData: jest.fn(),
  getCustomerId: jest.fn(),
  checkAccessToken: jest.fn(),
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
    objectId: 'hub_123',
    objectType: 'contact',
    toObjectId: 'hub_456',
    toObjectType: 'company',
    associationType: [{
      associationCategory: 'USER_DEFINED',
      typeId: 1,
    }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (utils.getCustomerId as jest.Mock).mockReturnValue('cust_123');
    (getAccessToken as jest.Mock).mockResolvedValue('mock-token');
    (utils.formatSingleRequestData as jest.Mock).mockReturnValue(mockFormattedData);
  });

  describe('saveSingleHubspotAssociation', () => {
    it('should successfully create single association', async () => {
      await saveSingleHubspotAssociation(mockMapping);

      expect(hubspotClient.setAccessToken).toHaveBeenCalledWith('mock-token');
      expect(hubspotClient.crm.associations.v4.basicApi.create).toHaveBeenCalledWith(
        mockFormattedData.objectType,
        mockFormattedData.objectId,
        mockFormattedData.toObjectType,
        mockFormattedData.toObjectId,
        mockFormattedData.associationType,
      );
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      (hubspotClient.crm.associations.v4.basicApi.create as jest.Mock).mockRejectedValue(mockError);

      await expect(saveSingleHubspotAssociation(mockMapping)).rejects.toThrow('API Error');

      expect(hubspotClient.crm.associations.v4.basicApi.create).toHaveBeenCalled();
    });
  });

  describe('archiveSingleHubspotAssociation', () => {
    it('should successfully archive single association', async () => {
      await archiveSingleHubspotAssociation(mockMapping);

      expect(hubspotClient.setAccessToken).toHaveBeenCalledWith('mock-token');
      expect(hubspotClient.crm.associations.v4.basicApi.archive).toHaveBeenCalledWith(
        mockFormattedData.objectType,
        mockFormattedData.objectId,
        mockFormattedData.toObjectType,
        mockFormattedData.toObjectId,
      );
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      (hubspotClient.crm.associations.v4.basicApi.archive as jest.Mock).mockRejectedValue(mockError);

      await expect(archiveSingleHubspotAssociation(mockMapping)).rejects.toThrow('API Error');

      expect(hubspotClient.crm.associations.v4.basicApi.archive).toHaveBeenCalled();
    });
  });
});
