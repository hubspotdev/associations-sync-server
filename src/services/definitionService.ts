import { AssociationDefinition } from '@prisma/client';
import {
  getDBAssociationDefinitionsByType,
  deleteDBAssociationDefinition,
  saveDBAssociationDefinition,
} from '../prisma-client/definitionAssociations';
import {
  saveAssociationDefinition,
  getAllAssociationDefinitionsByType,
} from '../hubspot-client/definitionAssociations';
import {
  getBatchDBAssociationMappingsByAssociationId,
  deleteBatchDBMappings,
} from '../prisma-client/batchAssociations';

interface GetDefinitionsParams {
  fromObject: string;
  toObject: string;
}

export async function getAssociationDefinitions({ fromObject, toObject }: GetDefinitionsParams) {
  const [dbAssociations, hubspotAssociations] = await Promise.all([
    getDBAssociationDefinitionsByType({ fromObject, toObject }),
    getAllAssociationDefinitionsByType({ fromObject, toObject }),
  ]);

  return {
    dbAssociations,
    hubspotAssociations,
  };
}

export async function deleteDefinitionAndRelatedMappings(associationId: string) {
  // First find and delete all related mappings
  const relatedMappings = await getBatchDBAssociationMappingsByAssociationId(associationId);

  if (relatedMappings.length > 0) {
    const mappingIds = relatedMappings.map((mapping) => mapping.id);
    await deleteBatchDBMappings(mappingIds);
  }

  const deletedDefinition = await deleteDBAssociationDefinition(associationId);

  return {
    deletedDefinition,
    deletedMappingsCount: relatedMappings.length,
  };
}

export async function createAssociationDefinition(definitionData: AssociationDefinition) {
  const hubspotResponse = await saveAssociationDefinition(definitionData);

  // Handle both possible response types
  const results = 'response' in hubspotResponse
    ? hubspotResponse.response.results
    : hubspotResponse.results;

  if (!results?.[0]?.typeId) {
    throw new Error('Invalid response from Hubspot: Missing primary typeId');
  }

  // Initialize IDs
  const fromTypeId = results[0].typeId;

  // For one-way associations (no inverseLabel), use typeId as associationTypeId
  if (results.length === 1 && !definitionData.inverseLabel) {
    const dbResponse = await saveDBAssociationDefinition({
      ...definitionData,
      fromTypeId,
      associationTypeId: fromTypeId,
      toTypeId: null,
    });

    return {
      hubspotResponse,
      dbResponse,
    };
  }

  // For two-way associations, handle as before
  const toTypeId = results[1]?.typeId || null;
  const dbResponse = await saveDBAssociationDefinition({
    ...definitionData,
    toTypeId,
    fromTypeId,
  });

  return {
    hubspotResponse,
    dbResponse,
  };
}
