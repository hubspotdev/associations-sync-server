import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import { warn } from 'console';
import shutdown from './utils/shutdown';
import {
  // getAssociationsByCustomerId,
  // getMappings,
  saveDBMapping,
  deleteDBMapping,
  deleteBatchDBMappings,
  getSingleDBAssociationMappingFromId,
  saveBatchDBMapping,
  getBatchDBAssociationMappings,
  getSingleDBAssociationMapping,
} from './prisma-mappings';
import {
  getSingleDBAssociationById,
  deleteDBAssociation,
  deleteDBAssociationDefinition,
  saveDBAssociationDefinition,
  updateDBAssociationDefinition,
  saveDBAssociation,
  getDBAssociationDefinitionsByType,
} from './prisma-associations';
import {
  saveSingleHubspotAssociation,
  saveBatchHubspotAssociation,
  archiveSingleHubspotAssociation,
  archiveBatchHubspotAssociation,
  archiveAssociationDefinition,
  saveAssociationDefinition,
  updateAssociationDefinition,
  getAllAssociationDefinitions,
} from './hubspot-client';
import { authUrl, redeemCode } from './auth';
import { PORT, getCustomerId } from './utils/utils';
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

// app.get(
//   '/api/associations',
//   async (req: Request, res: Response): Promise<void> => {
//     try {
//       const customerId = getCustomerId();
//       const associations = await getAssociationsByCustomerId(customerId);

//       const associationIds = associations.map((association) => association.id);
//       const mappings = await getMappings(associationIds);

//       const responseData = associations.map((association) => ({
//         association,
//         mappings: mappings.filter((mapping) => mapping.id === association.id),
//       }));

//       console.log('Response', responseData);
//       res.json(responseData);
//     } catch (error) {
//       handleError(error, 'There was an issue getting the native properties with mappings ');
//       res.status(500).send('Internal Server Error');
//     }
//   },
// );

app.get(
  '/api/associations',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const associations = await getDBAssociationDefinitionsByType(req.body);
      const associationDefinitions = await getAllAssociationDefinitions(req.body);
      res.send(`All associations ${req.body.fromObject} to ${req.body.toObject}`);
      console.log(`All associations ${req.body.fromObject} to ${req.body.toObject}`, associationDefinitions, associations);
    } catch (error) {
      handleError(error, 'There was an issue getting the native properties with mappings ');
      res.status(500).send('Internal Server Error');
    }
  },
);

app.delete('/api/association/definitions/:associationId', async (req: Request, res: Response): Promise<void> => {
  try {
    await deleteDBAssociationDefinition(req.params.associationId);
    console.log('About to delete response from hubspot');
    const response = await archiveAssociationDefinition(req.body);
    console.log('Deleted response from hubspot', response);
    res.send(response);
  } catch (error) {
    handleError(error, 'There was an issue while archiving the association definition');
    res.status(500).send('Error archiving association definition');
  }
});

app.post('/api/associations/definition', async (req: Request, res: Response): Promise<void> => {
  try {
    const response = await saveAssociationDefinition(req.body);
    console.log('response after saving to hubspot', response);

    if (response) {
      const toTypeId = response.results[1].typeId;
      const fromTypeId = response.results[0].typeId;
      await saveDBAssociationDefinition({ ...req.body, toTypeId, fromTypeId });
      res.send(response);
    }
  } catch (error) {
    handleError(error, 'There was an issue while saving the association definition');
    res.status(500).send('Error saving association definition');
  }
});

app.put('/api/associations/definition/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await updateDBAssociationDefinition(req.body, req.params.id);
    console.log('after prisma update', req.body);
    const response = await updateAssociationDefinition(req.body);
    res.send(response);
  } catch (error) {
    handleError(error, 'There was an issue while updating the association definition');
    res.status(500).send('Error updating association definition');
  }
});

// app.delete('/api/associations/definition/:id', async (req: Request, res: Response): Promise<void> => {
//   try {
//     await deletePrismaAssociationDefinition(req.params.id);
//     const response = await archiveAssociationDefinition(req.body);
//     res.send(response);
//   } catch (error) {
//     handleError(error, 'There was an issue while updating the association definition');
//     res.status(500).send('Error updating association definition');
//   }
// });

