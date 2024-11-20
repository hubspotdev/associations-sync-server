import { PrismaClient } from '@prisma/client'
import { seedEducationData } from './education'
import { seedHealthcareData } from './healthcare'
import { seedRealEstateData } from './real-estate'
import { seedManufacturingData } from './manufacturing'

const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function main() {
  const seedType = process.env.SEED_TYPE || 'EDUCATION'

  console.log(`Seeding database and HubSpot with ${seedType} data...`)

  switch (seedType) {
    case 'EDUCATION':
      await seedEducationData(prisma)
      break
    case 'HEALTHCARE':
      await seedHealthcareData(prisma)
      break
    case 'REAL_ESTATE':
      await seedRealEstateData(prisma)
      break
    case 'MANUFACTURING':
      await seedManufacturingData(prisma)
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

  export default prisma
