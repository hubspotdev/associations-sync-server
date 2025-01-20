import { AssociationMapping } from '@prisma/client';
import { hubspotClient, getAccessToken } from '../../../auth';
import { saveBatchHubspotAssociation, archiveBatchHubspotAssociation } from '../../../hubspot-client/batchAssociations';
import * as utils from '../../../utils/utils';

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
  getAccessToken: jest.fn(),
}));

jest.mock('../../../utils/utils', () => ({
  formatBatchRequestData: jest.fn(),
  formatBatchArchiveRequest: jest.fn(),
  getCustomerId: jest.fn(),
  checkAccessToken: jest.fn(),
  handleError: jest.fn(),
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

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    (console.log as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (utils.handleError as jest.Mock).mockImplementation((error, message) => {
      console.error(message, error);
    });
    (utils.getCustomerId as jest.Mock).mockReturnValue('cust_123');
    (utils.checkAccessToken as jest.Mock).mockImplementation((token) => {
      if (!token) throw new Error('No access token available');
    });
    (getAccessToken as jest.Mock).mockResolvedValue('mock-token');
    (utils.formatBatchArchiveRequest as jest.Mock).mockReturnValue({
      fromObjectType: 'contact',
      toObjectType: 'company',
      inputs: [{ fromObjectId: 'hub_123', toObjectId: 'hub_456' }],
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

    it('should throw error when access token is missing', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue(null);

      await expect(saveBatchHubspotAssociation([mockMapping]))
        .rejects
        .toThrow('No access token available');

      expect(hubspotClient.setAccessToken).not.toHaveBeenCalled();
      expect(hubspotClient.crm.associations.v4.batchApi.create).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      (hubspotClient.crm.associations.v4.batchApi.create as jest.Mock).mockRejectedValue(mockError);

      await expect(saveBatchHubspotAssociation([mockMapping]))
        .rejects
        .toThrow('API Error');
      expect(console.error).toHaveBeenCalled();
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

    it('should handle missing access token', async () => {
      (getAccessToken as jest.Mock).mockResolvedValue(null);

      await expect(archiveBatchHubspotAssociation([mockMapping]))
        .rejects
        .toThrow('No access token available');

      expect(hubspotClient.setAccessToken).not.toHaveBeenCalled();
      expect(hubspotClient.crm.associations.v4.batchApi.archive).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockError = new Error('API Error');
      (hubspotClient.crm.associations.v4.batchApi.archive as jest.Mock).mockRejectedValue(mockError);

      // Clear the mock before the test
      (utils.handleError as jest.Mock).mockClear();

      // Expect the function to throw
      await expect(archiveBatchHubspotAssociation([mockMapping]))
        .rejects
        .toThrow('API Error');

      // Verify handleError was called with correct parameters
      expect(utils.handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue archiving associations in HubSpot',
      );
    });
  });
});
