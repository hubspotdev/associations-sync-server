import { AssociationMapping } from '@prisma/client';
import handleError from '../utils/error';
import prisma from './prisma-initialization';

async function getDBMappings(nativeAssociationIds: string[]) {
  try {
    const mappings = await prisma.associationMapping.findMany({
      where: {
        nativeAssociationId: {
          in: nativeAssociationIds,
        },
      },
    });
    return mappings;
  } catch (error:unknown) {
    console.error('Error fetching mappings:', error);
    throw error;
  }
}

async function saveDBMapping(maybeMapping: AssociationMapping) {
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

  try {
    const mappingResult = await prisma.associationMapping.upsert({
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

    return mappingResult;
  } catch (error:unknown) {
    handleError(error, 'There was an issue while attempting to save the association mapping');
    throw error;
  }
}

async function deleteDBMapping(mappingId: string): Promise<string | undefined> {
  try {
    await prisma.associationMapping.delete({
      where: {
        id: mappingId,
      },
    });
    return `Mapping with ID ${mappingId} deleted successfully.`;
  } catch (error:unknown) {
    handleError(error, 'There was an issue while deleting this association mapping');
    throw error;
  }
}

async function getSingleDBAssociationMappingFromId(mappingId: string) {
  try {
    const mapping = await prisma.associationMapping.findUnique({
      where: { id: mappingId },
    });

    if (!mapping) {
      console.log(`Mapping with ID ${mappingId} was not found.`);
      return null;
    }

    return mapping;
  } catch (error:unknown) {
    handleError(error, 'There was an issue while fetching the association mapping');
    throw error;
  }
}

async function getSingleDBAssociationMapping(nativeAssociationId: string) {
  try {
    const mapping = await prisma.associationMapping.findUnique({
      where: {
        nativeAssociationId,
      },
    });

    if (!mapping) {
      console.log(`Mapping with ID ${nativeAssociationId} was not found.`);
      return null;
    }

    return mapping;
  } catch (error:unknown) {
    handleError(error, 'There was an issue while fetching the association mapping');
    throw error;
  }
}
async function getAllDBMappings() {
  console.log('in getallDB');
  try {
    const mappings = await prisma.associationMapping.findMany();
    console.log('all mappings', mappings);
    return mappings;
  } catch (error:unknown) {
    handleError(error, 'Error fetching all association mappings');
    throw error;
  }
}

export {
  getAllDBMappings,
  getDBMappings,
  saveDBMapping,
  deleteDBMapping,
  getSingleDBAssociationMappingFromId,
  getSingleDBAssociationMapping,
};
