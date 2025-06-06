import { AssociationCategory, Cardinality, PrismaClient } from '@prisma/client'
import handleError from '../../src/utils/error'
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies';
import Logger from '../../src/utils/logger';

export async function seedPRMData(prisma: PrismaClient, hubspotClient:Client) {
  Logger.info({
    type: 'Seed',
    context: 'Partnership',
    logMessage: {
      message: 'Starting base data seed...'
    }
  });

  // Check if AssociationDefinition already exists in Prisma
  let employeeCompanyAssoc;
  const existingEmployeeCompanyDef = await prisma.associationDefinition.findFirst({
    where: {
      fromObjectType: 'Contact',
      toObjectType: 'Company',
      associationLabel: 'Employee Of',
      customerId: '1'
    }
  });

  if (!existingEmployeeCompanyDef) {
    employeeCompanyAssoc = await prisma.associationDefinition.create({
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
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Created employee-company association definition in Prisma'
      }
    });
  } else {
    employeeCompanyAssoc = existingEmployeeCompanyDef;
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Employee-company association definition already exists in Prisma'
      }
    });
  }

  // Check for existing company1 in Prisma
  let company1;
  const existingCompany1 = await prisma.company.findFirst({
    where: {
      domain: 'example.com'
    }
  });

  if (!existingCompany1) {
    company1 = await prisma.company.create({
      data: {
        createdate: new Date(),
        domain: 'example.com',
        name: 'Example Company',
        archived: false,
      }
    })
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Created company in Prisma:',
        data: { company: company1.name }
      }
    });
  } else {
    company1 = existingCompany1;
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Company already exists in Prisma:',
        data: { company: company1.name }
      }
    });
  }

  // Check for existing company1 in HubSpot
  let hubspotCompany1;
  try {
    const searchResults = await hubspotClient.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'domain',
          operator: FilterOperatorEnum.Eq,
          value: 'example.com'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotCompany1 = searchResults.results[0];
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Company already exists in HubSpot:',
          data: { company: hubspotCompany1.properties.name }
        }
      });
    } else {
      hubspotCompany1 = await hubspotClient.crm.companies.basicApi.create({
        properties: {
          domain: 'example.com',
          name: 'Example Company',
        }
      })
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Created company in HubSpot:',
          data: { company: hubspotCompany1.properties.name }
        }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Partnership - Company creation',
      logMessage: {
        message: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }

  // Check for existing company2 in Prisma
  let company2;
  const existingCompany2 = await prisma.company.findFirst({
    where: {
      domain: 'samplecorp.com'
    }
  });

  if (!existingCompany2) {
    company2 = await prisma.company.create({
      data: {
        createdate: new Date(),
        domain: 'samplecorp.com',
        name: 'Sample Corporation',
        archived: false,
      }
    })
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Created second company in Prisma:',
        data: { company: company2.name }
      }
    });
  } else {
    company2 = existingCompany2;
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Second company already exists in Prisma:',
        data: { company: company2.name }
      }
    });
  }

  // Check for existing company2 in HubSpot
  let hubspotCompany2;
  try {
    const searchResults = await hubspotClient.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'domain',
          operator: FilterOperatorEnum.Eq,
          value: 'samplecorp.com'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotCompany2 = searchResults.results[0];
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Second company already exists in HubSpot:',
          data: { company: hubspotCompany2.properties.name }
        }
      });
    } else {
      hubspotCompany2 = await hubspotClient.crm.companies.basicApi.create({
        properties: {
          domain: 'samplecorp.com',
          name: 'Sample Corporation',
        }
      })
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Created second company in HubSpot:',
          data: { company: hubspotCompany2.properties.name }
        }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Partnership - Company creation',
      logMessage: {
        message: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }

  // Check for existing contact1 in Prisma
  let contact1;
  const existingContact1 = await prisma.contact.findFirst({
    where: {
      email: 'john.doe@example.com'
    }
  });

  if (!existingContact1) {
    contact1 = await prisma.contact.create({
      data: {
        createdate: new Date(),
        email: 'john.doe@example.com',
        firstname: 'John',
        lastname: 'Doe',
        lastmodifieddate: new Date(),
        archived: false,
      }
    })
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Created contact in Prisma:',
        data: { contact: `${contact1.firstname} ${contact1.lastname}` }
      }
    });
  } else {
    contact1 = existingContact1;
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Contact already exists in Prisma:',
        data: { contact: `${contact1.firstname} ${contact1.lastname}` }
      }
    });
  }

  // Check for existing contact1 in HubSpot
  let hubspotContact1;
  try {
    const searchResults = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: FilterOperatorEnum.Eq,
          value: 'john.doe@example.com'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotContact1 = searchResults.results[0];
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Contact already exists in HubSpot:',
          data: { contact: `${hubspotContact1.properties.firstname} ${hubspotContact1.properties.lastname}` }
        }
      });
    } else {
      hubspotContact1 = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          email: 'john.doe@example.com',
          firstname: 'John',
          lastname: 'Doe',
        }
      })
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Created contact in HubSpot:',
          data: { contact: `${hubspotContact1.properties.firstname} ${hubspotContact1.properties.lastname}` }
        }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Partnership - Contact creation',
      logMessage: {
        message: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }

  // Similar checks for contact2
  let contact2;
  const existingContact2 = await prisma.contact.findFirst({
    where: {
      email: 'jane.smith@samplecorp.com'
    }
  });

  if (!existingContact2) {
    contact2 = await prisma.contact.create({
      data: {
        createdate: new Date(),
        email: 'jane.smith@samplecorp.com',
        firstname: 'Jane',
        lastname: 'Smith',
        lastmodifieddate: new Date(),
        archived: false,
      }
    })
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Created second contact in Prisma:',
        data: { contact: `${contact2.firstname} ${contact2.lastname}` }
      }
    });
  } else {
    contact2 = existingContact2;
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Second contact already exists in Prisma:',
        data: { contact: `${contact2.firstname} ${contact2.lastname}` }
      }
    });
  }

  // Check for existing contact2 in HubSpot
  let hubspotContact2;
  try {
    const searchResults = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: FilterOperatorEnum.Eq,
          value: 'jane.smith@samplecorp.com'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotContact2 = searchResults.results[0];
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Second contact already exists in HubSpot:',
          data: { contact: `${hubspotContact2.properties.firstname} ${hubspotContact2.properties.lastname}` }
        }
      });
    } else {
      hubspotContact2 = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          email: 'jane.smith@samplecorp.com',
          firstname: 'Jane',
          lastname: 'Smith',
        }
      })
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Created second contact in HubSpot:',
          data: { contact: `${hubspotContact2.properties.firstname} ${hubspotContact2.properties.lastname}` }
        }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Partnership - Contact creation',
      logMessage: {
        message: error instanceof Error ? error.message : String(error)
      }
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
      def => def.label === 'Partner Representative'
    );

    if (existingDefinition) {
      associationDefinition = { results: [existingDefinition] };
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Association definition already exists in HubSpot with typeId:',
          data: { typeId: existingDefinition.typeId }
        }
      });
    } else {
      associationDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
        'contacts',
        'companies',
        {
          label: 'Partner Representative',
          name: 'partner_representative'
        }
      )
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Created association definition in HubSpot with typeId:',
          data: { typeId: associationDefinition.results[0].typeId }
        }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Partnership - Association definition creation',
      logMessage: {
        message: error instanceof Error ? error.message : String(error)
      }
    });
    throw error;
  }

  // Check and update Prisma association definition with HubSpot typeId
  const existingAssocDef = await prisma.associationDefinition.findFirst({
    where: {
      fromObjectType: 'Contact',
      toObjectType: 'Company',
      associationLabel: 'Employee Of',
      associationTypeId: associationDefinition.results[0].typeId
    }
  });

  if (!existingAssocDef) {
    await prisma.associationDefinition.update({
      where: { id: employeeCompanyAssoc.id },
      data: {
        associationTypeId: associationDefinition.results[0].typeId
      }
    })
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Updated Prisma association definition with HubSpot typeId'
      }
    });
  } else {
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Association definition already exists with this typeId'
      }
    });
  }

  // Check for existing associations in Prisma
  let association1;
  const existingAssociation1 = await prisma.association.findUnique({
    where: {
      customerId_toObjectId_objectId_associationLabel_associationTypeId: {
        customerId: '1',
        toObjectId: company1.id,
        objectId: contact1.id,
        associationLabel: 'Employee Of',
        associationTypeId: associationDefinition.results[0].typeId
      }
    }
  });

  if (!existingAssociation1) {
    association1 = await prisma.association.create({
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
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Created first association in Prisma'
      }
    });
  } else {
    association1 = existingAssociation1;
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'First association already exists in Prisma'
      }
    });
  }

  // Create association mapping if association was created
  if (association1) {
    const existingMapping1 = await prisma.associationMapping.findUnique({
      where: {
        customerId_fromHubSpotObjectId_toHubSpotObjectId_associationTypeId: {
          customerId: '1',
          fromHubSpotObjectId: hubspotContact1.id,
          toHubSpotObjectId: hubspotCompany1.id,
          associationTypeId: associationDefinition.results[0].typeId
        }
      }
    });

    if (!existingMapping1) {
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
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Created first association mapping'
        }
      });
    } else {
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'First association mapping already exists'
        }
      });
    }
  }

  // Similar checks for second association and mapping
  let association2;
  const existingAssociation2 = await prisma.association.findUnique({
    where: {
      customerId_toObjectId_objectId_associationLabel_associationTypeId: {
        customerId: '1',
        toObjectId: company2.id,
        objectId: contact2.id,
        associationLabel: 'Manager',
        associationTypeId: associationDefinition.results[0].typeId
      }
    }
  });

  if (!existingAssociation2) {
    association2 = await prisma.association.create({
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
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Created second association in Prisma'
      }
    });
  } else {
    association2 = existingAssociation2;
    Logger.info({
      type: 'Seed',
      context: 'Partnership',
      logMessage: {
        message: 'Second association already exists in Prisma'
      }
    });
  }

  if (association2) {
    const existingMapping2 = await prisma.associationMapping.findUnique({
      where: {
        customerId_fromHubSpotObjectId_toHubSpotObjectId_associationTypeId: {
          customerId: '1',
          fromHubSpotObjectId: hubspotContact2.id,
          toHubSpotObjectId: hubspotCompany2.id,
          associationTypeId: associationDefinition.results[0].typeId
        }
      }
    });

    if (!existingMapping2) {
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
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Created second association mapping'
        }
      });
    } else {
      Logger.info({
        type: 'Seed',
        context: 'Partnership',
        logMessage: {
          message: 'Second association mapping already exists'
        }
      });
    }
  }

  Logger.info({
    type: 'Seed',
    context: 'Partnership',
    logMessage: {
      message: 'Base data seed completed successfully!'
    }
  });
}
