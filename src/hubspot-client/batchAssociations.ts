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
      data[0].fromObjectType,
      data[0].toObjectType,
      // formattedRequest.fromObjectType,
      // formattedRequest.toObjectType,
      formattedRequest.inputs,
    );
  } catch (error: any) {
    handleError('There was an issue saving these associations in HubSpot', error);
  }
}

async function getAllProperties(objectType){
  const properties = hubspotClient.crm.properties.coreApi.getAll(objectType)
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
