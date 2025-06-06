import { PrismaClient, AssociationCategory, Cardinality } from '@prisma/client'
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '@hubspot/api-client/lib/codegen/crm/companies';
import Logger from '../../src/utils/logger';

export async function seedHealthcareData(prisma: PrismaClient, hubspotClient:Client) {
  Logger.info({
    type: 'Seed',
    context: 'Healthcare',
    logMessage: { message: 'Starting healthcare data seed...' }
  });

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
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Created doctor-patient association definition in Prisma' }
    });
  } else {
    doctorPatientAssoc = existingDoctorPatientDef;
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Doctor-patient association definition already exists in Prisma' }
    });
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
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Created hospital in Prisma:', data: { hospitalName: hospital.name } }
    });
  } else {
    hospital = existingHospital;
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Hospital already exists in Prisma:', data: { hospitalName: hospital.name } }
    });
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
      Logger.info({
        type: 'Seed',
        context: 'Healthcare',
        logMessage: { message: 'Hospital already exists in HubSpot:', data: { hospitalName: hubspotHospital.properties.name } }
      });
    } else {
      hubspotHospital = await hubspotClient.crm.companies.basicApi.create({
        properties: {
          name: 'Mercy General Hospital',
          domain: 'mercyhospital.org',
        }
      });
      Logger.info({
        type: 'Seed',
        context: 'Healthcare',
        logMessage: { message: 'Created hospital in HubSpot:', data: { hospitalName: hubspotHospital.properties.name } }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Healthcare - Hospital creation',
      logMessage: { message: error instanceof Error ? error.message : String(error) }
    });
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
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Created patient in Prisma:', data: { patientName: `${patient.firstname} ${patient.lastname}` } }
    });
  } else {
    patient = existingPatient;
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Patient already exists in Prisma:', data: { patientName: `${patient.firstname} ${patient.lastname}` } }
    });
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
      Logger.info({
        type: 'Seed',
        context: 'Healthcare',
        logMessage: { message: 'Patient already exists in HubSpot:', data: { patientName: `${hubspotPatient.properties.firstname} ${hubspotPatient.properties.lastname}` } }
      });
    } else {
      hubspotPatient = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          email: 'jane.doe@email.com',
          firstname: 'Jane',
          lastname: 'Doe',
        }
      });
      Logger.info({
        type: 'Seed',
        context: 'Healthcare',
        logMessage: { message: 'Created patient in HubSpot:', data: { patientName: `${hubspotPatient.properties.firstname} ${hubspotPatient.properties.lastname}` } }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Healthcare - Patient creation',
      logMessage: { message: error instanceof Error ? error.message : String(error) }
    });
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
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Created doctor in Prisma:', data: { doctorName: `${doctor.firstname} ${doctor.lastname}` } }
    });
  } else {
    doctor = existingDoctor;
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Doctor already exists in Prisma:', data: { doctorName: `${doctor.firstname} ${doctor.lastname}` } }
    });
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
      Logger.info({
        type: 'Seed',
        context: 'Healthcare',
        logMessage: { message: 'Doctor already exists in HubSpot:', data: { doctorName: `${hubspotDoctor.properties.firstname} ${hubspotDoctor.properties.lastname}` } }
      });
    } else {
      hubspotDoctor = await hubspotClient.crm.contacts.basicApi.create({
        properties: {
          email: 'dr.smith@mercyhospital.org',
          firstname: 'John',
          lastname: 'Smith',
        }
      });
      Logger.info({
        type: 'Seed',
        context: 'Healthcare',
        logMessage: { message: 'Created doctor in HubSpot:', data: { doctorName: `${hubspotDoctor.properties.firstname} ${hubspotDoctor.properties.lastname}` } }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Healthcare - Doctor creation',
      logMessage: { message: error instanceof Error ? error.message : String(error) }
    });
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
      Logger.info({
        type: 'Seed',
        context: 'Healthcare',
        logMessage: { message: 'Association definition already exists in HubSpot with typeId:', data: { typeId: existingDefinition.typeId } }
      });
    } else {
      doctorPatientDefinition = await hubspotClient.crm.associations.v4.schema.definitionsApi.create(
        'contacts',
        'contacts',
        {
          label: 'Doctor to Patient',
          name: 'doctor_to_patient'
        }
      );
      Logger.info({
        type: 'Seed',
        context: 'Healthcare',
        logMessage: { message: 'Created doctor-patient association definition in HubSpot with typeId:', data: { typeId: doctorPatientDefinition.results[0].typeId } }
      });
    }
  } catch (error) {
    Logger.error({
      type: 'Seed',
      context: 'Healthcare - Association definition creation',
      logMessage: { message: error instanceof Error ? error.message : String(error) }
    });
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
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Updated Prisma association definition with HubSpot typeId' }
    });
  } else {
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Association definition already exists with this typeId' }
    });
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
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Created association in Prisma between doctor and patient' }
    });
  } else {
    doctorPatientAssociation = existingAssociation;
    Logger.info({
      type: 'Seed',
      context: 'Healthcare',
      logMessage: { message: 'Association already exists in Prisma between doctor and patient' }
    });
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
      Logger.info({
        type: 'Seed',
        context: 'Healthcare',
        logMessage: { message: 'Created association mapping for doctor-patient relationship' }
      });
    } else {
      Logger.info({
        type: 'Seed',
        context: 'Healthcare',
        logMessage: { message: 'Association mapping already exists for doctor-patient relationship' }
      });
    }
  }

  Logger.info({
    type: 'Seed',
    context: 'Healthcare',
    logMessage: { message: 'Healthcare data seed completed successfully!' }
  });
}
