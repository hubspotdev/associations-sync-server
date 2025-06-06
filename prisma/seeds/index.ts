import { seedEducationData } from './education'
import { seedHealthcareData } from './healthcare'
import { seedRealEstateData } from './real-estate'
import { seedManufacturingData } from './manufacturing'
import { seedPRMData } from './partnership'
import { hubspotClient, getHubSpotToken } from '../../src/auth'
import { getCustomerId } from '../../src/utils/utils';
import prisma from '../../src/prisma-client/prisma-initialization';
import Logger from '../../src/utils/logger';

async function main() {
  const customerId = getCustomerId()
  const accessToken = await getHubSpotToken(customerId);
  if(accessToken) hubspotClient.setAccessToken(accessToken)

  const seedType = process.env.INDUSTRY || 'EDUCATION'

  Logger.info({
    type: 'Seed',
    context: 'Initialization',
    logMessage: { message: `Seeding database and HubSpot with ${seedType} data...` }
  });

  switch (seedType) {
    case 'EDUCATION':
      await seedEducationData(prisma, hubspotClient)
      break
    case 'HEALTHCARE':
      await seedHealthcareData(prisma, hubspotClient)
      break
    case 'REAL_ESTATE':
      await seedRealEstateData(prisma, hubspotClient)
      break
    case 'MANUFACTURING':
      await seedManufacturingData(prisma, hubspotClient)
      break
    case 'PRM':
      await seedPRMData(prisma, hubspotClient)
      break
    default:
      Logger.warn({
        type: 'Seed',
        context: 'Initialization',
        logMessage: { message: 'Invalid seed type specified' }
      });
  }
}

main()
  .catch((e) => {
    Logger.error({
      type: 'Seed',
      context: 'Initialization',
      logMessage: e
    });
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
