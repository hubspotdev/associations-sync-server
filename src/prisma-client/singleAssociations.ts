import { Association } from '@prisma/client';
import prisma from './prisma-initialization';
import handleError from '../utils/error';

async function getDBAssociationsByCustomerId(customerId: string): Promise<Association[]> {
  try {
    const associations = await prisma.association.findMany({
      where: { customerId },
    });
    return associations;
  } catch (error: unknown) {
    handleError(error, 'Error fetching associations');
    throw error;
  }
}

async function getSingleDBAssociationById(id: string): Promise<Association | null> {
  try {
    const association = await prisma.association.findUnique({
      where: { id },
    });
    return association ?? null;
  } catch (error:unknown) {
    handleError(error, 'There was an issue while fetching the association');
    throw error;
  }
}

const saveDBAssociation = async (maybeAssociation: Association): Promise<Association> => {
  const {
    objectType,
    objectId,
    toObjectType,
    toObjectId,
    associationLabel,
    associationTypeId,
    associationCategory,
    customerId,
    cardinality,
  } = maybeAssociation;

  try {
    const associationResult = await prisma.association.upsert({
      where: {
        customerId_toObjectId_objectId_associationLabel_associationTypeId: {
          customerId,
          toObjectId,
          objectId,
          associationLabel,
          associationTypeId,
        },
      },
      update: {
        associationCategory,
        cardinality,
      },
      create: {
        objectType,
        objectId,
        toObjectType,
        toObjectId,
        associationLabel,
        associationTypeId,
        associationCategory,
        customerId,
        cardinality,
      },
    });

    return associationResult;
  } catch (error: unknown) {
    handleError(error, 'There was an issue while attempting to save the association');
    throw error;
  }
};

async function getDBSingleAssociation(id: string): Promise<Association | null> {
  if (!id || !id.trim()) {
    throw new Error('Association ID cannot be empty');
  }

  try {
    const association = await prisma.association.findUnique({
      where: { id },
    });
    return association ?? null;
  } catch (error:unknown) {
    handleError(error, 'There was an issue while fetching the association');
    throw error;
  }
}

async function deleteDBAssociation(id: string): Promise<Association | null> {
  try {
    const deletedAssociation = await prisma.association.delete({
      where: { id },
    });
    console.log('Deleted association:', deletedAssociation);
    return deletedAssociation;
  } catch (error: unknown) {
    handleError(error, 'There was an issue deleting this association');
    return null;
    // throw error;
  }
}

export async function getAllDBAssociations() {
  try {
    return await prisma.association.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  } catch (error: unknown) {
    handleError(error, 'There was an issue while fetching all associations');
    throw error;
  }
}

export {
  getDBAssociationsByCustomerId,
  getSingleDBAssociationById,
  saveDBAssociation,
  getDBSingleAssociation,
  deleteDBAssociation,
};
