import { AssociationMapping } from '@prisma/client';
import { hubspotClient, getAccessToken } from '../auth';
import handleError from '../utils/error';
import { formatBatchArchiveRequest, formatBatchRequestData, getCustomerId } from '../utils/utils';

async function saveBatchHubspotAssociation(data: AssociationMapping[]) {
  const customerId = getCustomerId();
  const accessToken = await getAccessToken(customerId);
  const formattedRequest = formatBatchRequestData(data);

  if (accessToken) hubspotClient.setAccessToken(accessToken);

  try {
    await hubspotClient.crm.associations.v4.batchApi.create(
      formattedRequest.fromObjectType,
      formattedRequest.toObjectType,
      { inputs: formattedRequest.inputs },
    );
  } catch (error: any) {
    handleError('There was an issue saving these associations in HubSpot', error);
  }
}

async function archiveBatchHubspotAssociation(data: AssociationMapping[]) {
  const customerId = getCustomerId();
  const accessToken = await getAccessToken(customerId);
  const formattedData = formatBatchArchiveRequest(data);

  if (accessToken) hubspotClient.setAccessToken(accessToken);

  try {
    if (formattedData) {
      await hubspotClient.crm.associations.v4.batchApi.archive(
        formattedData.fromObjectType,
        formattedData.toObjectType,
        { inputs: formattedData.inputs },
      );
    }
  } catch (error: any) {
    handleError('There was an issue saving this association in HubSpot', error);
  }
}

export { saveBatchHubspotAssociation, archiveBatchHubspotAssociation };
