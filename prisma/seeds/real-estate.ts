import { PrismaClient, AssociationCategory, Cardinality } from '@prisma/client'
import {
  AssociationSpecAssociationCategoryEnum,
} from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';
import { Client } from '@hubspot/api-client';

export async function seedRealEstateData(prisma: PrismaClient, hubspotClient:Client) {
  console.log('🚀 Starting real estate data seed...')

  // Create AssociationDefinitions in Prisma
  const agentCompanyAssociationDef = await prisma.associationDefinition.create({
    data: {
      fromObjectType: 'Contact',
      toObjectType: 'Company',
      associationLabel: 'agent_company',
      name: 'Agent to Company',
      inverseLabel: 'company_agent',
      customerId: '1',
      cardinality: Cardinality.ONE_TO_MANY,
      associationCategory: AssociationCategory.USER_DEFINED
    }
  })
  console.log('✅ Created association definition in Prisma')

  // Create agent in both systems
  const agent = await prisma.contact.create({
    data: {
      createdate: new Date(),
      email: 'sarah.realtor@luxuryestates.com',
      firstname: 'Sarah',
      lastname: 'Johnson',
      lastmodifieddate: new Date(),
      archived: false
    }
  })
  console.log('✅ Created agent in Prisma:', `${agent.firstname} ${agent.lastname}`)

  const hubspotAgent = await hubspotClient.crm.contacts.basicApi.create({
    properties: {
      email: 'sarah.realtor@luxuryestates.com',
      firstname: 'Sarah',
      lastname: 'Johnson',
    }
  })
  console.log('✅ Created agent in HubSpot:', `${hubspotAgent.properties.firstname} ${hubspotAgent.properties.lastname}`)

  // Create company in HubSpot (instead of deal)
  const hubspotCompany = await hubspotClient.crm.companies.basicApi.create({
    properties: {
      name: '123 Luxury Villa',
      domain: 'luxuryestates.com',
    }
  })
  console.log('✅ Created company in HubSpot:', hubspotCompany.properties.name)

  // Create company record in Prisma
  const company = await prisma.company.create({
    data: {
      createdate: new Date(),
      domain: 'luxuryestates.com',
      name: '123 Luxury Villa',
      archived: false
    }
  })
  console.log('✅ Created company in Prisma:', company.name)

  // Create association definition in HubSpot
  const associationDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
    'contacts',
    'companies',
    {
      label: 'Agent to Company',
      name: 'agent_to_company'
    }
  )
  console.log('✅ Created association definition in HubSpot with typeId:', associationDefinition.results[0].typeId)

  // Update Prisma association definition with HubSpot typeId
  await prisma.associationDefinition.update({
    where: { id: agentCompanyAssociationDef.id },
    data: {
      associationTypeId: associationDefinition.results[0].typeId
    }
  })
  console.log('✅ Updated Prisma association definition with HubSpot typeId')
  console.log('contact, company and typeID', hubspotAgent, hubspotCompany, associationDefinition.results)

  // Add a delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  // Create HubSpot association
  await hubspotClient.crm.associations.v4.basicApi.create(
    'contacts',
    hubspotAgent.id,
    'companies',
    hubspotCompany.id,
    [{
      associationCategory: AssociationSpecAssociationCategoryEnum.UserDefined,
      associationTypeId: associationDefinition.results[1].typeId
    }]
  )
  console.log('✅ Created association in HubSpot between agent and company')

  // Create Prisma association
  const agentCompanyAssociation = await prisma.association.create({
    data: {
      objectType: 'Contact',
      objectId: agent.id,
      toObjectType: 'Company',
      toObjectId: company.id,
      associationLabel: 'agent_company',
      associationTypeId: associationDefinition.results[1].typeId,
      customerId: '1',
      cardinality: Cardinality.ONE_TO_MANY,
      associationCategory: AssociationCategory.USER_DEFINED
    }
  })
  console.log('✅ Created association in Prisma between agent and company')

  // Create AssociationMapping
  await prisma.associationMapping.create({
    data: {
      nativeAssociationId: agentCompanyAssociation.id,
      nativeObjectId: agent.id,
      toNativeObjectId: company.id,
      fromObjectType: 'Contact',
      toObjectType: 'Company',
      nativeAssociationLabel: 'agent_company',
      hubSpotAssociationLabel: 'contact_to_company',
      fromHubSpotObjectId: hubspotAgent.id,
      toHubSpotObjectId: hubspotCompany.id,
      customerId: '1',
      associationTypeId: associationDefinition.results[1].typeId,
      associationCategory: AssociationCategory.USER_DEFINED,
      cardinality: Cardinality.ONE_TO_MANY
    }
  })
  console.log('✅ Created association mapping between Prisma and HubSpot')

  console.log('✨ Real estate data seed completed successfully!')
}
