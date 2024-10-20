import { Association } from '@prisma/client';
import prisma from '../prisma/seed';
import handleError from './utils/error';

type AssociationCategory = 'HUBSPOT_DEFINED' | 'INTEGRATOR_DEFINED' | 'USER_DEFINED';

type Cardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

interface MaybeAssociationInput {
  objectType: string;
  objectId: string;
  toObjectType: string;
  toObjectId: string;
  associationLabel: string;
  secondaryAssociationLabel?: string;
  associationTypeId: number;
  associationCategory: AssociationCategory;
  customerId: string;
  cardinality: Cardinality;
}

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

const savePrismaAssociation = async (maybeAssociation: MaybeAssociationInput): Promise<Association | null> => {
  const {
    objectType,
    objectId,
    toObjectType,
    toObjectId,
    associationLabel,
    secondaryAssociationLabel,
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
        secondaryAssociationLabel,
        associationCategory,
        cardinality,
      },
      create: {
        objectType,
        objectId,
        toObjectType,
        toObjectId,
        associationLabel,
        secondaryAssociationLabel,
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

async function deleteAssociation(id: string): Promise<string | null> {
  try {
    await prisma.association.delete({
      where: { id },
    });

    return `Association with ID ${id} deleted successfully.`;
  } catch (error) {
    handleError(error, 'There was an issue while deleting this association');
    return null;
  }
}

async function getSingleAssociation(id: string): Promise<Association | null > {
  try {
    const association = await prisma.association.findUnique({
      where: { id },
    });
    return association;
  } catch (error) {
    handleError(error, 'There was an issue while fetching the association');
    return null;
  }
}

export {
  getAssociationsByCustomerId,
  savePrismaAssociation,
  deleteAssociation,
  getSingleAssociation,
};
