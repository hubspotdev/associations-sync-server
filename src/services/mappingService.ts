import { AssociationMapping } from '@prisma/client';
import { saveSingleHubspotAssociation } from '../hubspot-client/singleAssociations';
import { saveDBMapping } from '../prisma-client/mappedAssociations';
import {
  saveBatchDBMapping,
  getBatchDBAssociationMappings,
  deleteBatchDBMappings,
} from '../prisma-client/batchAssociations';
import { saveBatchHubspotAssociation } from '../hubspot-client/batchAssociations';

export async function createMapping(mappingData: AssociationMapping) {
  const [hubspotResponse, dbResponse] = await Promise.all([
    saveSingleHubspotAssociation(mappingData),
    saveDBMapping(mappingData),
  ]);

  if (hubspotResponse === undefined || !dbResponse) {
    throw new Error('Failed to save association');
  }

  return {
    hubspotResponse,
    dbResponse,
  };
}

export async function createBatchMappings(mappings: AssociationMapping[]) {
  if (!Array.isArray(mappings) || mappings.length === 0) {
    throw new Error('Invalid request: mappings must be a non-empty array');
  }

  const [hubspotResponse, dbResponse] = await Promise.all([
    saveBatchHubspotAssociation(mappings),
    saveBatchDBMapping(mappings),
  ]);

  return {
    hubspotResponse,
    dbResponse,
  };
}

export async function deleteBatchMappings(mappingIds: string[]) {
  if (!Array.isArray(mappingIds) || mappingIds.length === 0) {
    throw new Error('Invalid or empty mappingIds array');
  }

  const associationMappings = await getBatchDBAssociationMappings(mappingIds);
  const response = await deleteBatchDBMappings(mappingIds);

  if (!response) {
    return null;
  }

  return {
    deletedCount: associationMappings.length,
    deletedRecords: associationMappings,
  };
}
