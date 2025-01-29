import { AssociationDefinition } from '@prisma/client';
import { hubspotClient, getAccessToken } from '../auth';
import handleError from '../utils/error';
import { AssociationDefinitionArchiveRequest } from '../../types/common';
import {
  formatDefinitionPostRequest,
  formatDefinitionUpdateRequest,
  formaCreateCardinalityRequest,
  formatUpdateCardinalityRequest,
  getCustomerId,
  checkAccessToken,
} from '../utils/utils';

async function saveAssociationDefinitionConfiguration(
  response: any,
  data: AssociationDefinition,
  fromObject: string,
  toObject: string,
) {
  const inputs = formaCreateCardinalityRequest(response, data);
  console.log('Here are the formatted association definition inputs for cardinality', inputs, fromObject, toObject);
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  checkAccessToken(accessToken);
  hubspotClient.setAccessToken(accessToken);

  try {
    const definitionWithConfig = await hubspotClient.apiRequest({
      method: 'POST',
      path: `/crm/v4/associations/definitions/configurations/${fromObject}/${toObject}/batch/create`,
      body: inputs,
    });
    let secondDefinitionWithConfig;
    console.log('Configured definition response:', definitionWithConfig);
    if (inputs.inputs.length === 2) {
      secondDefinitionWithConfig = await hubspotClient.apiRequest({
        method: 'POST',
        path: `/crm/v4/associations/definitions/configurations/${toObject}/${fromObject}/batch/create`,
        body: inputs,
      });
      console.log('attempting second post', secondDefinitionWithConfig);
    }
    return { config1: definitionWithConfig, config2: secondDefinitionWithConfig };
  } catch (error:unknown) {
    handleError(error, 'There was an issue configuring the association definition');
    throw error;
  }
}

// This function makes two requests to HubSpot in case of a bidirectional association
async function updateAssociationDefinitionConfiguration(
  data: AssociationDefinition,
  fromObject: string,
  toObject: string,
) {
  console.log('Here is the data', data);
  const inputs = formatUpdateCardinalityRequest(data);
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  checkAccessToken(accessToken);
  hubspotClient.setAccessToken(accessToken);

  console.log('Here is the inputs', { inputs: [inputs.inputs[0]] });
  try {
    if (Array.isArray(inputs.inputs)) {
      const definitionWithConfig = await hubspotClient.apiRequest({
        method: 'POST',
        path: `/crm/v4/associations/definitions/configurations/${fromObject}/${toObject}/batch/update`,
        body: { inputs: [inputs.inputs[0]] },
      });

      // Check first response
      if (definitionWithConfig.status === 400) {
        const errorBody = await definitionWithConfig.json();
        throw new Error(`Failed to update ${fromObject} to ${toObject} configuration: ${JSON.stringify(errorBody)}`);
      }

      let secondDefinitionWithConfig;
      if (inputs.inputs.length === 2) {
        secondDefinitionWithConfig = await hubspotClient.apiRequest({
          method: 'POST',
          path: `/crm/v4/associations/definitions/configurations/${toObject}/${fromObject}/batch/update`,
          body: { inputs: [inputs.inputs[1]] },
        });

        // Check second response
        if (secondDefinitionWithConfig.status === 400) {
          const errorBody = await secondDefinitionWithConfig.json();
          throw new Error(`Failed to update ${toObject} to ${fromObject} configuration: ${JSON.stringify(errorBody)}`);
        }
      }

      // If both requests were successful, return the combined response
      return {
        firstConfig: await definitionWithConfig.json(),
        secondConfig: secondDefinitionWithConfig ? await secondDefinitionWithConfig.json() : undefined,
      };
    }

    throw new Error('Invalid inputs format: inputs array is missing or empty');
  } catch (error: unknown) {
    if (error instanceof Error) {
      handleError(error, 'There was an issue configuring the association definition');
      throw error;
    }
    // Handle non-Error objects
    const errorMessage = error instanceof Object ? JSON.stringify(error) : 'Unknown error occurred';
    const wrappedError = new Error(`Configuration update failed: ${errorMessage}`);
    handleError(wrappedError, 'There was an issue configuring the association definition');
    throw wrappedError;
  }
}

async function saveAssociationDefinition(data: AssociationDefinition) {
  const formattedData = formatDefinitionPostRequest(data);
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  checkAccessToken(accessToken);
  hubspotClient.setAccessToken(accessToken);

  const { fromObject, toObject, requestInfo } = formattedData;
  try {
    const response = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(fromObject, toObject, requestInfo);
    let configResponse;
    console.log('Here is the response from the create request', response);
    if (data.fromMaxObjects || data.toMaxObjects) {
      configResponse = await saveAssociationDefinitionConfiguration(response, data, fromObject, toObject);
    }
    return configResponse ? { configResponse, response } : response;
  } catch (error: unknown) {
    handleError(error, 'There was an issue saving the association definition in HubSpot');
    throw error;
  }
}

async function updateAssociationDefinition(data: AssociationDefinition) {
  const formattedData = formatDefinitionUpdateRequest(data);
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  checkAccessToken(accessToken);
  hubspotClient.setAccessToken(accessToken);

  const { fromObject, toObject, requestInfo } = formattedData;
  try {
    if (requestInfo.associationTypeId) {
      await hubspotClient.crm.associations.v4.schema.definitionsApi.update(fromObject, toObject, {
        ...requestInfo,
        associationTypeId: requestInfo.associationTypeId,
      });
    }
    if (data.toTypeId && requestInfo.label) {
      await hubspotClient.crm.associations.v4.schema.definitionsApi.update(fromObject, toObject, {
        associationTypeId: data.toTypeId,
        label: requestInfo.label,
        inverseLabel: requestInfo.inverseLabel,
      });
    }

    let cardinalityRepsonse;
    if (data.fromMaxObjects || data.toMaxObjects) {
      cardinalityRepsonse = await updateAssociationDefinitionConfiguration(data, fromObject, toObject);
    }
    return cardinalityRepsonse || null;
  } catch (error: unknown) {
    handleError(error, 'There was an issue updating the association definition in HubSpot');
    throw error;
  }
}

async function archiveAssociationDefinition(data: AssociationDefinitionArchiveRequest) {
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  checkAccessToken(accessToken);
  hubspotClient.setAccessToken(accessToken);

  const { fromObjectType, toObjectType, associationTypeId } = data;

  try {
    const response = await hubspotClient.crm.associations.v4.schema.definitionsApi.archive(
      fromObjectType,
      toObjectType,
      associationTypeId,
    );
    console.log('Archived HubSpot association definition', response);
    return response;
  } catch (error: unknown) {
    handleError(error, 'There was an issue archiving the association definition in HubSpot');
    throw error;
  }
}

async function getAllAssociationDefinitionsByType(data: { toObject:string, fromObject:string }) {
  const { toObject, fromObject } = data;
  const customerId = getCustomerId();
  const accessToken: string | void | null = await getAccessToken(customerId);
  checkAccessToken(accessToken);
  hubspotClient.setAccessToken(accessToken);

  try {
    const response = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(toObject, fromObject);
    return response;
  } catch (error:unknown) {
    handleError(error, 'There was an error getting all association definitions');
    throw error;
  }
}

export {
  getAllAssociationDefinitionsByType,
  saveAssociationDefinition,
  archiveAssociationDefinition,
  updateAssociationDefinition,
};
