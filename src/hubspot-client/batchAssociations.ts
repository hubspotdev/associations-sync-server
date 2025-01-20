import { AssociationMapping } from '@prisma/client';
import { hubspotClient, getAccessToken } from '../auth';
import handleError from '../utils/error';
import {
  formatBatchArchiveRequest, formatBatchRequestData, getCustomerId, checkAccessToken,
} from '../utils/utils';

async function saveBatchHubspotAssociation(data: AssociationMapping[]) {
  const customerId = getCustomerId();
  const accessToken = await getAccessToken(customerId);
  checkAccessToken(accessToken);
  hubspotClient.setAccessToken(accessToken);

  const formattedRequest = formatBatchRequestData(data);

  try {
    const response = await hubspotClient.crm.associations.v4.batchApi.create(
      formattedRequest.fromObjectType,
      formattedRequest.toObjectType,
      { inputs: formattedRequest.inputs },
    );
    console.log('response from hubspot', response);
    return response;
  } catch (error: unknown) {
    handleError(error, 'There was an issue saving these associations in HubSpot');
    throw error;
  }
}

async function archiveBatchHubspotAssociation(data: AssociationMapping[]) {
  const customerId = getCustomerId();
  const accessToken = await getAccessToken(customerId);
  checkAccessToken(accessToken);
  hubspotClient.setAccessToken(accessToken);

  const formattedData = formatBatchArchiveRequest(data);

  try {
    if (formattedData) {
      const response = await hubspotClient.crm.associations.v4.batchApi.archive(
        formattedData.fromObjectType,
        formattedData.toObjectType,
        { inputs: formattedData.inputs },
      );
      console.log('response', response);
    }
  } catch (error: unknown) {
    handleError(error, 'There was an issue saving this association in HubSpot');
  }
}

export { saveBatchHubspotAssociation, archiveBatchHubspotAssociation };
