import prisma from "../prisma/seed";
import handleError from './utils/error';
import { getCustomerId } from "./utils/utils";
import { Association, AssociationMapping, Direction, AssociationType } from "@prisma/client";

async function getAssociationsByCustomerId(customerId: string): Promise<Association[]> {
  try {
    const associations = await prisma.association.findMany({
      where: { customerId },
    });
    return associations;
  } catch (error) {
    console.error("Error fetching associations:", error);
    throw error;
  }
}

async function getMappings(associationIds: number[]): Promise<AssociationMapping[]> {
  try {
    const mappings = await prisma.associationMapping.findMany({
      where: {
        associationId: {
          in: associationIds,
        },
      },
    });
    return mappings;
  } catch (error) {
    console.error("Error fetching mappings:", error);
    throw error;
  }
}


interface MaybeMappingInput {
  associationId: number; // ID of the associated association
  hubSpotAssociationLabel: string;
  hubSpotObject: string;
  toHubSpotObject: string;
  associationType: AssociationType;
  direction: Direction;
  nativeObject: string;
  toNativeObject: string;
  nativeAssociationLabel: string;
  customerId: string;
}

const saveMapping = async (maybeMapping: MaybeMappingInput): Promise<AssociationMapping | undefined> => {
  console.log("maybeMapping", maybeMapping);
  const {
    associationId,
    hubSpotAssociationLabel,
    hubSpotObject,
    toHubSpotObject,
    associationType,
    direction,
    nativeObject,
    toNativeObject,
    nativeAssociationLabel,
    customerId,
  } = maybeMapping;

  try {
    const mappingResult = await prisma.associationMapping.upsert({
      where: {
        associationId: associationId,
      },
      update: {
        hubSpotAssociationLabel,
        hubSpotObject,
        toHubSpotObject,
        associationType,
        direction,
      },
      create: {
        associationId,
        hubSpotAssociationLabel,
        hubSpotObject,
        toHubSpotObject,
        associationType,
        direction,
        nativeObject,
        toNativeObject,
        nativeAssociationLabel,
        customerId,
      },
    });

    return mappingResult;
  } catch (error) {
    handleError(error, 'There was an issue while attempting to save the association mapping');
  }
};

async function deleteMapping(mappingId: number): Promise<string | undefined> {
  try {
    const deleteResult = await prisma.associationMapping.delete({
      where: {
        id: mappingId,
      },
    });
    return `Mapping with ID ${mappingId} deleted successfully.`;
  } catch (error) {
    handleError(error, 'There was an issue while deleting this association mapping')
  }
}

export { getAssociationsByCustomerId, getMappings, saveMapping, deleteMapping };
