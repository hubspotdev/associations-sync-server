const { PrismaClient } = require('@prisma/client');

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

export { getAllCompanies, getAllContacts };
