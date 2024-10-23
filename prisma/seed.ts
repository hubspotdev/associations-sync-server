import { PrismaClient } from "@prisma/client";
import handleError from '../src/utils/error';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function main() {
  // Clear existing data (only for the development environment)
  await prisma.association.deleteMany();
  await prisma.associationMapping.deleteMany();
  await prisma.associationDefinition.deleteMany();
  await prisma.company.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.authorization.deleteMany()

  const company1 = await prisma.company.create({
    data: {
      createdate: new Date(),
      domain: 'example.com',
      name: 'Example Company',
      archived: false,
    },
  });

  const company2 = await prisma.company.create({
    data: {
      createdate: new Date(),
      domain: 'samplecorp.com',
      name: 'Sample Corporation',
      archived: false,
    },
  });

  const contact1 = await prisma.contact.create({
    data: {
      createdate: new Date(),
      email: 'john.doe@example.com',
      firstname: 'John',
      lastname: 'Doe',
      lastmodifieddate: new Date(),
      archived: false,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      createdate: new Date(),
      email: 'jane.smith@samplecorp.com',
      firstname: 'Jane',
      lastname: 'Smith',
      lastmodifieddate: new Date(),
      archived: false,
    },
  });

  // Create association definitions
  await prisma.associationDefinition.create({
    data: {
      fromObjectType: 'Contact',
      toObjectType: 'Company',
      associationLabel: 'Is Employee Of',
      name:'is_employee_of',
      associationTypeId: 2,
      customerId: '1',
      cardinality: 'ONE_TO_MANY',
      associationCategory: 'INTEGRATOR_DEFINED'
    },
  });

  // Create associations
  const association1 = await prisma.association.create({
    data: {
      objectType: 'Contact',
      objectId: contact1.id,
      toObjectType: 'Company',
      toObjectId: company1.id,
      associationLabel: 'Employee',
      associationTypeId: 2,
      associationCategory: 'HUBSPOT_DEFINED',
      customerId: '1',
      cardinality: 'ONE_TO_ONE',
    },
  });

  const association2 = await prisma.association.create({
    data: {
      objectType: 'Contact',
      objectId: contact2.id,
      toObjectType: 'Company',
      toObjectId: company2.id,
      associationLabel: 'Manager',
      associationTypeId: 5,
      associationCategory: 'INTEGRATOR_DEFINED',
      customerId: '1',
      cardinality: 'ONE_TO_ONE',
    },
  });

  // Create association mappings
  await prisma.associationMapping.create({
    data: {
      nativeAssociationId: association1.id,
      nativeObjectId: contact1.id,
      toNativeObjectId: company1.id,
      fromObjectType: 'Contact',
      toObjectType: 'Company',
      nativeAssociationLabel: 'Employee',
      hubSpotAssociationLabel: 'Contact to Company',
      fromHubSpotObjectId: 'hs_contact1',
      toHubSpotObjectId: 'hs_company1',
      customerId: '1',
      associationTypeId: 2,
      associationCategory: 'HUBSPOT_DEFINED',
      cardinality: 'ONE_TO_ONE',
    },
  });

  await prisma.associationMapping.create({
    data: {
      nativeAssociationId: association2.id,
      nativeObjectId: contact2.id,
      toNativeObjectId: company2.id,
      fromObjectType: 'Contact',
      toObjectType: 'Company',
      nativeAssociationLabel: 'Manager',
      hubSpotAssociationLabel: 'Contact to Company',
      fromHubSpotObjectId: 'hs_contact2',
      toHubSpotObjectId: 'hs_company2',
      customerId: '1',
      associationTypeId: 5,
      associationCategory: 'INTEGRATOR_DEFINED',
      cardinality: 'ONE_TO_ONE',
    },
  });
}

main()
  .catch((e) => {
    handleError(e, 'There was an issue seeding the database');
  })
  .finally(async () => {
    await prisma.$disconnect();
});

export default prisma;
