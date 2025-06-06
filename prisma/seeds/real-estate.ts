import { PrismaClient, AssociationCategory, Cardinality } from '@prisma/client'
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies';
import Logger from '../../src/utils/logger';

export async function seedRealEstateData(prisma: PrismaClient, hubspotClient:Client) {
  Logger.info({
    type: 'Seed',
    context: 'Real Estate',
    logMessage: { message: 'Starting real estate data seed...' }
  });

  // Check if AssociationDefinition already exists in Prisma
  let agentCompanyAssoc;
  const existingAgentCompanyDef = await prisma.associationDefinition.findFirst({
    where: {
      fromObjectType: 'Contact',
      toObjectType: 'Company',
      associationLabel: 'agent_company',
      customerId: '1'
    }
  });

  if (!existingAgentCompanyDef) {
    agentCompanyAssoc = await prisma.associationDefinition.create({
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
    Logger.info({
      type: 'Seed',
      context: 'Real Estate',
      logMessage: { message: 'Created agent-company association definition in Prisma' }
    });
  } else {
    agentCompanyAssoc = existingAgentCompanyDef;
    Logger.info({
      type: 'Seed',
      context: 'Real Estate',
      logMessage: { message: 'Agent-company association definition already exists in Prisma' }
    });
  }

  // Check for existing agent in Prisma
  let agent;
  const existingAgent = await prisma.contact.findFirst({
    where: {
      email: 'sarah.realtor@luxuryestates.com'
    }
  });

  if (!existingAgent) {
    agent = await prisma.contact.create({
      data: {
        createdate: new Date(),
        email: 'sarah.realtor@luxuryestates.com',
        firstname: 'Sarah',
        lastname: 'Johnson',
        lastmodifieddate: new Date(),
        archived: false
      }
    })
    Logger.info({
      type: 'Seed',
      context: 'Real Estate',
      logMessage: { message: 'Created agent in Prisma:', data: { firstname: agent.firstname, lastname: agent.lastname } }
    });
  } else {
    agent = existingAgent;
    Logger.info({
      type: 'Seed',
      context: 'Real Estate',
      logMessage: { message: 'Agent already exists in Prisma:', data: { firstname: agent.firstname, lastname: agent.lastname } }
    });
  }

  // Check for existing agent in HubSpot
  let hubspotAgent;
  try {
    const searchResults = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: FilterOperatorEnum.Eq,
          value: 'sarah.realtor@luxuryestates.com'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotAgent = searchResults.results[0];
      Logger.info({
        type: 'Seed',
        context: 'Real Estate',
        logMessage: { message: 'Agent already exists in HubSpot:', data: { firstname: hubspotAgent.properties.firstname, lastname: hubspotAgent.properties.lastname } }
      });
    } else {
      hubspotAgent = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          email: 'sarah.realtor@luxuryestates.com',
          firstname: 'Sarah',
          lastname: 'Johnson',
        }
      });
      Logger.info({
        type: 'Seed',
        context: 'Real Estate',
        logMessage: { message: 'Created agent in HubSpot:', data: { firstname: hubspotAgent.properties.firstname, lastname: hubspotAgent.properties.lastname } }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Real Estate - Agent creation',
      logMessage: { message: error instanceof Error ? error.message : String(error) }
    });
    throw error;
  }

  // Check for existing company in Prisma
  let company;
  const existingCompany = await prisma.company.findFirst({
    where: {
      domain: 'luxuryestates.com'
    }
  });

  if (!existingCompany) {
    company = await prisma.company.create({
      data: {
        createdate: new Date(),
        domain: 'luxuryestates.com',
        name: '123 Luxury Villa',
        archived: false
      }
    })
    Logger.info({
      type: 'Seed',
      context: 'Real Estate',
      logMessage: { message: 'Created company in Prisma:', data: { name: company.name } }
    });
  } else {
    company = existingCompany;
    Logger.info({
      type: 'Seed',
      context: 'Real Estate',
      logMessage: { message: 'Company already exists in Prisma:', data: { name: company.name } }
    });
  }

  // Check for existing company in HubSpot
  let hubspotCompany;
  try {
    const searchResults = await hubspotClient.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'domain',
          operator: FilterOperatorEnum.Eq,
          value: 'luxuryestates.com'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotCompany = searchResults.results[0];
      Logger.info({
        type: 'Seed',
        context: 'Real Estate',
        logMessage: { message: 'Company already exists in HubSpot:', data: { name: hubspotCompany.properties.name } }
      });
    } else {
      hubspotCompany = await hubspotClient.crm.companies.basicApi.create({
        properties: {
          name: '123 Luxury Villa',
          domain: 'luxuryestates.com',
        }
      });
      Logger.info({
        type: 'Seed',
        context: 'Real Estate',
        logMessage: { message: 'Created company in HubSpot:', data: { name: hubspotCompany.properties.name } }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Real Estate - Company creation',
      logMessage: { message: error instanceof Error ? error.message : String(error) }
    });
    throw error;
  }

  // Check for existing association definition in HubSpot
  let associationDefinition;
  try {
    const definitions = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(
      'contacts',
      'companies'
    );

    const existingDefinition = definitions.results.find(
      def => def.label === 'Agent to Company'
    );

    if (existingDefinition) {
      associationDefinition = { results: [existingDefinition] };
      Logger.info({
        type: 'Seed',
        context: 'Real Estate',
        logMessage: { message: 'Association definition already exists in HubSpot with typeId:', data: { typeId: existingDefinition.typeId } }
      });
    } else {
      associationDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
        'contacts',
        'companies',
        {
          label: 'Agent to Company',
          name: 'agent_to_company'
        }
      );
      Logger.info({
        type: 'Seed',
        context: 'Real Estate',
        logMessage: { message: 'Created association definition in HubSpot with typeId:', data: { typeId: associationDefinition.results[0].typeId } }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Real Estate - Association definition creation',
      logMessage: { message: error instanceof Error ? error.message : String(error) }
    });
    throw error;
  }

  // Check and update Prisma association definition with HubSpot typeId
  const existingAssocDef = await prisma.associationDefinition.findFirst({
    where: {
      fromObjectType: 'Contact',
      toObjectType: 'Company',
      associationLabel: 'agent_company',
      associationTypeId: associationDefinition.results[0].typeId
    }
  });

  if (!existingAssocDef) {
    await prisma.associationDefinition.update({
      where: { id: agentCompanyAssoc.id },
      data: {
        associationTypeId: associationDefinition.results[0].typeId
      }
    });
    Logger.info({
      type: 'Seed',
      context: 'Real Estate',
      logMessage: { message: 'Updated Prisma association definition with HubSpot typeId' }
    });
  } else {
    Logger.info({
      type: 'Seed',
      context: 'Real Estate',
      logMessage: { message: 'Association definition already exists with this typeId' }
    });
  }

  // Check if association exists in Prisma
  const existingAssociation = await prisma.association.findUnique({
    where: {
      customerId_toObjectId_objectId_associationLabel_associationTypeId: {
        customerId: '1',
        toObjectId: company.id,
        objectId: agent.id,
        associationLabel: 'agent_company',
        associationTypeId: associationDefinition.results[0].typeId
      }
    }
  });

  let agentCompanyAssociation;
  if (!existingAssociation) {
    agentCompanyAssociation = await prisma.association.create({
      data: {
        objectType: 'Contact',
        objectId: agent.id,
        toObjectType: 'Company',
        toObjectId: company.id,
        associationLabel: 'agent_company',
        associationTypeId: associationDefinition.results[0].typeId,
        customerId: '1',
        cardinality: Cardinality.ONE_TO_MANY,
        associationCategory: AssociationCategory.USER_DEFINED
      }
    });
    Logger.info({
      type: 'Seed',
      context: 'Real Estate',
      logMessage: { message: 'Created association in Prisma between agent and company' }
    });
  } else {
    agentCompanyAssociation = existingAssociation;
    Logger.info({
      type: 'Seed',
      context: 'Real Estate',
      logMessage: { message: 'Association already exists in Prisma between agent and company' }
    });
  }

  // Create association mapping if association was created
  if (agentCompanyAssociation) {
    const existingMapping = await prisma.associationMapping.findUnique({
      where: {
        customerId_fromHubSpotObjectId_toHubSpotObjectId_associationTypeId: {
          customerId: '1',
          fromHubSpotObjectId: hubspotAgent.id,
          toHubSpotObjectId: hubspotCompany.id,
          associationTypeId: associationDefinition.results[0].typeId
        }
      }
    });

    if (!existingMapping) {
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
          associationTypeId: associationDefinition.results[0].typeId,
          associationCategory: AssociationCategory.USER_DEFINED,
          cardinality: Cardinality.ONE_TO_MANY
        }
      });
      Logger.info({
        type: 'Seed',
        context: 'Real Estate',
        logMessage: { message: 'Created association mapping between Prisma and HubSpot' }
      });
    } else {
      Logger.info({
        type: 'Seed',
        context: 'Real Estate',
        logMessage: { message: 'Association mapping already exists between Prisma and HubSpot' }
      });
    }
  }

  Logger.info({
    type: 'Seed',
    context: 'Real Estate',
    logMessage: { message: 'Real estate data seed completed successfully!' }
  });
}
