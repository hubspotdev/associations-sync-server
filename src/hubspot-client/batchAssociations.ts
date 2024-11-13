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
    const response = await hubspotClient.crm.associations.v4.batchApi.create(
      formattedRequest.fromObjectType,
      formattedRequest.toObjectType,
      { inputs: formattedRequest.inputs },
    );
    console.log('response from hubspot', response);
  } catch (error: any) {
    handleError('There was an issue saving these associations in HubSpot', error);
  }
}

async function archiveBatchHubspotAssociation(data: AssociationMapping[]) {
  const customerId = getCustomerId();
  const accessToken = await getAccessToken(customerId);
  const formattedData = formatBatchArchiveRequest(data);
  console.log(
    'formattedData + data',
    // formattedData,
    formattedData?.fromObjectType,
    formattedData?.toObjectType,
    formattedData?.inputs,
  );
  if (accessToken) hubspotClient.setAccessToken(accessToken);

  try {
    if (formattedData) {
      const response = await hubspotClient.crm.associations.v4.batchApi.archive(
        formattedData.fromObjectType,
        formattedData.toObjectType,
        { inputs: formattedData.inputs },
      );
      console.log('response', response);
    }
  } catch (error: any) {
    handleError('There was an issue saving this association in HubSpot', error);
  }
}

export { saveBatchHubspotAssociation, archiveBatchHubspotAssociation };
