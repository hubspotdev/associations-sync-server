import { AssociationMapping } from '@prisma/client';
import { hubspotClient, getAccessToken } from '../auth';
import handleError from '../utils/error';
import { formatSingleRequestData, getCustomerId } from '../utils/utils';

async function saveSingleHubspotAssociation(data: AssociationMapping) {
  const customerId = getCustomerId();
  const accessToken = await getAccessToken(customerId);
  const {
    objectId, objectType, toObjectId, toObjectType, associationType,
  } = formatSingleRequestData(data);

  if (accessToken) hubspotClient.setAccessToken(accessToken);

  try {
    if (associationType[0].associationCategory) {
      await hubspotClient.crm.associations.v4.basicApi.create(
        objectType,
        objectId,
        toObjectType,
        toObjectId,
        associationType,
      );
    }
  } catch (error: any) {
    handleError('There was an issue saving this association in HubSpot', error);
  }
}

async function updateSingleHubspotAssociation(data: AssociationMapping) {
  const customerId = getCustomerId();
  const accessToken = await getAccessToken(customerId);
  const {
    objectId, objectType, toObjectId, toObjectType, associationType,
  } = formatSingleRequestData(data);

  if (accessToken) hubspotClient.setAccessToken(accessToken);

  try {
    if (associationType[0].associationCategory) {
      await hubspotClient.crm.associations.v4.basicApi.create(
        objectType,
        objectId,
        toObjectType,
        toObjectId,
        associationType,
      );
    }
  } catch (error: any) {
    handleError('There was an issue saving this association in HubSpot', error);
  }
}

async function archiveSingleHubspotAssociation(data: AssociationMapping) {
  const customerId = getCustomerId();
  const accessToken = await getAccessToken(customerId);
  const {
    objectId, objectType, toObjectId, toObjectType,
  } = formatSingleRequestData(data);

  if (accessToken) hubspotClient.setAccessToken(accessToken);

  try {
    await hubspotClient.crm.associations.v4.basicApi.archive(objectType, objectId, toObjectType, toObjectId);
  } catch (error: any) {
    handleError('There was an issue archiving this association in HubSpot', error);
  }
}

export { saveSingleHubspotAssociation, archiveSingleHubspotAssociation };