// You can only save mappings, but you can update individual associations

app.post('/api/associations', async (req: Request, res: Response): Promise<void> => {
  try {
    const prismaResponse = await saveDBAssociation(req.body);
    console.log('succesfully saved association to Prisma', prismaResponse);
    if (prismaResponse) {
      try {
        const hubspotMapping = getSingleDBAssociationMapping(prismaResponse.id);
        if (!hubspotMapping) {
          warn('No corresponding HubSpot association');
          res.send(prismaResponse);
        } else {
          const hubspotResponse = saveSingleHubspotAssociation(req.body);
          console.log('succesfully saved association to HubSpot', hubspotResponse);
          res.send(hubspotResponse);
        }
      } catch (error) {
        handleError(error, 'There may not be a mapping for this association in HubSpot');
      }
    }
    throw Error('Something went wrong while saving this association');
  } catch (error) {
    handleError(error, 'There was an issue while saving association ');
    res.status(500).send('Error saving mapping');
  }
});

app.post('/api/associations/mapping', async (req: Request, res: Response): Promise<void> => {
  try {
    const response = await saveSingleHubspotAssociation(req.body);
    console.log('successfully saved association to hubspot');
    const prismaResponse = await saveDBMapping(req.body);
    console.log('succesfully saved mapping to Prisma', prismaResponse);
    res.send(response);
  } catch (error) {
    handleError(error, 'There was an issue while saving association mappings ');
    res.status(500).send('Error saving mapping');
  }
});

app.post('/api/associations/mappings', async (req: Request, res: Response): Promise<void> => {
  try {
    const prismaResponse = await saveBatchDBMapping(req.body);
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
  if (!mappingToDelete) {
    res.status(400).send('Invalid mapping Id format');
  }
  try {
    const associationMapping = await getSingleDBAssociationMappingFromId(mappingToDelete);
    const deleteMappingResult = await deleteDBMapping(mappingToDelete);
    if (associationMapping) await archiveSingleHubspotAssociation(associationMapping);
    res.send(deleteMappingResult);
  } catch (error) {
    handleError(error, 'There was an issue while attempting to delete the mapping ');
  }
});

app.get('/api/associations/mapping/:mappingId', async (req: Request, res: Response): Promise<void> => {
  const { mappingId } = req.params;
  if (!mappingId) {
    res.status(400).send('Invalid request format');
  }
  try {
    const associationMapping = await getSingleDBAssociationMapping(mappingId);
    res.send(associationMapping);
  } catch (error) {
    handleError(error, 'Error getting association');
  }
});

app.get('/api/associations/:associationId', async (req: Request, res: Response): Promise<void> => {
  const { associationId } = req.params;
  if (!associationId) {
    res.status(400).send('Invalid request format');
  }
  try {
    const associationMapping = await getSingleDBAssociationById(associationId);
    res.send(associationMapping);
  } catch (error) {
    handleError(error, 'Error getting association');
  }
});

app.delete('/api/associations/:associationId', async (req: Request, res: Response): Promise<void> => {
  const { associationId } = req.params;
  if (!associationId) {
    res.status(400).send('Invalid request format');
  }
  try {
    deleteDBAssociation(associationId);
    const associationMapping = await getSingleDBAssociationMapping(associationId);
    if (associationMapping) {
      const deleteMappingResult = await deleteDBMapping(associationMapping.id);
      await archiveSingleHubspotAssociation(associationMapping);
      res.send(deleteMappingResult);
    }
  } catch (error) {
    handleError(error, 'There was an issue while attempting to delete the mapping ');
  }
});

app.delete('/api/associations/mappings', async (req: Request, res: Response): Promise<void> => {
  const mappingsToDelete = req.body;
  if (!mappingsToDelete) {
    res.status(400).send('Invalid mapping Id format');
  }
  try {
    const associationMapping = await getBatchDBAssociationMappings(mappingsToDelete);
    const deleteMappingResult = await deleteBatchDBMappings(mappingsToDelete);
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
