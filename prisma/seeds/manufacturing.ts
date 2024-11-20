import { PrismaClient, AssociationCategory, Cardinality } from '@prisma/client'
import { Client } from "@hubspot/api-client"
import {
  AssociationSpecAssociationCategoryEnum,
} from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';

export async function seedManufacturingData(prisma: PrismaClient) {
  const hubspotClient = new Client({ accessToken: process.env.ACCESS_TOKEN })
  console.log('🚀 Starting manufacturing data seed...')

  // Create AssociationDefinitions in Prisma first (without associationTypeId)
  const supplierProductAssoc = await prisma.associationDefinition.create({
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

  // Create supplier in both systems
  const supplier = await prisma.company.create({
    data: {
      createdate: new Date(),
      domain: 'acmesupplies.com',
      name: 'Acme Industrial Supplies',
      archived: false
    }
  })
  console.log('✅ Created supplier in Prisma:', supplier.name)

  const hubspotSupplier = await hubspotClient.crm.companies.basicApi.create({
    properties: {
      name: 'Acme Industrial Supplies',
      domain: 'acmesupplies.com',
    }
  })
  console.log('✅ Created supplier in HubSpot:', hubspotSupplier.properties.name)

  // Create product in both systems
  const product = await prisma.company.create({
    data: {
      createdate: new Date(),
      domain: 'techmanufacturing.com',
      name: 'Circuit Board X1000',
      archived: false
    }
  })
  console.log('✅ Created product in Prisma:', product.name)

  const hubspotProduct = await hubspotClient.crm.companies.basicApi.create({
    properties: {
      name: 'Circuit Board X1000',
      domain: 'techmanufacturing.com',
    }
  })
  console.log('✅ Created product in HubSpot:', hubspotProduct.properties.name)

  // Create HubSpot association definition and get typeId
  const associationDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
    'companies',
    'companies',
    {
      label: 'Supplier to Buyer',
      name: 'supplier_buyer',
      inverseLabel:'Buyer to Supplier'
    }
  )
  console.log('✅ Created association definition in HubSpot with typeId:', associationDefinition.results[0].typeId)

  // Update Prisma association definition with HubSpot typeId
  await prisma.associationDefinition.update({
    where: { id: supplierProductAssoc.id },
    data: {
      associationTypeId: associationDefinition.results[0].typeId
    }
  })
  console.log('✅ Updated Prisma association definition with HubSpot typeId')

  // Create HubSpot association (using the returned typeId)
  await hubspotClient.crm.associations.v4.basicApi.create(
    'companies',
    hubspotSupplier.id,
    'companies',
    hubspotProduct.id,
    [{
      associationCategory: AssociationSpecAssociationCategoryEnum.UserDefined,
      associationTypeId: associationDefinition.results[0].typeId
    }]
  )
  console.log('✅ Created association in HubSpot between supplier and product')

  // Create Prisma association (using the returned typeId)
  const supplierProductAssociation = await prisma.association.create({
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
  })
  console.log('✅ Created association in Prisma between supplier and product')

  // Create AssociationMapping (using the returned typeId)
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
  })
  console.log('✅ Created association mapping between Prisma and HubSpot')

  console.log('✨ Manufacturing data seed completed successfully!')
}
