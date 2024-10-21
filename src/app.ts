import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import shutdown from './utils/shutdown';
import {
  getAssociationsByCustomerId,
  getMappings,
  savePrismaMapping,
  deleteMapping,
  deleteBatchPrismaMappings,
  getSingleAssociationMappingFromId,
  saveBatchPrismaMapping,
  getBatchAssociationMappings,
  getSingleAssociationMapping,
} from './prisma-mappings';
import { saveAssociation, deleteAssociation } from './prisma-records';
import {
  saveSingleHubspotAssociation,
  saveBatchHubspotAssociation,
  archiveSingleHubspotAssociation,
  archiveBatchHubspotAssociation,
} from './hubspot-client';
import { authUrl, redeemCode } from './auth';
import { PORT, getCustomerId } from './utils/utils';
// import { AssociationMapping, Association } from "@prisma/client";
// import { AssociationMapping } from 'default'
import handleError from './utils/error';

const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/install', (req: Request, res: Response) => {
  res.redirect(authUrl);
});

app.get('/oauth-callback', async (req: Request, res: Response) => {
  const { code } = req.query;
  if (code) {
    try {
      const authInfo = await redeemCode(code.toString());
      if (authInfo) {
        const { accessToken } = authInfo;
        console.log('ACcess token ==', accessToken);
        res.send('Success!');
      }
    } catch (error) {
      console.log('oops');
    }
  }
});

app.get(
  '/api/native-associations-with-mappings',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const customerId = getCustomerId(); // Assuming function to extract the customer ID
      const associations = await getAssociationsByCustomerId(customerId);

      const associationIds = associations.map((association) => association.id);
      const mappings = await getMappings(associationIds);

      const responseData = associations.map((association) => ({
        association,
        mappings: mappings.filter((mapping) => mapping.id === association.id),
      }));

      console.log('Response from native-associations-with-mappings:', responseData);
      res.json(responseData);
    } catch (error) {
      handleError(error, 'There was an issue getting the native properties with mappings ');
      res.status(500).send('Internal Server Error');
    }
  },
);
// app.get("/api/hubspot-associations", async (req: Request, res: Response): Promise<void> => {
//   try {
//     const customerId: string = getCustomerId();
//     const properties = await getHubSpotAssociations(customerId);
//     res.send(properties);
//   } catch (error) {
//     handleError(error, 'There was an issue getting Hubspot properties ')
//     res.status(500).send('Internal Server Error');
//   }})

app.post('/api/association', async (req: Request, res: Response): Promise<void> => {
  try {
    const prismaResponse = await saveAssociation(req.body);
    console.log('succesfully saved association to Prisma', prismaResponse);
    res.send(prismaResponse);
  } catch (error) {
    handleError(error, 'There was an issue while saving association ');
    res.status(500).send('Error saving mapping');
  }
});

app.post('/api/association/mapping', async (req: Request, res: Response): Promise<void> => {
  try {
    const response = await saveSingleHubspotAssociation(req.body);
    console.log('successfully saved association to hubspot');
    const prismaResponse = await savePrismaMapping(req.body);
    console.log('succesfully saved mapping to Prisma', prismaResponse);
    res.send(response);
  } catch (error) {
    handleError(error, 'There was an issue while saving association mappings ');
    res.status(500).send('Error saving mapping');
  }
});

app.post('/api/association/mappings', async (req: Request, res: Response): Promise<void> => {
  try {
    const prismaResponse = await saveBatchPrismaMapping(req.body);
    console.log('succesfully saved mappings to Prisma', prismaResponse);
    const response = await saveBatchHubspotAssociation(req.body);
    res.send(response);
  } catch (error) {
    handleError(error, 'There was an issue while saving association mappings ');
    res.status(500).send('Error saving mapping');
  }
});

app.delete('/api/associations/mapping/:mappingId', async (req: Request, res: Response): Promise<void> => {
  const mappingToDelete = req.params.mappingId;
  console.log('in deleteMapping endpoint');
  if (!mappingToDelete) {
    res.status(400).send('Invalid mapping Id format');
  }
  try {
    const associationMapping = await getSingleAssociationMappingFromId(mappingToDelete);
    const deleteMappingResult = await deleteMapping(mappingToDelete);
    if (associationMapping) await archiveSingleHubspotAssociation(associationMapping);
    res.send(deleteMappingResult);
  } catch (error) {
    handleError(error, 'There was an issue while attempting to delete the mapping ');
  }
});

app.delete('/api/associations/:associationId', async (req: Request, res: Response): Promise<void> => {
  const { associationId } = req.params;
  if (!associationId) {
    res.status(400).send('Invalid request format');
  }
  try {
    deleteAssociation(associationId);
    const associationMapping = await getSingleAssociationMapping(associationId);
    if (associationMapping) {
      const deleteMappingResult = await deleteMapping(associationMapping.id);
      await archiveSingleHubspotAssociation(associationMapping);
      res.send(deleteMappingResult);
    }
  } catch (error) {
    handleError(error, 'There was an issue while attempting to delete the mapping ');
  }
});

app.delete('/api/associations/mappings', async (req: Request, res: Response): Promise<void> => {
  const mappingsToDelete = req.body;
  // const mappingId = parseInt(mappingsToDelete);
  if (!mappingsToDelete) {
    res.status(400).send('Invalid mapping Id format');
  }
  try {
    const associationMapping = await getBatchAssociationMappings(mappingsToDelete);
    const deleteMappingResult = await deleteBatchPrismaMappings(mappingsToDelete);
    if (associationMapping) await archiveBatchHubspotAssociation(associationMapping);
    res.send(deleteMappingResult);
  } catch (error) {
    handleError(error, 'There was an issue while attempting to delete the mapping ');
  }
});

const server = app.listen(PORT, () => {
  console.log(`App is listening on port ${PORT} !`);
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  shutdown();
});

export default server;
