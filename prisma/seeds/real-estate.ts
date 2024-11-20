import { PrismaClient, AssociationCategory, Cardinality } from '@prisma/client'
import { Client } from "@hubspot/api-client"
import {
  AssociationSpecAssociationCategoryEnum,
} from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';

export async function seedRealEstateData(prisma: PrismaClient) {
  const hubspotClient = new Client({ accessToken: process.env.ACCESS_TOKEN })
  console.log('🚀 Starting real estate data seed...')

  // Create AssociationDefinitions in Prisma
  const agentDealAssociationDef = await prisma.associationDefinition.create({
    data: {
      fromObjectType: 'Agent',
      toObjectType: 'Deal',
      associationLabel: 'agent_deal',
      name: 'Agent to Deal',
      inverseLabel: 'deal_agent',
      customerId: '1',
      cardinality: Cardinality.ONE_TO_MANY,
      associationCategory: AssociationCategory.HUBSPOT_DEFINED
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

  // Create deal in HubSpot
  const hubspotDeal = await hubspotClient.crm.deals.basicApi.create({
    properties: {
      dealname: '123 Luxury Villa Sale',
      amount: '1000000',
      dealstage: 'appointmentscheduled',
      pipeline: 'default',
    }
  })
  console.log('✅ Created deal in HubSpot:', hubspotDeal.properties.dealname)

  // Create deal record in Prisma
  const deal = await prisma.company.create({
    data: {
      createdate: new Date(),
      domain: 'luxuryestates.com',
      name: '123 Luxury Villa Sale',
      archived: false
    }
  })
  console.log('✅ Created deal in Prisma:', deal.name)

  // Create association definition in HubSpot
  const associationDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
    'contacts',
    'deals',
    {
      label: 'Agent to Deal',
      name: 'agent_to_deal'
    }
  )
  console.log('✅ Created association definition in HubSpot with typeId:', associationDefinition.results[0].typeId)

  // Update Prisma association definition with HubSpot typeId
  await prisma.associationDefinition.update({
    where: { id: agentDealAssociationDef.id },
    data: {
      associationTypeId: associationDefinition.results[0].typeId
    }
  })
  console.log('✅ Updated Prisma association definition with HubSpot typeId')

  // Create HubSpot association
  await hubspotClient.crm.associations.v4.basicApi.create(
    'contacts',
    hubspotAgent.id,
    'deals',
    hubspotDeal.id,
    [{
      associationCategory: AssociationSpecAssociationCategoryEnum.UserDefined,
      associationTypeId: associationDefinition.results[0].typeId
    }]
  )
  console.log('✅ Created association in HubSpot between agent and deal')

  // Create Prisma association
  const agentDealAssociation = await prisma.association.create({
    data: {
      objectType: 'Agent',
      objectId: agent.id,
      toObjectType: 'Deal',
      toObjectId: deal.id,
      associationLabel: 'agent_deal',
      associationTypeId: associationDefinition.results[0].typeId,
      customerId: '1',
      cardinality: Cardinality.ONE_TO_MANY,
      associationCategory: AssociationCategory.HUBSPOT_DEFINED
    }
  })
  console.log('✅ Created association in Prisma between agent and deal')

  // Create AssociationMapping
  await prisma.associationMapping.create({
    data: {
      nativeAssociationId: agentDealAssociation.id,
      nativeObjectId: agent.id,
      toNativeObjectId: deal.id,
      fromObjectType: 'Agent',
      toObjectType: 'Deal',
      nativeAssociationLabel: 'agent_deal',
      hubSpotAssociationLabel: 'contact_to_deal',
      fromHubSpotObjectId: hubspotAgent.id,
      toHubSpotObjectId: hubspotDeal.id,
      customerId: '1',
      associationTypeId: associationDefinition.results[0].typeId,
      associationCategory: AssociationCategory.HUBSPOT_DEFINED,
      cardinality: Cardinality.ONE_TO_MANY
    }
  })
  console.log('✅ Created association mapping between Prisma and HubSpot')

  console.log('✨ Real estate data seed completed successfully!')
}
