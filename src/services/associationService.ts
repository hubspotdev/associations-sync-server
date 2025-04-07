import {
  getBatchDBAssociationMappingsByAssociationId,
  deleteBatchDBMappings,
} from '../prisma-client/batchAssociations';
import { deleteDBAssociation } from '../prisma-client/singleAssociations';

export default async function deleteAssociationAndRelatedMappings(associationId: string) {
  const result = await deleteDBAssociation(associationId);
  console.log('Deleted association', result);
  const relatedMappings = await getBatchDBAssociationMappingsByAssociationId(associationId);

  if (relatedMappings.length > 0) {
    const mappingIds = relatedMappings.map((mapping) => mapping.id);
    await deleteBatchDBMappings(mappingIds);
  }

  return {
    deletedAssociation: result,
    deletedMappingsCount: relatedMappings.length,
  };
}
