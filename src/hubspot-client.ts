import { AssociationMapping, AssociationDefinition } from '@prisma/client';
// import {batchInputPublicAssociationMultiPost, BatchInputPublicAssociationMultiArchive} from "@hubspot/api-client"
// import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/companies';
// import { AssociationSpec } from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';
import { hubspotClient, getAccessToken } from './auth';
import {
  getCustomerId,
  formatBatchArchiveRequest,
  formatBatchRequestData,
  formatDefinitionPostRequest,
  formatDefinitionUpdateRequest,
  formatSingleRequestData,
} from './utils/utils';
import handleError from './utils/error';
import {
  AssociationDefinitionArchiveRequest,
  AssociationDefinitionUpdateRequest,
} from '../types/common';

async function saveBatchHubspotAssociation(data: AssociationMapping) {
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
async function saveAssociationDefinition(data: AssociationDefinition) {
  const formattedData = formatDefinitionPostRequest(data);
  console.log('here is the formatted association definition data', formattedData);
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  const { fromObject, toObject, requestInfo } = formattedData;
  if (accessToken) hubspotClient.setAccessToken(accessToken);

  try {
    const response = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(fromObject, toObject, requestInfo);
    console.log('here is the formatted association definition data', response);
    return response;
  } catch (error: any) {
    handleError('There was an issue saving the association definition in HubSpot', error);
    return undefined;
  }
}

async function updateAssociationDefinition(data: AssociationDefinitionUpdateRequest) {
  const formattedData = formatDefinitionUpdateRequest(data);
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  const { fromObject, toObject, requestInfo } = formattedData;

  if (accessToken) hubspotClient.setAccessToken(accessToken);

  try {
    await hubspotClient.crm.associations.v4.schema.definitionsApi.update(fromObject, toObject, requestInfo);
  } catch (error: any) {
    handleError('There was an issue updating the association definition in HubSpot', error);
  }
}

async function archiveAssociationDefinition(data: AssociationDefinitionArchiveRequest) {
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  const { fromObjectType, toObjectType, associationTypeId } = data;
  console.log('data in archive association definition', data);
  if (accessToken) hubspotClient.setAccessToken(accessToken);

  try {
    const response = await hubspotClient.crm.associations.v4.schema.definitionsApi.archive(
      fromObjectType,
      toObjectType,
      associationTypeId,
    );
    console.log('Archived HubSpot association definition', response);
  } catch (error: any) {
    handleError('There was an issue archiving the association definition in HubSpot', error);
  }
}

async function saveSingleHubspotAssociation(data: AssociationMapping) {
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
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
  } catch (error:any) {
    handleError('There was an issue saving this association in HubSpot', error);
  }
}

async function getAllAssociationDefinitions(data: any) {
  const { toObject, fromObject } = data;
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  if (accessToken) hubspotClient.setAccessToken(accessToken);
  try {
    const response = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(toObject, fromObject);
    return response;
  } catch (error) {
    handleError(error, 'There was an error getting all association definitions');
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
  } catch (error:any) {
    handleError('There was an issue saving this association in HubSpot', error);
  }
}

export {
  getAllAssociationDefinitions,
  saveSingleHubspotAssociation,
  saveBatchHubspotAssociation,
  archiveSingleHubspotAssociation,
  archiveBatchHubspotAssociation,
  saveAssociationDefinition,
  archiveAssociationDefinition,
  updateAssociationDefinition,
};
