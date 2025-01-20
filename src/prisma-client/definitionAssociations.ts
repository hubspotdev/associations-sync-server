import { AssociationDefinition } from '@prisma/client';
import handleError from '../utils/error';
import prisma from './prisma-initialization';

async function getDBAssociationDefinitionsByType(data: {
  fromObject: string;
  toObject: string;
}): Promise<AssociationDefinition[]> {
  if (!data
      || typeof data.fromObject !== 'string'
      || typeof data.toObject !== 'string'
      || !data.fromObject.trim()
      || !data.toObject.trim()) {
    throw new Error('Invalid input parameters');
  }

  const fromObjectType = data.fromObject;
  const toObjectType = data.toObject;

  try {
    const associations = await prisma.associationDefinition.findMany({
      where: {
        fromObjectType: {
          equals: fromObjectType,
          mode: 'insensitive',
        },
        toObjectType: {
          equals: toObjectType,
          mode: 'insensitive',
        },
      },
    });

    return associations;
  } catch (error:unknown) {
    handleError(error, 'Error fetching association definitions');
    throw error;
  }
}

async function saveDBAssociationDefinition(data: AssociationDefinition) {
  if (data.fromCardinality && data.toCardinality && (data.fromCardinality < 0 || data.toCardinality < 0)) {
    throw new Error('Invalid cardinality values');
  }

  try {
    const result = await prisma.associationDefinition.create({ data });
    console.log('Successfully saved association definition in Prisma', result);
    return result;
  } catch (error:unknown) {
    handleError(error, 'There was an issue saving the association definition in Prisma');
    throw error;
  }
}

async function updateDBAssociationDefinition(data: AssociationDefinition, id: string) {
  try {
    const result = await prisma.associationDefinition.update({
      where: { id },
      data,
    });
    console.log('Successfully updated association definition in Prisma', result);
    return result;
  } catch (error:unknown) {
    handleError(error, 'There was an issue updating the association definition in Prisma');
    throw error;
  }
}

async function deleteDBAssociationDefinition(id: string) {
  try {
    const result = await prisma.associationDefinition.delete({
      where: { id },
    });
    console.log('Successfully deleted association definition in Prisma', result);
    return result;
  } catch (error: unknown) {
    if (error instanceof Error
        && 'code' in error
        && error.code === 'P2003') {
      const customError = new Error('Cannot delete definition due to existing references');
      handleError(customError, 'Cannot delete definition due to existing references');
      throw customError;
    }
    handleError(error, 'There was an issue deleting the association definition in Prisma');
    throw error;
  }
}

export {
  getDBAssociationDefinitionsByType,
  saveDBAssociationDefinition,
  updateDBAssociationDefinition,
  deleteDBAssociationDefinition,
};
