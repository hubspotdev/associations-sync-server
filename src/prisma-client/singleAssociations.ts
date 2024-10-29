import { Association } from '@prisma/client';
import prisma from '../../prisma/seed';
import handleError from '../utils/error';

async function getDBAssociationsByCustomerId(customerId: string): Promise<Association[]> {
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

async function getSingleDBAssociationById(id: string): Promise<Association | null> {
  try {
    const association = await prisma.association.findUnique({
      where: { id },
    });
    return association ?? null;
  } catch (error) {
    handleError(error, 'There was an issue while fetching the association');
    throw error;
  }
}

const saveDBAssociation = async (maybeAssociation: Association): Promise<Association | null> => {
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
  } catch (error) {
    handleError(error, 'There was an issue while attempting to save the association');
    return null;
  }
};

async function getDBSingleAssociation(id: string): Promise<Association | null> {
  try {
    const association = await prisma.association.findUnique({
      where: { id },
    });
    return association ?? null;
  } catch (error) {
    handleError(error, 'There was an issue while fetching the association');
    throw error;
  }
}

async function deleteDBAssociation(id: string): Promise<void> {
  try {
    const deletedAssociation = await prisma.association.delete({
      where: { id },
    });
    console.log('Deleted association:', deletedAssociation);
  } catch (error) {
    handleError(error, 'There was an issue deleting this association');
  }
}

export {
  getDBAssociationsByCustomerId,
  getSingleDBAssociationById,
  saveDBAssociation,
  getDBSingleAssociation,
  deleteDBAssociation,
};
