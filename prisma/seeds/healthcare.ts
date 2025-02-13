import { PrismaClient, AssociationCategory, Cardinality } from '@prisma/client'
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies';

export async function seedHealthcareData(prisma: PrismaClient, hubspotClient:Client) {
  console.log('🚀 Starting healthcare data seed...')

  // Check if AssociationDefinition already exists in Prisma
  let doctorPatientAssoc;
  const existingDoctorPatientDef = await prisma.associationDefinition.findFirst({
    where: {
      fromObjectType: 'Contact',
      toObjectType: 'Contact',
      associationLabel: 'doctor_patient',
      customerId: 'HEALTHCARE_1'
    }
  });

  if (!existingDoctorPatientDef) {
    doctorPatientAssoc = await prisma.associationDefinition.create({
      data: {
        fromObjectType: 'Contact',
        toObjectType: 'Contact',
        associationLabel: 'doctor_patient',
        name: 'Doctor to Patient',
        inverseLabel: 'patient_doctor',
        customerId: 'HEALTHCARE_1',
        cardinality: Cardinality.ONE_TO_MANY,
        associationCategory: AssociationCategory.USER_DEFINED
      }
    })
    console.log('✅ Created doctor-patient association definition in Prisma')
  } else {
    doctorPatientAssoc = existingDoctorPatientDef;
    console.log('ℹ️ Doctor-patient association definition already exists in Prisma')
  }

  // Check for existing hospital in Prisma
  let hospital;
  const existingHospital = await prisma.company.findFirst({
    where: {
      domain: 'mercyhospital.org'
    }
  });

  if (!existingHospital) {
    hospital = await prisma.company.create({
      data: {
        createdate: new Date(),
        domain: 'mercyhospital.org',
        name: 'Mercy General Hospital',
        archived: false
      }
    })
    console.log('✅ Created hospital in Prisma:', hospital.name)
  } else {
    hospital = existingHospital;
    console.log('ℹ️ Hospital already exists in Prisma:', hospital.name)
  }

  // Check for existing hospital in HubSpot
  let hubspotHospital;
  try {
    const searchResults = await hubspotClient.crm.companies.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'domain',
          operator: FilterOperatorEnum.Eq,
          value: 'mercyhospital.org'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotHospital = searchResults.results[0];
      console.log('ℹ️ Hospital already exists in HubSpot:', hubspotHospital.properties.name);
    } else {
      hubspotHospital = await hubspotClient.crm.companies.basicApi.create({
        properties: {
          name: 'Mercy General Hospital',
          domain: 'mercyhospital.org',
        }
      });
      console.log('✅ Created hospital in HubSpot:', hubspotHospital.properties.name)
    }
  } catch (error) {
    console.error('Error while checking/creating hospital in HubSpot:', error);
    throw error;
  }

  // Check for existing patient in Prisma
  let patient;
  const existingPatient = await prisma.contact.findFirst({
    where: {
      email: 'jane.doe@email.com'
    }
  });

  if (!existingPatient) {
    patient = await prisma.contact.create({
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
  } else {
    patient = existingPatient;
    console.log('ℹ️ Patient already exists in Prisma:', `${patient.firstname} ${patient.lastname}`)
  }

  // Check for existing patient in HubSpot
  let hubspotPatient;
  try {
    const searchResults = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: FilterOperatorEnum.Eq,
          value: 'jane.doe@email.com'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotPatient = searchResults.results[0];
      console.log('ℹ️ Patient already exists in HubSpot:', `${hubspotPatient.properties.firstname} ${hubspotPatient.properties.lastname}`);
    } else {
      hubspotPatient = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          email: 'jane.doe@email.com',
          firstname: 'Jane',
          lastname: 'Doe',
        }
      });
      console.log('✅ Created patient in HubSpot:', `${hubspotPatient.properties.firstname} ${hubspotPatient.properties.lastname}`);
    }
  } catch (error) {
    console.error('Error while checking/creating patient in HubSpot:', error);
    throw error;
  }
  // Check if doctor exists in Prisma
  let doctor;
  const existingDoctor = await prisma.contact.findFirst({
    where: {
      email: 'dr.smith@mercyhospital.org'
    }
  });

  if (!existingDoctor) {
    doctor = await prisma.contact.create({
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
  } else {
    doctor = existingDoctor;
    console.log('ℹ️ Doctor already exists in Prisma:', `${doctor.firstname} ${doctor.lastname}`)
  }

  // Check for existing doctor in HubSpot
  let hubspotDoctor;
  try {
    const searchResults = await hubspotClient.crm.contacts.searchApi.doSearch({
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: FilterOperatorEnum.Eq,
          value: 'dr.smith@mercyhospital.org'
        }]
      }]
    });

    if (searchResults.results.length > 0) {
      hubspotDoctor = searchResults.results[0];
      console.log('ℹ️ Doctor already exists in HubSpot:', `${hubspotDoctor.properties.firstname} ${hubspotDoctor.properties.lastname}`);
    } else {
      hubspotDoctor = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          email: 'dr.smith@mercyhospital.org',
          firstname: 'John',
          lastname: 'Smith',
        }
      });
      console.log('✅ Created doctor in HubSpot:', `${hubspotDoctor.properties.firstname} ${hubspotDoctor.properties.lastname}`)
    }
  } catch (error) {
    console.error('Error while checking/creating doctor in HubSpot:', error);
    throw error;
  }

  // Check for existing association definition in HubSpot
  let doctorPatientDefinition;
  try {
    const definitions = await hubspotClient.crm.associations.v4.schema.definitionsApi.getAll(
      'contacts',
      'contacts'
    );

    const existingDefinition = definitions.results.find(
      def => def.label === 'Doctor to Patient'
    );

    if (existingDefinition) {
      doctorPatientDefinition = { results: [existingDefinition] };
      console.log('ℹ️ Association definition already exists in HubSpot with typeId:', existingDefinition.typeId);
    } else {
      doctorPatientDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
        'contacts',
        'contacts',
        {
          label: 'Doctor to Patient',
          name: 'doctor_to_patient'
        }
      );
      console.log('✅ Created doctor-patient association definition in HubSpot with typeId:', doctorPatientDefinition.results[0].typeId)
    }
  } catch (error) {
    console.error('Error while checking/creating association definition in HubSpot:', error);
    throw error;
  }

  // Check and update Prisma association definition with HubSpot typeId
  const existingAssocDef = await prisma.associationDefinition.findFirst({
    where: {
      fromObjectType: 'Doctor',
      toObjectType: 'Patient',
      associationLabel: 'doctor_patient',
      associationTypeId: doctorPatientDefinition.results[0].typeId
    }
  });

  if (!existingAssocDef) {
    await prisma.associationDefinition.update({
      where: { id: doctorPatientAssoc.id },
      data: {
        associationTypeId: doctorPatientDefinition.results[0].typeId
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
        toObjectId: patient.id,
        objectId: doctor.id,
        associationLabel: 'doctor_patient',
        associationTypeId: doctorPatientDefinition.results[0].typeId
      }
    }
  });

  let doctorPatientAssociation;
  if (!existingAssociation) {
    doctorPatientAssociation = await prisma.association.create({
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
    });
    console.log('✅ Created association in Prisma between doctor and patient')
  } else {
    doctorPatientAssociation = existingAssociation;
    console.log('ℹ️ Association already exists in Prisma between doctor and patient')
  }

  // Create association mapping if association was created
  if (doctorPatientAssociation) {
    const existingMapping = await prisma.associationMapping.findUnique({
      where: {
        customerId_fromHubSpotObjectId_toHubSpotObjectId_associationTypeId: {
          customerId: '1',
          fromHubSpotObjectId: hubspotDoctor.id,
          toHubSpotObjectId: hubspotPatient.id,
          associationTypeId: doctorPatientDefinition.results[0].typeId
        }
      }
    });

    if (!existingMapping) {
      await prisma.associationMapping.create({
        data: {
          nativeAssociationId: doctorPatientAssociation.id,
          nativeObjectId: doctor.id,
          toNativeObjectId: patient.id,
          fromObjectType: 'Contact',
          toObjectType: 'Contact',
          nativeAssociationLabel: 'doctor_patient',
          hubSpotAssociationLabel: 'doctor_patient',
          fromHubSpotObjectId: hubspotDoctor.id,
          toHubSpotObjectId: hubspotPatient.id,
          customerId: '1',
          associationTypeId: doctorPatientDefinition.results[0].typeId,
          associationCategory: AssociationCategory.USER_DEFINED,
          cardinality: Cardinality.ONE_TO_MANY
        }
      });
      console.log('✅ Created association mapping for doctor-patient relationship')
    } else {
      console.log('ℹ️ Association mapping already exists for doctor-patient relationship')
    }
  }

  console.log('✨ Healthcare data seed completed successfully!')
}
