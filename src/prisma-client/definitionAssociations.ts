import { AssociationDefinition } from '@prisma/client';
import handleError from '../utils/error';
import prisma from '../../prisma/seed';

async function getDBAssociationDefinitionsByType(data: any): Promise<AssociationDefinition[]> {
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

async function saveDBAssociationDefinition(data: AssociationDefinition) {
  try {
    const result = await prisma.associationDefinition.create({ data });
    console.log('Successfully saved association definition in Prisma', result);
    return result;
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
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
