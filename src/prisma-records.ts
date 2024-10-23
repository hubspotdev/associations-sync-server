import { PrismaClient } from '@prisma/client';
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
    handleError(error, 'Error fetching contacts:');
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
    handleError(error, 'Error fetching companies:');
    throw error;
  }
}

async function getCompany(id: string) {
  try {
    const company = await prisma.company.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        domain: true,
        name: true,
        archived: true,
      },
    });

    return company;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
}

async function getContact(id: string) {
  try {
    const company = await prisma.contact.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        archived: true,
      },
    });

    return company;
  } catch (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }
}

export {
  getAllCompanies,
  getAllContacts,
  getCompany,
  getContact,
};
