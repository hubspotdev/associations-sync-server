import { AssociationDefinition } from '@prisma/client';
import { hubspotClient, getAccessToken } from '../auth';
import handleError from '../utils/error';
import {
  AssociationDefinitionArchiveRequest,
  AssociationDefinitionUpdateRequest,
} from '../../types/common';
import {
  formatDefinitionPostRequest,
  formatDefinitionUpdateRequest,
  formaCreateCardinalityRequest,
  formatUpdateCardinalityRequest,
  getCustomerId,
} from '../utils/utils';

async function saveAssociationDefinitionConfiguration(
  response: any,
  data: AssociationDefinition,
  fromObject: string,
  toObject: string,
) {
  const inputs = formaCreateCardinalityRequest(response, data);
  console.log('Here are the formatted association definition inputs for cardinality', inputs, fromObject, toObject);

  try {
    const definitionWithConfig = await hubspotClient.apiRequest({
      method: 'POST',
      path: `/crm/v4/associations/definitions/configurations/${fromObject}/${toObject}/batch/create`,
      body: inputs,
    });

    console.log('Configured definition response:', definitionWithConfig);
    if (inputs.inputs.length === 2) {
      const secondDefinitionWithConfig = await hubspotClient.apiRequest({
        method: 'POST',
        path: `/crm/v4/associations/definitions/configurations/${toObject}/${fromObject}/batch/create`,
        body: inputs,
      });
      console.log('attempting second post', secondDefinitionWithConfig);
    }
  } catch (error:unknown) {
    handleError(error, 'There was an issue configuring the association definition');
    throw error;
  }
}

async function getHubSpotAssociationDefinitionsByType(data: AssociationDefinitionUpdateRequest) {
  const { fromObject, toObject } = data;
  try {
    const results = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(fromObject, toObject);
    return results;
  } catch (error:unknown) {
    handleError(error, 'There was an issue getting the HubSpot association definition');
  }
}

async function updateAssociationDefinitionConfiguration(
  data: AssociationDefinition,
  fromObject: string,
  toObject: string,
) {
  const inputs = formatUpdateCardinalityRequest(data);
  console.log('Here are the formatted association definition inputs for cardinality', inputs, fromObject, toObject);

  try {
    const definitionWithConfig = await hubspotClient.apiRequest({
      method: 'POST',
      path: `/crm/v4/associations/definitions/configurations/${fromObject}/${toObject}/batch/update`,
      body: inputs,
    });
    if (inputs.inputs.length === 2) {
      const secondDefinitionWithConfig = await hubspotClient.apiRequest({
        method: 'POST',
        path: `/crm/v4/associations/definitions/configurations/${toObject}/${fromObject}/batch/create`,
        body: inputs,
      });
      console.log('attempting second post', secondDefinitionWithConfig);
    }
    console.log('Configured definition response:', definitionWithConfig);
    return definitionWithConfig;
  } catch (error:unknown) {
    handleError(error, 'There was an issue configuring the association definition');
    throw error;
  }
}

async function saveAssociationDefinition(data: AssociationDefinition) {
  const formattedData = formatDefinitionPostRequest(data);
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  if (accessToken) hubspotClient.setAccessToken(accessToken);
  const { fromObject, toObject, requestInfo } = formattedData;
  try {
    const response = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(fromObject, toObject, requestInfo);
    if (data.fromCardinality || data.toCardinality) {
      await saveAssociationDefinitionConfiguration(response, data, fromObject, toObject);
    }
    return response;
  } catch (error: unknown) {
    handleError(error, 'There was an issue saving the association definition in HubSpot');
    return undefined;
  }
}

async function updateAssociationDefinition(data: AssociationDefinition) {
  const formattedData = formatDefinitionUpdateRequest(data);
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  const { fromObject, toObject, requestInfo } = formattedData;

  if (accessToken) hubspotClient.setAccessToken(accessToken);

  try {
    await hubspotClient.crm.associations.v4.schema.definitionsApi.update(fromObject, toObject, requestInfo);
    if (data.fromCardinality || data.toCardinality) {
      await updateAssociationDefinitionConfiguration(data, fromObject, toObject);
    }
  } catch (error: unknown) {
    handleError(error, 'There was an issue updating the association definition in HubSpot');
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
  } catch (error: unknown) {
    handleError(error, 'There was an issue archiving the association definition in HubSpot');
  }
}

async function getAllAssociationDefinitions(data: { toObject:string, fromObject:string }) {
  const { toObject, fromObject } = data;
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  if (accessToken) hubspotClient.setAccessToken(accessToken);
  try {
    const response = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(toObject, fromObject);
    return response;
  } catch (error:unknown) {
    handleError(error, 'There was an error getting all association definitions');
  }
}

export {
  getAllAssociationDefinitions,
  saveAssociationDefinition,
  archiveAssociationDefinition,
  updateAssociationDefinition,
  getHubSpotAssociationDefinitionsByType,
};
