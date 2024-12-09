import { AssociationCategory, Cardinality, PrismaClient } from '@prisma/client'
import { hubspotClient } from '../../src/auth'
import {
  AssociationSpecAssociationCategoryEnum,
} from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec'
import handleError from '../../src/utils/error'
import { Client } from '@hubspot/api-client';

export async function seedPRMData(prisma: PrismaClient, hubspotClient:Client) {
  console.log('🚀 Starting base data seed...')

  // Clear existing data (only for development)
  await prisma.association.deleteMany()
  await prisma.associationMapping.deleteMany()
  await prisma.associationDefinition.deleteMany()
  await prisma.company.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.authorization.deleteMany()
  console.log('✅ Cleared existing data')

  // Create AssociationDefinition in Prisma
  const employeeCompanyAssoc = await prisma.associationDefinition.create({
    data: {
      fromObjectType: 'Contact',
      toObjectType: 'Company',
      associationLabel: 'Employee Of',
      name: 'employee_of',
      inverseLabel: 'company_employee',
      customerId: '1',
      cardinality: Cardinality.ONE_TO_MANY,
      associationCategory: AssociationCategory.INTEGRATOR_DEFINED
    }
  })
  console.log('✅ Created employee-company association definition in Prisma')

  // Create companies in both systems
  const company1 = await prisma.company.create({
    data: {
      createdate: new Date(),
      domain: 'example.com',
      name: 'Example Company',
      archived: false,
    }
  })
  console.log('✅ Created company in Prisma:', company1.name)

  const hubspotCompany1 = await hubspotClient.crm.companies.basicApi.create({
    properties: {
      domain: 'example.com',
      name: 'Example Company',
    }
  })
  console.log('✅ Created company in HubSpot:', hubspotCompany1.properties.name)

  const company2 = await prisma.company.create({
    data: {
      createdate: new Date(),
      domain: 'samplecorp.com',
      name: 'Sample Corporation',
      archived: false,
    }
  })
  console.log('✅ Created second company in Prisma:', company2.name)

  const hubspotCompany2 = await hubspotClient.crm.companies.basicApi.create({
    properties: {
      domain: 'samplecorp.com',
      name: 'Sample Corporation',
    }
  })
  console.log('✅ Created second company in HubSpot:', hubspotCompany2.properties.name)

  // Create contacts in both systems
  const contact1 = await prisma.contact.create({
    data: {
      createdate: new Date(),
      email: 'john.doe@example.com',
      firstname: 'John',
      lastname: 'Doe',
      lastmodifieddate: new Date(),
      archived: false,
    }
  })
  console.log('✅ Created contact in Prisma:', `${contact1.firstname} ${contact1.lastname}`)

  const hubspotContact1 = await hubspotClient.crm.contacts.basicApi.create({
    properties: {
      email: 'john.doe@example.com',
      firstname: 'John',
      lastname: 'Doe',
    }
  })
  console.log('✅ Created contact in HubSpot:', `${hubspotContact1.properties.firstname} ${hubspotContact1.properties.lastname}`)

  const contact2 = await prisma.contact.create({
    data: {
      createdate: new Date(),
      email: 'jane.smith@samplecorp.com',
      firstname: 'Jane',
      lastname: 'Smith',
      lastmodifieddate: new Date(),
      archived: false,
    }
  })
  console.log('✅ Created second contact in Prisma:', `${contact2.firstname} ${contact2.lastname}`)

  const hubspotContact2 = await hubspotClient.crm.contacts.basicApi.create({
    properties: {
      email: 'jane.smith@samplecorp.com',
      firstname: 'Jane',
      lastname: 'Smith',
    }
  })
  console.log('✅ Created second contact in HubSpot:', `${hubspotContact2.properties.firstname} ${hubspotContact2.properties.lastname}`)

  // Create association definition in HubSpot
  const associationDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
    'contacts',
    'companies',
    {
      label: 'Partner Representative',
      name: 'partner_representative'
    }
  )
  console.log('✅ Created association definition in HubSpot with typeId:', associationDefinition.results[0].typeId)

  // Update Prisma association definition with HubSpot typeId
  await prisma.associationDefinition.update({
    where: { id: employeeCompanyAssoc.id },
    data: {
      associationTypeId: associationDefinition.results[0].typeId
    }
  })
  console.log('✅ Updated Prisma association definition with HubSpot typeId')

  // Create associations in both systems
  const association1 = await prisma.association.create({
    data: {
      objectType: 'Contact',
      objectId: contact1.id,
      toObjectType: 'Company',
      toObjectId: company1.id,
      associationLabel: 'Employee Of',
      associationTypeId: associationDefinition.results[0].typeId,
      customerId: '1',
      cardinality: Cardinality.ONE_TO_ONE,
      associationCategory: AssociationCategory.HUBSPOT_DEFINED,
    }
  })
  console.log('✅ Created first association in Prisma')

  await hubspotClient.crm.associations.v4.basicApi.create(
    'contacts',
    hubspotContact1.id,
    'companies',
    hubspotCompany1.id,
    [{
      associationCategory: AssociationSpecAssociationCategoryEnum.HubspotDefined,
      associationTypeId: associationDefinition.results[0].typeId
    }]
  )
  console.log('✅ Created first association in HubSpot')

  const association2 = await prisma.association.create({
    data: {
      objectType: 'Contact',
      objectId: contact2.id,
      toObjectType: 'Company',
      toObjectId: company2.id,
      associationLabel: 'Manager',
      associationTypeId: associationDefinition.results[0].typeId,
      customerId: '1',
      cardinality: Cardinality.ONE_TO_ONE,
      associationCategory: AssociationCategory.INTEGRATOR_DEFINED,
    }
  })
  console.log('✅ Created second association in Prisma')

  await hubspotClient.crm.associations.v4.basicApi.create(
    'contacts',
    hubspotContact2.id,
    'companies',
    hubspotCompany2.id,
    [{
      associationCategory: AssociationSpecAssociationCategoryEnum.IntegratorDefined,
      associationTypeId: associationDefinition.results[0].typeId
    }]
  )
  console.log('✅ Created second association in HubSpot')

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
      fromHubSpotObjectId: hubspotContact1.id,
      toHubSpotObjectId: hubspotCompany1.id,
      customerId: '1',
      associationTypeId: associationDefinition.results[0].typeId,
      associationCategory: AssociationCategory.HUBSPOT_DEFINED,
      cardinality: Cardinality.ONE_TO_ONE,
    }
  })
  console.log('✅ Created first association mapping')

  await prisma.associationMapping.create({
    data: {
      nativeAssociationId: association2.id,
      nativeObjectId: contact2.id,
      toNativeObjectId: company2.id,
      fromObjectType: 'Contact',
      toObjectType: 'Company',
      nativeAssociationLabel: 'Manager',
      hubSpotAssociationLabel: 'Contact to Company',
      fromHubSpotObjectId: hubspotContact2.id,
      toHubSpotObjectId: hubspotCompany2.id,
      customerId: '1',
      associationTypeId: associationDefinition.results[0].typeId,
      associationCategory: AssociationCategory.INTEGRATOR_DEFINED,
      cardinality: Cardinality.ONE_TO_ONE,
    }
  })
  console.log('✅ Created second association mapping')

  console.log('✨ Base data seed completed successfully!')
}
