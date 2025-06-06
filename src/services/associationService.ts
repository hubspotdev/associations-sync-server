import {
  getBatchDBAssociationMappingsByAssociationId,
  deleteBatchDBMappings,
} from '../prisma-client/batchAssociations';
import { deleteDBAssociation } from '../prisma-client/singleAssociations';
import Logger from '../utils/logger';

export default async function deleteAssociationAndRelatedMappings(associationId: string) {
  const result = await deleteDBAssociation(associationId);
  Logger.info({
    type: 'Association',
    context: 'Delete operation',
    logMessage: {
      message: 'Association deleted successfully',
      data: result
    }
  });
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
