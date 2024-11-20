import { AssociationMapping } from '@prisma/client';
import handleError from '../utils/error';
import prisma from '../../prisma/seeds/index';

const saveBatchDBMapping = async (maybeMappings: AssociationMapping[]) => {
  try {
    const operations = maybeMappings.map((maybeMapping) => {
      const {
        nativeAssociationId,
        hubSpotAssociationLabel,
        fromHubSpotObjectId,
        toHubSpotObjectId,
        associationTypeId,
        nativeObjectId,
        toNativeObjectId,
        nativeAssociationLabel,
        customerId,
        fromObjectType,
        toObjectType,
        associationCategory,
        cardinality,
      } = maybeMapping;

      return prisma.associationMapping.upsert({
        where: {
          nativeAssociationId,
        },
        update: {
          hubSpotAssociationLabel,
          fromHubSpotObjectId,
          toHubSpotObjectId,
          associationTypeId,
          fromObjectType,
          toObjectType,
          associationCategory,
          cardinality,
        },
        create: {
          nativeAssociationId,
          hubSpotAssociationLabel,
          fromHubSpotObjectId,
          toHubSpotObjectId,
          associationTypeId,
          nativeObjectId,
          toNativeObjectId,
          nativeAssociationLabel,
          customerId,
          fromObjectType,
          toObjectType,
          associationCategory,
          cardinality,
        },
      });
    });

    const mappingResults = await prisma.$transaction(operations);
    console.log('results from prisma', mappingResults);
    return mappingResults;
  } catch (error:unknown) {
    handleError(error, 'There was an issue while attempting to save the association mappings');
    throw error;
  }
};

async function deleteBatchDBMappings(mappingIds: string[]): Promise<string | undefined> {
  try {
    await prisma.$transaction(
      mappingIds.map((id) => prisma.associationMapping.delete({
        where: { id },
      })),
    );
    return `Mappings with IDs ${mappingIds.join(', ')} were deleted successfully.`;
  } catch (error:unknown) {
    handleError(error, 'There was an issue while deleting the association mappings.');
    throw error;
  }
}

async function getBatchDBAssociationMappings(mappingIds: string[]) {
  try {
    const mappings = await prisma.associationMapping.findMany({
      where: { id: { in: mappingIds } },
    });

    if (!mappings || mappings.length <= 0) {
      console.log('Mappings not found with these IDs');
      return [];
    }

    return mappings;
  } catch (error:unknown) {
    handleError(error, 'There was an issue while fetching the association mappings');
    throw error;
  }
}

export {
  saveBatchDBMapping,
  deleteBatchDBMappings,
  getBatchDBAssociationMappings,
};
