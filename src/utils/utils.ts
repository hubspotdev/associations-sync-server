import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/companies';
import { AssociationMapping } from '@prisma/client';
import { AssociationSpec } from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';
import {
  AssociationRequest, AssociationDefinitionCreateRequest, AssociationBatchRequest,
} from '../../types/common';

const PORT = 3001;
const getCustomerId = () => '1'; // faking this because building an account provisiong/login system is out of scope

export { PORT, getCustomerId };

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
      associationTypeId: def.associationTypeId,
      inverseLabel: def.inverseLabel || undefined,
    },
  };
}

export function formatBatchRequestData(data: any): AssociationBatchRequest {
  return {
    objectType: data.fromObjectType,
    objectId: data.hubSpotAssociationLabel,
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
