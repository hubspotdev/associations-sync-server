import { Association, AssociationDefinition } from '@prisma/client';
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
async function getAssociationDefinitionsByType(data: any): Promise<AssociationDefinition[]> {
  const fromObjectType = data.fromObject;
  const toObjectType = data.toObject;

  try {
    const associations = await prisma.associationDefinition.findMany({
      where: { fromObjectType, toObjectType },
    });
    return associations;
  } catch (error) {
    console.error('Error fetching associations:', error);
    throw error;
  }
}

async function deleteAssociation(id: string): Promise<void> {
  try {
    const deletedAssociation = await prisma.association.delete({
      where: {
        id,
      },
    });
    console.log('Deleted association:', deletedAssociation);
  } catch (error) {
    handleError(error, 'There was an issue deleting this association');
  }
}

async function savePrismaAssociationDefinition(data: AssociationDefinition) {
  try {
    const result = await prisma.associationDefinition.create({ data });
    console.log('Successfully saved association definition in Prisma', result);
    return result;
  } catch (error) {
    handleError(error, 'There was an issue saving the association definition in Prisma');
    throw error;
  }
}

async function updatePrismaAssociationDefinition(data: any, id: string) {
  try {
    const result = await prisma.associationDefinition.update({
      where: { id },
      data,
    });
    console.log('Successfully updated association definition in Prisma', result);
    return result;
  } catch (error) {
    handleError(error, 'There was an issue updating the association definition in Prisma');
    throw error;
  }
}

async function deletePrismaAssociationDefinition(id: string) {
  try {
    const result = await prisma.associationDefinition.delete({
      where: { id },
    });
    console.log('Successfully deleted association definition in Prisma', result);
    return result;
  } catch (error) {
    handleError(error, 'There was an issue archiving the association definition in Prisma');
    throw error;
  }
}

export {
  getAssociationDefinitionsByType,
  getAssociationsByCustomerId,
  savePrismaAssociation,
  deleteAssociation,
  getSingleAssociation,
  deletePrismaAssociationDefinition,
  updatePrismaAssociationDefinition,
  savePrismaAssociationDefinition,
};
