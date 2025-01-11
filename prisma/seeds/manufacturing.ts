import { PrismaClient, AssociationCategory, Cardinality } from '@prisma/client'
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies';

export async function seedManufacturingData(prisma: PrismaClient, hubspotClient: Client) {
  console.log('🚀 Starting manufacturing data seed...', prisma)

  // Check if AssociationDefinition already exists in Prisma
  let supplierProductAssoc;
  const existingSupplierProductDef = await prisma.associationDefinition.findFirst({
    where: {
      fromObjectType: 'Supplier',
      toObjectType: 'Product',
      associationLabel: 'supplier_product',
      customerId: '1'
    }
  });

  if (!existingSupplierProductDef) {
    supplierProductAssoc = await prisma.associationDefinition.create({
      data: {
        fromObjectType: 'Supplier',
        toObjectType: 'Product',
        associationLabel: 'supplier_product',
        name: 'Supplier to Product',
        inverseLabel: 'product_supplier',
        customerId: '1',
        cardinality: Cardinality.ONE_TO_MANY,
        associationCategory: AssociationCategory.USER_DEFINED
      }
    })
    console.log('✅ Created association definition in Prisma')
  } else {
    supplierProductAssoc = existingSupplierProductDef;
    console.log('ℹ️ Association definition already exists in Prisma')
  }

  // Check for existing supplier in Prisma
  let supplier;
  const existingSupplier = await prisma.company.findFirst({
    where: {
      domain: 'acmesupplies.com'
    }
  });

  if (!existingSupplier) {
    supplier = await prisma.company.create({
      data: {
        createdate: new Date(),
        domain: 'acmesupplies.com',
        name: 'Acme Industrial Supplies',
        archived: false
      }
    })
    console.log('✅ Created supplier in Prisma:', supplier.name)
  } else {
    supplier = existingSupplier;
    console.log('ℹ️ Supplier already exists in Prisma:', supplier.name)
  }

  // Check for existing supplier in HubSpot
  let hubspotSupplier;
  try {
    const searchResults = await hubspotClient.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'domain',
          operator: FilterOperatorEnum.Eq,
          value: 'acmesupplies.com'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotSupplier = searchResults.results[0];
      console.log('ℹ️ Supplier already exists in HubSpot:', hubspotSupplier.properties.name);
    } else {
      hubspotSupplier = await hubspotClient.crm.companies.basicApi.create({
        properties: {
          name: 'Acme Industrial Supplies',
          domain: 'acmesupplies.com',
        }
      });
      console.log('✅ Created supplier in HubSpot:', hubspotSupplier.properties.name)
    }
  } catch (error) {
    console.error('Error while checking/creating supplier in HubSpot:', error);
    throw error;
  }

  // Check for existing product in Prisma
  let product;
  const existingProduct = await prisma.company.findFirst({
    where: {
      domain: 'techmanufacturing.com'
    }
  });

  if (!existingProduct) {
    product = await prisma.company.create({
      data: {
        createdate: new Date(),
        domain: 'techmanufacturing.com',
        name: 'Circuit Board X1000',
        archived: false
      }
    })
    console.log('✅ Created product in Prisma:', product.name)
  } else {
    product = existingProduct;
    console.log('ℹ️ Product already exists in Prisma:', product.name)
  }

  // Check for existing product in HubSpot
  let hubspotProduct;
  try {
    const searchResults = await hubspotClient.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'domain',
          operator: FilterOperatorEnum.Eq,
          value: 'techmanufacturing.com'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotProduct = searchResults.results[0];
      console.log('ℹ️ Product already exists in HubSpot:', hubspotProduct.properties.name);
    } else {
      hubspotProduct = await hubspotClient.crm.companies.basicApi.create({
        properties: {
          name: 'Circuit Board X1000',
          domain: 'techmanufacturing.com',
        }
      });
      console.log('✅ Created product in HubSpot:', hubspotProduct.properties.name)
    }
  } catch (error) {
    console.error('Error while checking/creating product in HubSpot:', error);
    throw error;
  }

  // Check for existing association definition in HubSpot
  let associationDefinition;
  try {
    const definitions = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(
      'companies',
      'companies'
    );

    const existingDefinition = definitions.results.find(
      def => def.label === 'Supplier to Buyer'
    );

    if (existingDefinition) {
      associationDefinition = { results: [existingDefinition] };
      console.log('ℹ️ Association definition already exists in HubSpot with typeId:', existingDefinition.typeId);
    } else {
      associationDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
        'companies',
        'companies',
        {
          label: 'Supplier to Buyer',
          name: 'supplier_buyer',
          inverseLabel:'Buyer to Supplier'
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
      fromObjectType: 'Supplier',
      toObjectType: 'Product',
      associationLabel: 'supplier_product',
      associationTypeId: associationDefinition.results[0].typeId
    }
  });

  if (!existingAssocDef) {
    await prisma.associationDefinition.update({
      where: { id: supplierProductAssoc.id },
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
        toObjectId: product.id,
        objectId: supplier.id,
        associationLabel: 'supplier_product',
        associationTypeId: associationDefinition.results[0].typeId
      }
    }
  });

  let supplierProductAssociation;
  if (!existingAssociation) {
    supplierProductAssociation = await prisma.association.create({
      data: {
        objectType: 'Supplier',
        objectId: supplier.id,
        toObjectType: 'Product',
        toObjectId: product.id,
        associationLabel: 'supplier_product',
        associationTypeId: associationDefinition.results[0].typeId,
        customerId: '1',
        cardinality: Cardinality.ONE_TO_MANY,
        associationCategory: AssociationCategory.USER_DEFINED
      }
    });
    console.log('✅ Created association in Prisma between supplier and product')
  } else {
    supplierProductAssociation = existingAssociation;
    console.log('ℹ️ Association already exists in Prisma between supplier and product')
  }

  // Create association mapping if association was created
  if (supplierProductAssociation) {
    const existingMapping = await prisma.associationMapping.findUnique({
      where: {
        customerId_fromHubSpotObjectId_toHubSpotObjectId_associationTypeId: {
          customerId: '1',
          fromHubSpotObjectId: hubspotSupplier.id,
          toHubSpotObjectId: hubspotProduct.id,
          associationTypeId: associationDefinition.results[0].typeId
        }
      }
    });

    if (!existingMapping) {
      await prisma.associationMapping.create({
        data: {
          nativeAssociationId: supplierProductAssociation.id,
          nativeObjectId: supplier.id,
          toNativeObjectId: product.id,
          fromObjectType: 'Supplier',
          toObjectType: 'Product',
          nativeAssociationLabel: 'supplier_product',
          hubSpotAssociationLabel: 'company_to_company',
          fromHubSpotObjectId: hubspotSupplier.id,
          toHubSpotObjectId: hubspotProduct.id,
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

  console.log('✨ Manufacturing data seed completed successfully!')
}
