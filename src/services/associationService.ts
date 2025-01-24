import {
  getBatchDBAssociationMappingsByAssociationId,
  deleteBatchDBMappings,
} from '../prisma-client/batchAssociations';
import { deleteDBAssociation } from '../prisma-client/singleAssociations';

export default async function deleteAssociationAndRelatedMappings(associationId: string) {
  // First find and delete all related mappings
  const relatedMappings = await getBatchDBAssociationMappingsByAssociationId(associationId);

  if (relatedMappings.length > 0) {
    const mappingIds = relatedMappings.map((mapping) => mapping.id);
    await deleteBatchDBMappings(mappingIds);
  }

  // Then delete the association itself
  const result = await deleteDBAssociation(associationId);

  return {
    deletedAssociation: result,
    deletedMappingsCount: relatedMappings.length,
  };
}
