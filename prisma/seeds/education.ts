import { PrismaClient, AssociationCategory, Cardinality } from '@prisma/client'
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies';
export async function seedEducationData(prisma: PrismaClient, hubspotClient:Client) {
  console.log('🚀 Starting education data seed...')

  // Check if AssociationDefinition already exists in Prisma
  let schoolStudentAssoc;
  const existingSchoolStudentDef = await prisma.associationDefinition.findFirst({
    where: {
      fromObjectType: 'School',
      toObjectType: 'Student',
      associationLabel: 'school_student',
      customerId: '1'
    }
  });

  if (!existingSchoolStudentDef) {
    schoolStudentAssoc = await prisma.associationDefinition.create({
      data: {
        fromObjectType: 'School',
        toObjectType: 'Student',
        associationLabel: 'school_student',
        name: 'School to Student',
        inverseLabel: 'student_school',
        customerId: '1',
        cardinality: Cardinality.ONE_TO_MANY,
        associationCategory: AssociationCategory.USER_DEFINED
      }
    })
    console.log('✅ Created school-student association definition in Prisma')
  } else {
    schoolStudentAssoc = existingSchoolStudentDef;
    console.log('ℹ️ School-student association definition already exists in Prisma')
  }

  // Check for existing school in Prisma
  let school;
  const existingSchool = await prisma.company.findFirst({
    where: {
      domain: 'springfieldelem.edu'
    }
  });

  if (!existingSchool) {
    school = await prisma.company.create({
      data: {
        createdate: new Date(),
        domain: 'springfieldelem.edu',
        name: 'Springfield Elementary',
        archived: false
      }
    })
    console.log('✅ Created school in Prisma:', school.name)
  } else {
    school = existingSchool;
    console.log('ℹ️ School already exists in Prisma:', school.name)
  }

  // Check for existing school in HubSpot
  let hubspotSchool;
  try {
    const searchResults = await hubspotClient.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'domain',
          operator: FilterOperatorEnum.Eq,
          value: 'springfieldelem.edu'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotSchool = searchResults.results[0];
      console.log('ℹ️ School already exists in HubSpot:', hubspotSchool.properties.name);
    } else {
      hubspotSchool = await hubspotClient.crm.companies.basicApi.create({
        properties: {
          name: 'Springfield Elementary',
          domain: 'springfieldelem.edu',
        }
      });
      console.log('✅ Created school in HubSpot:', hubspotSchool.properties.name)
    }
  } catch (error) {
    console.error('Error while checking/creating school in HubSpot:', error);
    throw error;
  }

  // Check for existing student in Prisma
  let student;
  const existingStudent = await prisma.contact.findFirst({
    where: {
      email: 'bart.simpson@springfieldelem.edu'
    }
  });

  if (!existingStudent) {
    student = await prisma.contact.create({
      data: {
        createdate: new Date(),
        email: 'bart.simpson@springfieldelem.edu',
        firstname: 'Bart',
        lastname: 'Simpson',
        lastmodifieddate: new Date(),
        archived: false
      }
    })
    console.log('✅ Created student in Prisma:', `${student.firstname} ${student.lastname}`)
  } else {
    student = existingStudent;
    console.log('ℹ️ Student already exists in Prisma:', `${student.firstname} ${student.lastname}`)
  }

  // Check for existing student in HubSpot
  let hubspotStudent;
  try {
    const searchResults = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: FilterOperatorEnum.Eq,
          value: 'bart.simpson@springfieldelem.edu'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotStudent = searchResults.results[0];
      console.log('ℹ️ Student already exists in HubSpot:', `${hubspotStudent.properties.firstname} ${hubspotStudent.properties.lastname}`);
    } else {
      hubspotStudent = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          email: 'bart.simpson@springfieldelem.edu',
          firstname: 'Bart',
          lastname: 'Simpson',
        }
      });
      console.log('✅ Created student in HubSpot:', `${hubspotStudent.properties.firstname} ${hubspotStudent.properties.lastname}`);
    }
  } catch (error) {
    console.error('Error while checking/creating student in HubSpot:', error);
    throw error;
  }

  // Check for existing association definition in HubSpot
  let associationDefinition;
  try {
    const definitions = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(
      'companies',
      'contacts'
    );

    const existingDefinition = definitions.results.find(
      def => def.label === 'School to Student'
    );

    if (existingDefinition) {
      associationDefinition = { results: [existingDefinition] };
      console.log('ℹ️ Association definition already exists in HubSpot with typeId:', existingDefinition.typeId);
    } else {
      associationDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
        'companies',
        'contacts',
        {
          label: 'School to Student',
          name: 'school_to_student'
        }
      );
      console.log('✅ Created association definition in HubSpot with typeId:', associationDefinition.results[0].typeId)
    }
  } catch (error) {
    console.error('Error while checking/creating association definition in HubSpot:', error);
    throw error;
  }

  // Check and update Prisma association definition with HubSpot typeId
  const existingAssocDef = await prisma.associationDefinition.findFirst({
    where: {
      fromObjectType: 'School',
      toObjectType: 'Student',
      associationLabel: 'school_student',
      associationTypeId: associationDefinition.results[0].typeId
    }
  });

  if (!existingAssocDef) {
    await prisma.associationDefinition.update({
      where: { id: schoolStudentAssoc.id },
      data: {
        associationTypeId: associationDefinition.results[0].typeId
      }
    });
    console.log('✅ Updated Prisma association definition with HubSpot typeId')
  } else {
    console.log('ℹ️ Association definition already exists with this typeId')
  }

  // Check if association exists in Prisma
  const existingAssociation = await prisma.association.findUnique({
    where: {
      customerId_toObjectId_objectId_associationLabel_associationTypeId: {
        customerId: '1',
        toObjectId: student.id,
        objectId: school.id,
        associationLabel: 'school_student',
        associationTypeId: associationDefinition.results[0].typeId
      }
    }
  });

  let schoolStudentAssociation;
  if (!existingAssociation) {
    schoolStudentAssociation = await prisma.association.create({
      data: {
        objectType: 'School',
        objectId: school.id,
        toObjectType: 'Student',
        toObjectId: student.id,
        associationLabel: 'school_student',
        associationTypeId: associationDefinition.results[0].typeId,
        customerId: '1',
        cardinality: Cardinality.ONE_TO_MANY,
        associationCategory: AssociationCategory.USER_DEFINED
      }
    });
    console.log('✅ Created association in Prisma between school and student')
  } else {
    schoolStudentAssociation = existingAssociation;
    console.log('ℹ️ Association already exists in Prisma between school and student')
  }

  // Create association mapping if association was created
  if (schoolStudentAssociation) {
    const existingMapping = await prisma.associationMapping.findUnique({
      where: {
        customerId_fromHubSpotObjectId_toHubSpotObjectId_associationTypeId: {
          customerId: '1',
          fromHubSpotObjectId: hubspotSchool.id,
          toHubSpotObjectId: hubspotStudent.id,
          associationTypeId: associationDefinition.results[0].typeId
        }
      }
    });

    if (!existingMapping) {
      await prisma.associationMapping.create({
        data: {
          nativeAssociationId: schoolStudentAssociation.id,
          nativeObjectId: school.id,
          toNativeObjectId: student.id,
          fromObjectType: 'School',
          toObjectType: 'Student',
          nativeAssociationLabel: 'school_student',
          hubSpotAssociationLabel: 'company_to_contact',
          fromHubSpotObjectId: hubspotSchool.id,
          toHubSpotObjectId: hubspotStudent.id,
          customerId: '1',
          associationTypeId: associationDefinition.results[0].typeId,
          associationCategory: AssociationCategory.USER_DEFINED,
          cardinality: Cardinality.ONE_TO_MANY
        }
      });
      console.log('✅ Created association mapping between Prisma and HubSpot')
    } else {
      console.log('ℹ️ Association mapping already exists between Prisma and HubSpot')
    }
  }

  console.log('✨ Education data seed completed successfully!')
}
