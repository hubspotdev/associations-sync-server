import { AssociationMapping } from '@prisma/client';
import {
  BatchResponseLabelsBetweenObjectPairWithErrors,
} from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/BatchResponseLabelsBetweenObjectPairWithErrors';

import {
  BatchResponseLabelsBetweenObjectPair,
} from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/BatchResponseLabelsBetweenObjectPair';
import { hubspotClient, getAccessToken } from '../auth';
import handleError from '../utils/error';
import {
  formatBatchArchiveRequest, formatBatchRequestData, getCustomerId, checkAccessToken,
} from '../utils/utils';

// Type guard function
function isBatchResponseWithErrors(
  response: BatchResponseLabelsBetweenObjectPair | BatchResponseLabelsBetweenObjectPairWithErrors,
): response is BatchResponseLabelsBetweenObjectPairWithErrors {
  return response instanceof BatchResponseLabelsBetweenObjectPairWithErrors;
}

async function saveBatchHubspotAssociation(data: AssociationMapping[]): Promise<BatchResponseLabelsBetweenObjectPair> {
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

    if (isBatchResponseWithErrors(response) && response.errors) {
      // Handle each error individually
      response.errors.forEach((error) => handleError(error, 'There was an issue saving these associations in HubSpot'));
      // Still throw the first error to stop execution
      throw new Error(response.errors[0].message);
    } else {
      return response as BatchResponseLabelsBetweenObjectPair;
    }
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

  if (!formattedData) {
    throw new Error('Invalid data format for batch archive');
  }

  try {
    const response = await hubspotClient.crm.associations.v4.batchApi.archive(
      formattedData.fromObjectType,
      formattedData.toObjectType,
      { inputs: formattedData.inputs },
    );
    return response;
  } catch (error: unknown) {
    handleError(error, 'There was an issue archiving associations in HubSpot');
    throw error;
  }
}

export { saveBatchHubspotAssociation, archiveBatchHubspotAssociation };
