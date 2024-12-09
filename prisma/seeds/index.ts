import { PrismaClient } from '@prisma/client'
import { seedEducationData } from './education'
import { seedHealthcareData } from './healthcare'
import { seedRealEstateData } from './real-estate'
import { seedManufacturingData } from './manufacturing'
import { seedPRMData } from './partnership'
import { hubspotClient, getAccessToken } from '../../src/auth'
import { getCustomerId } from '../../src/utils/utils';
import prisma from '../../src/prisma-client/prisma-initalization';

async function main() {
  const customerId = getCustomerId()
  console.log('getaccess token', getAccessToken)
  const accessToken = await getAccessToken(customerId);
  if(accessToken) hubspotClient.setAccessToken(accessToken)

  const seedType = process.env.SEED_TYPE || 'EDUCATION'

  console.log(`Seeding database and HubSpot with ${seedType} data...`)

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
      console.log('Invalid seed type specified')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

  // export default prisma
