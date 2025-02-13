import { AssociationMapping } from '@prisma/client';
import { hubspotClient } from '../../../auth';
import { saveBatchHubspotAssociation, archiveBatchHubspotAssociation } from '../../../hubspot-client/batchAssociations';
import * as utils from '../../../utils/utils';
import handleError from '../../../utils/error';

jest.mock('../../../auth', () => ({
  hubspotClient: {
    setAccessToken: jest.fn(),
    crm: {
      associations: {
        v4: {
          batchApi: {
            create: jest.fn(),
            archive: jest.fn(),
          },
        },
      },
    },
  },
  setAccessToken: jest.fn(),
}));

jest.mock('../../../utils/utils', () => ({
  __esModule: true,
  formatBatchRequestData: jest.fn(),
  formatBatchArchiveRequest: jest.fn(),
  getCustomerId: jest.fn(),
  checkAccessToken: jest.fn(),
}));

jest.mock('../../../utils/error', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Batch Associations HubSpot Client', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    (utils.getCustomerId as jest.Mock).mockReturnValue('cust_123');
    (utils.checkAccessToken as jest.Mock).mockImplementation((token) => {
      if (!token) throw new Error('No access token available');
    });
  });

  describe('saveBatchHubspotAssociation', () => {
    it('should successfully create batch associations', async () => {
      const mockFormattedRequest = {
        fromObjectType: 'contact',
        toObjectType: 'company',
        inputs: [{ from: { id: 'hub_123' }, to: { id: 'hub_456' }, type: 'primary_contact' }],
      };

      (utils.formatBatchRequestData as jest.Mock).mockReturnValue(mockFormattedRequest);

      await saveBatchHubspotAssociation([mockMapping]);

      expect(hubspotClient.setAccessToken).toHaveBeenCalledWith('mock-token');
      expect(hubspotClient.crm.associations.v4.batchApi.create).toHaveBeenCalledWith(
        'contact',
        'company',
        { inputs: mockFormattedRequest.inputs },
      );
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      (hubspotClient.crm.associations.v4.batchApi.create as jest.Mock).mockRejectedValue(mockError);

      await expect(saveBatchHubspotAssociation([mockMapping]))
        .rejects
        .toThrow('API Error');

      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue saving these associations in HubSpot',
      );
    });
  });

  describe('archiveBatchHubspotAssociation', () => {
    it('should successfully archive batch associations', async () => {
      const mockFormattedRequest = {
        fromObjectType: 'contact',
        toObjectType: 'company',
        inputs: [{ fromObjectId: 'hub_123', toObjectId: 'hub_456' }],
      };

      (utils.formatBatchArchiveRequest as jest.Mock).mockReturnValue(mockFormattedRequest);

      await archiveBatchHubspotAssociation([mockMapping]);

      expect(hubspotClient.setAccessToken).toHaveBeenCalledWith('mock-token');
      expect(hubspotClient.crm.associations.v4.batchApi.archive).toHaveBeenCalledWith(
        'contact',
        'company',
        { inputs: mockFormattedRequest.inputs },
      );
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      (hubspotClient.crm.associations.v4.batchApi.archive as jest.Mock).mockRejectedValue(mockError);

      await expect(archiveBatchHubspotAssociation([mockMapping]))
        .rejects
        .toThrow('API Error');

      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue archiving associations in HubSpot',
      );
    });
  });
});
