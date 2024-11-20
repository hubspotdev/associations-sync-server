import { AssociationDefinition } from '@prisma/client';
import handleError from '../utils/error';
import prisma from '../../prisma/seeds/partnership';

async function getDBAssociationDefinitionsByType(data: any): Promise<AssociationDefinition[]> {
  const fromObjectType = data.fromObject;
  const toObjectType = data.toObject;
  console.log('from object and to object in getDB', fromObjectType, toObjectType);
  try {
    const associations = await prisma.associationDefinition.findMany({
      where: {
        fromObjectType: {
          equals: fromObjectType,
          mode: 'insensitive', // Add this if you want case-insensitive matching
        },
        toObjectType: {
          equals: toObjectType,
          mode: 'insensitive',
        },
      },
    });
    console.log('associations in getDB', associations);

    return associations;
  } catch (error:unknown) {
    console.error('Error fetching associations:', error);
    throw error;
  }
}

async function saveDBAssociationDefinition(data: AssociationDefinition) {
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
  } catch (error:unknown) {
    handleError(error, 'There was an issue archiving the association definition in Prisma');
    throw error;
  }
}

export {
  getDBAssociationDefinitionsByType,
  saveDBAssociationDefinition,
  updateDBAssociationDefinition,
  deleteDBAssociationDefinition,
};
