import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/companies';
import { AssociationMapping, AssociationDefinition } from '@prisma/client';
import { AssociationSpec } from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';
import {
  AssociationRequest, AssociationDefinitionCreateRequest, AssociationBatchRequest,
} from '../../types/common';

const PORT = 3001;
const getCustomerId = () => '1'; // faking this because building an account provisiong/login system is out of scope

export function formatSingleRequestData(data: AssociationMapping): AssociationRequest {
  const associationSpec: AssociationSpec = {
    associationCategory: data.associationCategory as AssociationSpecAssociationCategoryEnum, // Type casting if confident
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

export function formatDefinitionPostRequest(def: any): AssociationDefinitionCreateRequest {
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

export function formatDefinitionUpdateRequest(def: any) {
  return {
    fromObject: def.fromObjectType,
    toObject: def.toObjectType,
    requestInfo: {
      label: def.associationLabel || '',
      associationTypeId: def.toTypeId,
      inverseLabel: def.inverseLabel || undefined,
    },
  };
}

export function formatBatchRequestData(data: any): AssociationBatchRequest {
  return {
    objectType: data.fromObjectType,
    objectId: data.objectId,
    toObjectType: data.toObjectType,
    toObjectId: data.toObjectId,
    associations: data.associations,
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
export function formaCreateCardinalityRequest(response: any, data: AssociationDefinition) {
  const inputs: any[] = [];

  if (data.fromCardinality) {
    inputs.push({
      typeId: response.results[0].typeId,
      category: response.results[0].category,
      maxToObjectIds: data.fromCardinality,
    });
  }

  if (data.toCardinality) {
    inputs.push({
      typeId: response.results[1].typeId,
      category: response.results[1].category,
      maxToObjectIds: data.toCardinality,
    });
  }

  return { inputs };
}

export function formatUpdateCardinalityRequest(data: AssociationDefinition) {
  const inputs: any[] = [];
  if (data.fromCardinality) {
    inputs.push({
      typeId: data.toTypeId,
      category: data.associationCategory,
      maxToObjectIds: data.toCardinality,
    });
  }

  if (data.toCardinality) {
    inputs.push({
      typeId: data.fromTypeId,
      category: data.associationCategory,
      maxToObjectIds: data.fromCardinality,
    });
  }

  return { inputs };
}

export { PORT, getCustomerId };
