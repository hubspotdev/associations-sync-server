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
// type HubspotBatchInput = Parameters<typeof hubspotClient.crm.associations.v4.batchApi.create>[2];

// export function formatBatchRequestData(data: AssociationMapping[]): {
//   fromObjectType: string;
//   toObjectType: string;
//   inputs: HubspotBatchInput; // Use the type here
// } {
//   const { fromObjectType, toObjectType } = data[0];

//   const formattedInputs = data.map((item: any) => ({
//     types: [
//       {
//         associationCategory: item.associationCategory,
//         associationTypeId: item.associationTypeId,
//       },
//     ],
//     _from: item.fromHubSpotObjectId,
//     to: item.toHubSpotObjectId,
//   }));
//   return {
//     fromObjectType,
//     toObjectType,
//     inputs: {
//       inputs: formattedInputs, // Nest the array under an inputs property
//     },
//   };
// }
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
// export function formatBatchRequestData(data: AssociationMapping[]) {
//   // Extract object types from the first item
//   const { fromObjectType, toObjectType } = data[0];

//   // Map data to the expected input format
//   const formattedInputs = data.map((item) => ({
//     types: [
//       {
//         associationCategory: item.associationCategory,
//         associationTypeId: item.associationTypeId,
//       },
//     ],
//     _from: item.fromHubSpotObjectId,
//     to: item.toHubSpotObjectId,
//   }));

//   return {
//     fromObjectType,
//     toObjectType,
//     inputs: formattedInputs,
//   };
// }
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

// export function mergeAndFlagDiscrepancies(dbData: any[], hubspotData: any[]) {
//   // Implement merging logic here
//   // Flag any differences between DB and HubSpot data
//   return dbData.map(dbItem => {
//     const hubspotItem = hubspotData.find(h => h.id === dbItem.hubspotId);
//     return {
//       ...dbItem,
//       hasDiscrepancy: !hubspotItem || !areEquivalent(dbItem, hubspotItem),
//       hubspotData: hubspotItem || null
//     };
//   });
// }

export { PORT, getCustomerId };
