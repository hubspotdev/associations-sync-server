import { PrismaClient } from '@prisma/client';
import { Association } from '../types/common';
import handleError from './utils/error';

const prisma = new PrismaClient();

async function getAllContacts() {
  try {
    const contacts = await prisma.contact.findMany({
      where: {
        archived: false,
      },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        createdate: true,
        lastmodifieddate: true,
        createdAt: true,
        updatedAt: true,
        archived: true,
      },
    });

    return contacts;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
}

async function getAllCompanies() {
  try {
    const companies = await prisma.company.findMany({
      where: {
        archived: false,
      },
      select: {
        id: true,
        domain: true,
        name: true,
        createdate: true,
        createdAt: true,
        updatedAt: true,
        archived: true,
      },
    });

    return companies;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
}

async function saveAssociation(data: Association) {
  try {
    const newAssociation = await prisma.association.create({
      data: {
        objectType: data.objectType,
        objectId: data.objectId,
        toObjectType: data.toObjectType,
        toObjectId: data.toObjectId,
        associationLabel: data.associationLabel,
        secondaryAssociationLabel: data.secondaryAssociationLabel,
        associationTypeId: data.associationTypeId,
        associationCategory: data.associationCategory,
        customerId: data.customerId,
        cardinality: data.cardinality,
      },
    });
    console.log('Association saved:', newAssociation);
    return newAssociation;
  } catch (error) {
    handleError(error, 'There was an issue saving this association');
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

export {
  getAllCompanies, getAllContacts, saveAssociation, deleteAssociation,
};
