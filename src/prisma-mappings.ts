import { PrismaClient, Association } from '@prisma/client';
import handleError from './utils/error';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function getAssociationsByCustomerId(customerId: string): Promise<Association[]> {
  try {
    const associations = await prisma.association.findMany({
      where: { customerId },
    });
    return associations;
  } catch (error) {
    console.error('Error fetching associations:', error);
    throw error;
  }
}

async function getMappings(nativeAssociationIds: string[]) {
  try {
    const mappings = await prisma.associationMapping.findMany({
      where: {
        nativeAssociationId: {
          in: nativeAssociationIds,
        },
      },
    });
    return mappings;
  } catch (error) {
    console.error('Error fetching mappings:', error);
    throw error;
  }
}

type AssociationCategory =
| 'HUBSPOT_DEFINED'
| 'INTEGRATOR_DEFINED'
| 'USER_DEFINED';

type Cardinality =
| 'ONE_TO_ONE'
| 'ONE_TO_MANY'
| 'MANY_TO_ONE'
| 'MANY_TO_MANY';

interface MaybeMappingInput {
  nativeAssociationId: string;
  hubSpotAssociationLabel: string;
  fromHubSpotObjectId: string;
  toHubSpotObjectId: string;
  associationTypeId: number;
  nativeObjectId: string;
  toNativeObjectId: string;
  nativeAssociationLabel: string;
  customerId: string;
  // hubSpotAssociationId: string;
  fromObjectType: string;
  toObjectType: string;
  fromCardinality?:number,
  toCardinality?:number,
  associationCategory: AssociationCategory;
  cardinality: Cardinality;
}

const savePrismaMapping = async (maybeMapping: MaybeMappingInput) => {
  console.log('maybeMapping', maybeMapping);
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
    // hubSpotAssociationId,
    fromObjectType,
    toObjectType,
    associationCategory,
    cardinality,
  } = maybeMapping;

  try {
    const mappingResult = await prisma.associationMapping.upsert({
      where: {
        id: nativeAssociationId,
      },
      update: {
        hubSpotAssociationLabel,
        fromHubSpotObjectId,
        toHubSpotObjectId,
        associationTypeId,
        // hubSpotAssociationId,
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
        // hubSpotAssociationId,
        fromObjectType,
        toObjectType,
        associationCategory,
        cardinality,
      },
    });

    return mappingResult;
  } catch (error) {
    handleError(error, 'There was an issue while attempting to save the association mapping');
    throw error;
  }
};

async function deleteMapping(mappingId: string): Promise<string | undefined> {
  try {
    await prisma.associationMapping.delete({
      where: {
        id: mappingId,
      },
    });
    return `Mapping with ID ${mappingId} deleted successfully.`;
  } catch (error) {
    handleError(error, 'There was an issue while deleting this association mapping');
    throw error;
  }
}

const saveBatchPrismaMapping = async (maybeMappings: MaybeMappingInput[]) => {
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
        // hubSpotAssociationId,
        fromObjectType,
        toObjectType,
        associationCategory,
        cardinality,
      } = maybeMapping;

      return prisma.associationMapping.upsert({
        where: {
          id: nativeAssociationId,
        },
        update: {
          hubSpotAssociationLabel,
          fromHubSpotObjectId,
          toHubSpotObjectId,
          associationTypeId,
          // hubSpotAssociationId,
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
          // hubSpotAssociationId,
          fromObjectType,
          toObjectType,
          associationCategory,
          cardinality,
        },
      });
    });

    const mappingResults = await prisma.$transaction(operations);
    return mappingResults;
  } catch (error) {
    handleError(error, 'There was an issue while attempting to save the association mappings');
    throw error;
  }
};

async function deleteBatchPrismaMappings(mappingIds: string[]): Promise<string | undefined> {
  try {
    await prisma.$transaction(
      mappingIds.map((id) => prisma.associationMapping.delete({
        where: { id },
      })),
    );
    return `Mappings with IDs ${mappingIds.join(', ')} were deleted successfully.`;
  } catch (error) {
    handleError(error, 'There was an issue while deleting the association mappings.');
    throw error;
  }
}

async function getBatchAssociationMappings(mappingIds: string[]) {
  try {
    const mappings = await prisma.associationMapping.findMany({
      where: { id: { in: mappingIds } },
    });

    if (!mappings || mappings.length <= 0) {
      console.log('Mappings not found with these IDs');
      return [];
    }

    return mappings;
  } catch (error) {
    handleError(error, 'There was an issue while fetching the association mappings');
    throw error;
  }
}

async function getSingleAssociationMappingFromId(mappingId: string) {
  try {
    const mapping = await prisma.associationMapping.findUnique({
      where: { id: mappingId },
    });

    if (!mapping) {
      console.log(`Mapping with ID ${mappingId} was not found.`);
      return null;
    }

    return mapping;
  } catch (error) {
    handleError(error, 'There was an issue while fetching the association mapping');
    throw error;
  }
}
async function getSingleAssociation(
  id:string,
) {
  try {
    const mapping = await prisma.associationMapping.findUnique({
      where: {
        id,
      },
    });

    if (!mapping) {
      console.log(`Mapping with ID ${id} was not found.`);
      return null;
    }

    return mapping;
  } catch (error) {
    handleError(error, 'There was an issue while fetching the association mapping');
    throw error;
  }
}

async function getSingleAssociationMapping(
  nativeAssociationId:string,
) {
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
  } catch (error) {
    handleError(error, 'There was an issue while fetching the association mapping');
    throw error;
  }
}

export {
  getAssociationsByCustomerId,
  getSingleAssociation,
  getMappings,
  savePrismaMapping,
  deleteMapping,
  getSingleAssociationMappingFromId,
  saveBatchPrismaMapping,
  deleteBatchPrismaMappings,
  getBatchAssociationMappings,
  getSingleAssociationMapping,
};
