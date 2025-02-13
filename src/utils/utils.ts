// import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/companies';
import { AssociationMapping, AssociationDefinition } from '@prisma/client';
import {
  AssociationSpec,
  AssociationSpecAssociationCategoryEnum,
} from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';
import {
  AssociationRequest, AssociationDefinitionCreateRequest,
} from '../../types/common';

const PORT = 3001;
const getCustomerId = () => '1'; // faking this because buåilding an account provisiong/login system is out of scope

export function formatSingleRequestData(data: any): AssociationRequest {
  const associationSpec: AssociationSpec = {
    associationCategory: data.associationCategory,
    associationTypeId: data.associationTypeId,
  };

  return {
    objectType: data.fromObjectType,
    objectId: data.fromHubSpotObjectId,
    toObjectType: data.toObjectType,
    toObjectId: data.toHubSpotObjectId,
    associationType: [associationSpec],
  };
}

export function formatDefinitionPostRequest(def: AssociationDefinition): AssociationDefinitionCreateRequest {
  return {
    fromObject: def.fromObjectType,
    toObject: def.toObjectType,
    requestInfo: {
      label: def.associationLabel || '',
      name: def.name,
      inverseLabel: def.inverseLabel || undefined,
    },
  };
}

export function formatDefinitionUpdateRequest(def: AssociationDefinition) {
  return {
    fromObject: def.fromObjectType,
    toObject: def.toObjectType,
    requestInfo: {
      label: def.associationLabel || '',
      associationTypeId: def.associationTypeId,
      inverseLabel: def.inverseLabel || undefined,
    },
  };
}

const AssociationCategoryMapping = {
  HUBSPOT_DEFINED: AssociationSpecAssociationCategoryEnum.HubspotDefined,
  INTEGRATOR_DEFINED: AssociationSpecAssociationCategoryEnum.IntegratorDefined,
  USER_DEFINED: AssociationSpecAssociationCategoryEnum.UserDefined,
};

export function formatBatchRequestData(data: AssociationMapping[]) {
  const formattedInputs = data.map((item) => ({
    _from: { id: item.fromHubSpotObjectId },
    to: { id: item.toHubSpotObjectId }, // Changed from array to single PublicObjectId
    types: [{
      associationCategory: AssociationCategoryMapping[item.associationCategory],
      associationTypeId: item.associationTypeId,
    }],
  }));

  return {
    fromObjectType: data[0].fromObjectType,
    toObjectType: data[0].toObjectType,
    inputs: formattedInputs,
  };
}

export function formatBatchArchiveRequest(definitions: AssociationMapping[]) {
  if (definitions.length === 0) return null;

  const { fromObjectType } = definitions[0];
  const { toObjectType } = definitions[0];

  const inputs = definitions.map((def) => ({
    _from: { id: def.fromHubSpotObjectId },
    to: [{ id: def.toHubSpotObjectId }],
  }));

  return {
    fromObjectType,
    toObjectType,
    inputs,
  };
}

// Utility function to create the request body
export function formatCreateCardinalityRequest(response: any, data: AssociationDefinition) {
  const inputs: any[] = [];

  if (data.toMaxObjects) {
    inputs.push({
      typeId: response.results[0].typeId,
      category: response.results[0].category,
      maxToObjectIds: data.toMaxObjects,
    });
  }

  if (data.fromMaxObjects) {
    inputs.push({
      typeId: response.results[1].typeId,
      category: response.results[1].category,
      maxToObjectIds: data.fromMaxObjects,
    });
  }

  return { inputs };
}

export function formatUpdateCardinalityRequest(data: AssociationDefinition) {
  const inputs: any[] = [];

  if (data.fromMaxObjects) {
    inputs.push({
      typeId: data.fromTypeId || data.associationTypeId,
      category: data.associationCategory,
      maxToObjectIds: data.fromMaxObjects,
    });
  }

  if (data.toMaxObjects) {
    inputs.push({
      typeId: data.toTypeId || data.associationTypeId,
      category: data.associationCategory,
      maxToObjectIds: data.toMaxObjects,
    });
  }
  console.log('Here is the formatted inputs', inputs);

  return { inputs };
}

export { PORT, getCustomerId };
