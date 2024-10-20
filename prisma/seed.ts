// import { PrismaClient } from "@prisma/client"; // Import the AssociationType enum
// import handleError from '../src/utils/error';

// const prisma = new PrismaClient({
//   log: ['info', 'warn', 'error'],
// });


// async function main() {
//   // Create some companies
//   const company1 = await prisma.company.create({
//     data: {
//       // id: '1',
//       createdate: new Date(),
//       domain: 'example.com',
//       name: 'Example Company',
//       archived: false,
//     },
//   });

//   const company2 = await prisma.company.create({
//     data: {
//       // id:'2',
//       createdate: new Date(),
//       domain: 'samplecorp.com',
//       name: 'Sample Corporation',
//       archived: false,
//     },
//   });

//   // Create some contacts
//   const contact1 = await prisma.contact.create({
//     data: {
//       // id: '1',
//       createdate: new Date(),
//       email: 'john.doe@example.com',
//       firstname: 'John',
//       lastname: 'Doe',
//       lastmodifieddate: new Date(),
//       archived: false,
//     },
//   });

//   const contact2 = await prisma.contact.create({
//     data: {
//       // id: '2',
//       createdate: new Date(),
//       email: 'jane.smith@samplecorp.com',
//       firstname: 'Jane',
//       lastname: 'Smith',
//       lastmodifieddate: new Date(),
//       archived: false,
//     },
//   });

//   // Create associations
//   const association1 = await prisma.association.create({
//     data: {
//       objectType: 'Contact',
//       objectId: 1,
//       toObjectType: 'Company',
//       toObjectId: 1,
//       associationLabel: 'Employee',
//       associationTypeId: 2,
//       associationCategory: 'HUBSPOT_DEFINED',
//       customerId: '1',
//       cardinality: 'ONE_TO_ONE',
//     },
//   });

//   const association2 = await prisma.association.create({
//     data: {
//       objectType: 'Contact',
//       objectId: 2,
//       toObjectType: 'Company',
//       toObjectId: 2,
//       associationLabel: 'Manager',
//       associationTypeId: 5,
//       associationCategory: 'INTEGRATOR_DEFINED',
//       customerId: '1',
//       cardinality: 'ONE_TO_ONE',
//     },
//   });

//   // Create association mappings
//   await prisma.associationMapping.create({
//     data: {
//       nativeAssociationId: association1.id,
//       hubSpotAssociationId: 1001,
//       nativeObjectId: contact1.id,
//       toNativeObjectId: company1.id,
//       fromObjectType: 'Contact',
//       toObjectType: 'Company',
//       nativeAssociationLabel: 'Employee',
//       hubSpotAssociationLabel: 'Contact to Company',
//       fromHubSpotObjectId: 'hs_contact1',
//       toHubSpotObjectId: 'hs_company1',
//       customerId: '1',
//       associationTypeId: 2,
//       associationCategory: 'HUBSPOT_DEFINED',
//       cardinality: 'ONE_TO_ONE',
//     },
//   });

//   await prisma.associationMapping.create({
//     data: {
//       nativeAssociationId: association2.id,
//       hubSpotAssociationId: 1002,
//       nativeObjectId: contact2.id,
//       toNativeObjectId: company2.id,
//       fromObjectType: 'Contact',
//       toObjectType: 'Company',
//       nativeAssociationLabel: 'Manager',
//       hubSpotAssociationLabel: 'Contact to Company',
//       fromHubSpotObjectId: 'hs_contact2',
//       toHubSpotObjectId: 'hs_company2',
//       customerId: '1',
//       associationTypeId: 2,
//       associationCategory: 'INTEGRATOR_DEFINED',
//       cardinality: 'ONE_TO_ONE',
//     },
//   });
// }

// main()
//   .catch((e) => {
//     console.error("Error seeding database", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });

// export default prisma;
import { PrismaClient } from "@prisma/client";
import handleError from '../src/utils/error';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function main() {
  // Optionally clear existing data in the development environment
  // await prisma.association.deleteMany();
  // await prisma.associationMapping.deleteMany();

  // Create some companies with auto-generated IDs
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

  // Create some contacts with auto-generated IDs
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

  // Create associations - ensure the IDs used are from the created entries
  const association1 = await prisma.association.create({
    data: {
      objectType: 'Contact',
      objectId: contact1.id,  // Use generated ID
      toObjectType: 'Company',
      toObjectId: company1.id,  // Use generated ID
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
      objectId:contact2.id,
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
      // hubSpotAssociationId: '1001',
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
      // hubSpotAssociationId: '1002',
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

// main()
//   .catch((e) => {
//     handleError(e, 'There was an issue seeding the database ')
//   })

export default prisma;
