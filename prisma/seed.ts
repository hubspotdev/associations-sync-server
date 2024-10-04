import { PrismaClient, AssociationType } from "@prisma/client"; // Import the AssociationType enum
import handleError from '../src/utils/error';

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function main() {
  const associationsData = [
    {
      nativeObject: "Contact",
      toNativeObject: "Contract",
      nativeAssociationLabel: "Contact to Contract",
      associationType: AssociationType.ONE_TO_ONE,
      customerId: "1",
    },
    {
      nativeObject: "Company",
      toNativeObject: "Branch",
      nativeAssociationLabel: "Company to Branch",
      associationType: AssociationType.ONE_TO_MANY,
      customerId: "1",
    },
    {
      nativeObject: "Employee",
      toNativeObject: "Department",
      nativeAssociationLabel: "Employee to Department",
      associationType: AssociationType.ONE_TO_MANY,
      customerId: "1",
    },
    {
      nativeObject: "Student",
      toNativeObject: "Course",
      nativeAssociationLabel: "Student to Course",
      associationType: AssociationType.MANY_TO_MANY,
      customerId: "1",
    },
    {
      nativeObject: "Vendor",
      toNativeObject: "Product",
      nativeAssociationLabel: "Vendor to Product",
      associationType: AssociationType.MANY_TO_MANY,
      customerId: "1",
    },
    {
      nativeObject: "Contact",
      toNativeObject: "Doctor",
      nativeAssociationLabel: "Patient to Doctor",
      associationType: AssociationType.ONE_TO_ONE,
      customerId: "1",
    },
    {
      nativeObject: "Contact",
      toNativeObject: "Article",
      nativeAssociationLabel: "Writer to Article",
      associationType: AssociationType.ONE_TO_MANY,
      customerId: "1",
    },
    {
      nativeObject: "Contact",
      toNativeObject: "Gallery",
      nativeAssociationLabel: "Artist to Gallery",
      associationType: AssociationType.MANY_TO_MANY,
      customerId: "1",
    }
  ];

  try {
    for (const association of associationsData) {
      const result = await prisma.association.upsert({
        where: {
          customerId_nativeObject_toNativeObject_nativeAssociationLabel: {
            customerId: association.customerId,
            nativeObject: association.nativeObject,
            toNativeObject: association.toNativeObject,
            nativeAssociationLabel: association.nativeAssociationLabel,
          },
        },
        update: {},
        create: association,
      });
      console.log("Upserted:", result);
    }
  } catch (error: any) {
    handleError('Something went wrong while seeding the database', error);
  }

  // Fetch and log all associations
  const allAssociations = await prisma.association.findMany();
  console.log("All Associations:");
  allAssociations.forEach((association) => console.log(association));
}


main()
  .catch((e) => {
    console.error("Error seeding database", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export default prisma;
