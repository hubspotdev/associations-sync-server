import { PrismaClient, AssociationCategory, Cardinality } from '@prisma/client'
import {
  AssociationSpecAssociationCategoryEnum,
} from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';
import { hubspotClient } from '../../src/auth'
import { Client } from '@hubspot/api-client';
export async function seedEducationData(prisma: PrismaClient, hubspotClient:Client) {
  console.log('🚀 Starting education data seed...')

  // Create AssociationDefinition in Prisma
  const schoolStudentAssoc = await prisma.associationDefinition.create({
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
  console.log('✅ Created association definition in Prisma')

  // Create school in both systems
  const school = await prisma.company.create({
    data: {
      createdate: new Date(),
      domain: 'springfieldelem.edu',
      name: 'Springfield Elementary',
      archived: false
    }
  })
  console.log('✅ Created school in Prisma:', school.name)

  const hubspotSchool = await hubspotClient.crm.companies.basicApi.create({
    properties: {
      name: 'Springfield Elementary',
      domain: 'springfieldelem.edu',
    }
  })
  console.log('✅ Created school in HubSpot:', hubspotSchool.properties.name)

  // Create student in both systems
  const student = await prisma.contact.create({
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

  const hubspotStudent = await hubspotClient.crm.contacts.basicApi.create({
    properties: {
      email: 'bart.simpson@springfieldelem.edu',
      firstname: 'Bart',
      lastname: 'Simpson',
    }
  })
  console.log('✅ Created student in HubSpot:', `${hubspotStudent.properties.firstname} ${hubspotStudent.properties.lastname}`)

  // Create association definition in HubSpot
  const associationDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
    'companies',
    'contacts',
    {
      label: 'School to Student',
      name: 'school_to_student'
    }
  )
  console.log('✅ Created association definition in HubSpot with typeId:', associationDefinition.results[0].typeId)

  // Update Prisma association definition with HubSpot typeId
  await prisma.associationDefinition.update({
    where: { id: schoolStudentAssoc.id },
    data: {
      associationTypeId: associationDefinition.results[0].typeId
    }
  })
  console.log('✅ Updated Prisma association definition with HubSpot typeId')

  // Create HubSpot association
  await hubspotClient.crm.associations.v4.basicApi.create(
    'companies',
    hubspotSchool.id,
    'contacts',
    hubspotStudent.id,
    [{
      associationCategory: AssociationSpecAssociationCategoryEnum.UserDefined,
      associationTypeId: associationDefinition.results[0].typeId
    }]
  )
  console.log('✅ Created association in HubSpot between school and student')

  // Create Prisma association
  const association = await prisma.association.create({
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
  })
  console.log('✅ Created association in Prisma between school and student')

  // Create AssociationMapping
  await prisma.associationMapping.create({
    data: {
      nativeAssociationId: association.id,
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
  })
  console.log('✅ Created association mapping between Prisma and HubSpot')

  console.log('✨ Education data seed completed successfully!')
}
