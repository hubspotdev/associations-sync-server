import { PrismaClient, AssociationCategory, Cardinality } from '@prisma/client'
import {
  AssociationSpecAssociationCategoryEnum,
} from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';
import { Client } from '@hubspot/api-client';

export async function seedHealthcareData(prisma: PrismaClient, hubspotClient:Client) {
  console.log('🚀 Starting healthcare data seed...')

  // Create AssociationDefinitions in Prisma
  const doctorPatientAssoc = await prisma.associationDefinition.create({
    data: {
      fromObjectType: 'Doctor',
      toObjectType: 'Patient',
      associationLabel: 'doctor_patient',
      name: 'Doctor to Patient',
      inverseLabel: 'patient_doctor',
      customerId: 'HEALTHCARE_1',
      cardinality: Cardinality.ONE_TO_MANY,
      associationCategory: AssociationCategory.USER_DEFINED
    }
  })
  console.log('✅ Created doctor-patient association definition in Prisma')

  const hospitalDepartmentAssoc = await prisma.associationDefinition.create({
    data: {
      fromObjectType: 'Hospital',
      toObjectType: 'Department',
      associationLabel: 'hospital_department',
      name: 'Hospital to Department',
      inverseLabel: 'department_hospital',
      customerId: 'HEALTHCARE_1',
      cardinality: Cardinality.ONE_TO_MANY,
      associationCategory: AssociationCategory.USER_DEFINED
    }
  })
  console.log('✅ Created hospital-department association definition in Prisma')

  // Create hospital in both systems
  const hospital = await prisma.company.create({
    data: {
      createdate: new Date(),
      domain: 'mercyhospital.org',
      name: 'Mercy General Hospital',
      archived: false
    }
  })
  console.log('✅ Created hospital in Prisma:', hospital.name)

  const hubspotHospital = await hubspotClient.crm.companies.basicApi.create({
    properties: {
      name: 'Mercy General Hospital',
      domain: 'mercyhospital.org',
    }
  })
  console.log('✅ Created hospital in HubSpot:', hubspotHospital.properties.name)

  // Create department in both systems
  const department = await prisma.company.create({
    data: {
      createdate: new Date(),
      domain: 'mercyhospital.org',
      name: 'Cardiology Department',
      archived: false
    }
  })
  console.log('✅ Created department in Prisma:', department.name)

  const hubspotDepartment = await hubspotClient.crm.companies.basicApi.create({
    properties: {
      name: 'Cardiology Department',
      domain: 'mercyhospital.org',
    }
  })
  console.log('✅ Created department in HubSpot:', hubspotDepartment.properties.name)

  // Create doctor in both systems
  const doctor = await prisma.contact.create({
    data: {
      createdate: new Date(),
      email: 'dr.smith@mercyhospital.org',
      firstname: 'John',
      lastname: 'Smith',
      lastmodifieddate: new Date(),
      archived: false
    }
  })
  console.log('✅ Created doctor in Prisma:', `${doctor.firstname} ${doctor.lastname}`)

  const hubspotDoctor = await hubspotClient.crm.contacts.basicApi.create({
    properties: {
      email: 'dr.smith@mercyhospital.org',
      firstname: 'John',
      lastname: 'Smith',
    }
  })
  console.log('✅ Created doctor in HubSpot:', `${hubspotDoctor.properties.firstname} ${hubspotDoctor.properties.lastname}`)

  // Create patient in both systems
  const patient = await prisma.contact.create({
    data: {
      createdate: new Date(),
      email: 'jane.doe@email.com',
      firstname: 'Jane',
      lastname: 'Doe',
      lastmodifieddate: new Date(),
      archived: false
    }
  })
  console.log('✅ Created patient in Prisma:', `${patient.firstname} ${patient.lastname}`)

  const hubspotPatient = await hubspotClient.crm.contacts.basicApi.create({
    properties: {
      email: 'jane.doe@email.com',
      firstname: 'Jane',
      lastname: 'Doe',
    }
  })
  console.log('✅ Created patient in HubSpot:', `${hubspotPatient.properties.firstname} ${hubspotPatient.properties.lastname}`)

  // Create association definitions in HubSpot
  const hospitalDeptDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
    'companies',
    'companies',
    {
      label: 'Hospital to Department',
      name: 'hospital_to_department'
    }
  )
  console.log('✅ Created hospital-department association definition in HubSpot with typeId:', hospitalDeptDefinition.results[0].typeId)

  const doctorPatientDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
    'contacts',
    'contacts',
    {
      label: 'Doctor to Patient',
      name: 'doctor_to_patient'
    }
  )
  console.log('✅ Created doctor-patient association definition in HubSpot with typeId:', doctorPatientDefinition.results[0].typeId)

  // Update Prisma association definitions with HubSpot typeIds
  await prisma.associationDefinition.update({
    where: { id: hospitalDepartmentAssoc.id },
    data: {
      associationTypeId: hospitalDeptDefinition.results[0].typeId
    }
  })
  await prisma.associationDefinition.update({
    where: { id: doctorPatientAssoc.id },
    data: {
      associationTypeId: doctorPatientDefinition.results[0].typeId
    }
  })
  console.log('✅ Updated Prisma association definitions with HubSpot typeIds')

  // Create HubSpot associations
  await hubspotClient.crm.associations.v4.basicApi.create(
    'companies',
    hubspotHospital.id,
    'companies',
    hubspotDepartment.id,
    [{
      associationCategory: AssociationSpecAssociationCategoryEnum.UserDefined,
      associationTypeId: hospitalDeptDefinition.results[0].typeId
    }]
  )
  console.log('✅ Created association in HubSpot between hospital and department')

  await hubspotClient.crm.associations.v4.basicApi.create(
    'contacts',
    hubspotDoctor.id,
    'contacts',
    hubspotPatient.id,
    [{
      associationCategory: AssociationSpecAssociationCategoryEnum.UserDefined,
      associationTypeId: doctorPatientDefinition.results[0].typeId
    }]
  )
  console.log('✅ Created association in HubSpot between doctor and patient')

  // Create Prisma associations
  const hospitalDeptAssociation = await prisma.association.create({
    data: {
      objectType: 'Hospital',
      objectId: hospital.id,
      toObjectType: 'Department',
      toObjectId: department.id,
      associationLabel: 'hospital_department',
      associationTypeId: hospitalDeptDefinition.results[0].typeId,
      customerId: '1',
      cardinality: Cardinality.ONE_TO_MANY,
      associationCategory: AssociationCategory.USER_DEFINED
    }
  })
  console.log('✅ Created association in Prisma between hospital and department')

  const doctorPatientAssociation = await prisma.association.create({
    data: {
      objectType: 'Doctor',
      objectId: doctor.id,
      toObjectType: 'Patient',
      toObjectId: patient.id,
      associationLabel: 'doctor_patient',
      associationTypeId: doctorPatientDefinition.results[0].typeId,
      customerId: '1',
      cardinality: Cardinality.ONE_TO_MANY,
      associationCategory: AssociationCategory.USER_DEFINED
    }
  })
  console.log('✅ Created association in Prisma between doctor and patient')

  // Create AssociationMappings
  await prisma.associationMapping.create({
    data: {
      nativeAssociationId: hospitalDeptAssociation.id,
      nativeObjectId: hospital.id,
      toNativeObjectId: department.id,
      fromObjectType: 'Hospital',
      toObjectType: 'Department',
      nativeAssociationLabel: 'hospital_department',
      hubSpotAssociationLabel: 'company_to_company',
      fromHubSpotObjectId: hubspotHospital.id,
      toHubSpotObjectId: hubspotDepartment.id,
      customerId: '1',
      associationTypeId: hospitalDeptDefinition.results[0].typeId,
      associationCategory: AssociationCategory.USER_DEFINED,
      cardinality: Cardinality.ONE_TO_MANY
    }
  })
  console.log('✅ Created association mapping for hospital-department relationship')

  await prisma.associationMapping.create({
    data: {
      nativeAssociationId: doctorPatientAssociation.id,
      nativeObjectId: doctor.id,
      toNativeObjectId: patient.id,
      fromObjectType: 'Doctor',
      toObjectType: 'Patient',
      nativeAssociationLabel: 'doctor_patient',
      hubSpotAssociationLabel: 'contact_to_contact',
      fromHubSpotObjectId: hubspotDoctor.id,
      toHubSpotObjectId: hubspotPatient.id,
      customerId: '1',
      associationTypeId: doctorPatientDefinition.results[0].typeId,
      associationCategory: AssociationCategory.USER_DEFINED,
      cardinality: Cardinality.ONE_TO_MANY
    }
  })
  console.log('✅ Created association mapping for doctor-patient relationship')

  console.log('✨ Healthcare data seed completed successfully!')
}
