import { AssociationMapping } from '@prisma/client';
import { hubspotClient, setAccessToken } from '../auth';
import handleError from '../utils/error';
import { formatSingleRequestData } from '../utils/utils';

async function saveSingleHubspotAssociation(data: AssociationMapping) {
  setAccessToken();

  const {
    objectId, objectType, toObjectId, toObjectType, associationType,
  } = formatSingleRequestData(data);

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
  } catch (error: unknown) {
    handleError(error, 'There was an issue saving this association in HubSpot');
    throw error;
  }
}

async function archiveSingleHubspotAssociation(data: AssociationMapping) {
  setAccessToken();

  const {
    objectId, objectType, toObjectId, toObjectType,
  } = formatSingleRequestData(data);

  try {
    await hubspotClient.crm.associations.v4.basicApi.archive(objectType, objectId, toObjectType, toObjectId);
  } catch (error: unknown) {
    handleError(error, 'There was an issue archiving this association in HubSpot');
    throw error;
  }
}

export { saveSingleHubspotAssociation, archiveSingleHubspotAssociation };
