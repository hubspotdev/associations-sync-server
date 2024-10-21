import { AssociationMapping } from '@prisma/client';
// import {batchInputPublicAssociationMultiPost, BatchInputPublicAssociationMultiArchive} from "@hubspot/api-client"
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/companies';
import { AssociationSpec } from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';
import { hubspotClient, getAccessToken } from './auth';
import { getCustomerId } from './utils/utils';
import handleError from './utils/error';
import { AssociationRequest, AssociationBatchRequest, AssociationBatchArchiveRequest } from '../types/common';

function formatSingleRequestData(data: AssociationMapping): AssociationRequest {
  const associationSpec: AssociationSpec = {
    associationCategory: data.associationCategory as AssociationSpecAssociationCategoryEnum, // Type casting if confident
    associationTypeId: data.associationTypeId,
  };

  return {
    objectType: data.fromObjectType, // Assign from object type
    objectId: data.fromHubSpotObjectId, // Use fromHubSpotObjectId as ID for 'from'
    toObjectType: data.toObjectType, // Assign to object type
    toObjectId: data.toHubSpotObjectId, // Use toHubSpotObjectId as ID for 'to'
    associationType: [associationSpec], // Apply type casting if necessary
  };
}

function formatBatchRequestData(data: any): AssociationBatchRequest {
  return {
    objectType: data.fromObjectType, // Assign from object type
    objectId: data.hubSpotAssociationLabel, // Use hubSpotAssociationLabel as ID for 'from'
    toObjectType: data.toObjectType, // Assign to object type
    toObjectId: data.toObjectId, // Use nativeAssociationLabel as ID for 'to'
    associations: data.associations, // Set associationType, default if undefined
  };
}

function formatBatchArchiveRequest(data: any): AssociationBatchArchiveRequest {
  return {
    objectType: data.fromObjectType, // Assign from object type
    toObjectType: data.toObjectType, // Assign to object type
    associations: data.associations, // Set associationType, default if undefined
  };
}

async function saveBatchHubspotAssociation(data: AssociationMapping) {
  // const associationRequest = {
  //   fromObjectType: "contact",
  //   fromObjectId: "1234567890",
  //   toObjectType: "company",
  //   toObjectId: "9876543210",
  //   associationType: "default",
  // };
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  const { objectType, toObjectType, associations } = formatBatchRequestData(data);
  if (accessToken) hubspotClient.setAccessToken(accessToken);
  try {
    await hubspotClient.crm.associations.v4.batchApi.create(objectType, toObjectType, associations);
  } catch (error:any) {
    handleError('There was an issue saving these associations in HubSpot', error);
  }
}

async function saveSingleHubspotAssociation(data: AssociationMapping) {
// const associationRequest = {
//   fromObjectType: "contact",
//   fromObjectId: "1234567890",
//   toObjectType: "company",
//   toObjectId: "9876543210",
//   associationType: "default",
// };
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  const {
    objectId, objectType, toObjectId, toObjectType, associationType,
  } = formatSingleRequestData(data);

  if (accessToken) hubspotClient.setAccessToken(accessToken);
  try {
    if (associationType[0].associationCategory) {
      // eslint-disable-next-line max-len
      await hubspotClient.crm.associations.v4.basicApi.create(objectType, objectId, toObjectType, toObjectId, associationType);
    }
  } catch (error:any) {
    handleError('There was an issue saving this association in HubSpot', error);
  }
}

async function archiveSingleHubspotAssociation(data: AssociationMapping) {
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  const {
    objectId, objectType, toObjectId, toObjectType,
  } = formatSingleRequestData(data);
  if (accessToken) hubspotClient.setAccessToken(accessToken);
  try {
    await hubspotClient.crm.associations.v4.basicApi.archive(objectType, objectId, toObjectType, toObjectId);
  } catch (error:any) {
    handleError('There was an issue archiving this association in HubSpot', error);
  }
}

async function archiveBatchHubspotAssociation(data: AssociationMapping[]) {
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  const { objectType, toObjectType, associations } = formatBatchArchiveRequest(data);
  if (accessToken) hubspotClient.setAccessToken(accessToken);
  try {
    await hubspotClient.crm.associations.v4.batchApi.archive(objectType, toObjectType, associations);
  } catch (error:any) {
    handleError('There was an issue saving this association in HubSpot', error);
  }
}

// async function getContactFromHubspot(data: any){
//   hubspotClient.crm.properties.coreApi.getById
// }
export {
  saveSingleHubspotAssociation, saveBatchHubspotAssociation, archiveSingleHubspotAssociation, archiveBatchHubspotAssociation,
};
