import express, { Request, Response } from 'express';
import {
  saveBatchDBMapping,
  getBatchDBAssociationMappings,
  deleteBatchDBMappings,
} from '../prisma-client/batchAssociations';
import {
  saveDBMapping,
  deleteDBMapping,
  getSingleDBAssociationMappingFromId,
  getAllDBMappings,
} from '../prisma-client/mappedAssociations';
import {
  saveSingleHubspotAssociation,
  archiveSingleHubspotAssociation,
} from '../hubspot-client/singleAssociations';
import {
  archiveBatchHubspotAssociation,
  saveBatchHubspotAssociation,
} from '../hubspot-client/batchAssociations';
import handleError from '../utils/error';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await saveSingleHubspotAssociation(req.body);
    await saveDBMapping(req.body);
    res.send(response);
  } catch (error) {
    handleError(error, 'There was an issue while saving association mappings');
    res.status(500).send('Error saving mapping');
  }
});

router.post('/batch', async (req: Request, res: Response) => {
  try {
    await saveBatchDBMapping(req.body);
    const response = await saveBatchHubspotAssociation(req.body);
    res.send(response);
  } catch (error) {
    handleError(error, 'There was an issue while saving association mappings');
    res.status(500).send('Error saving mapping');
  }
});

router.delete('/batch', async (req: Request, res: Response) => {
  try {
    const mappingsToDelete = req.body.mappingIds;
    const associationMappings = await getBatchDBAssociationMappings(mappingsToDelete);
    const response = await deleteBatchDBMappings(mappingsToDelete);
    if (response) await archiveBatchHubspotAssociation(associationMappings);
    res.send(response);
  } catch (error) {
    handleError(error, 'There was an issue while attempting to delete the mappings');
  }
});

router.delete('/basic/:mappingId', async (req: Request, res: Response) => {
  console.log('in basic delete route');
  try {
    const associationMapping = await getSingleDBAssociationMappingFromId(req.params.mappingId);
    const response = await deleteDBMapping(req.params.mappingId);
    if (associationMapping) await archiveSingleHubspotAssociation(associationMapping);
    res.send(response);
  } catch (error) {
    handleError(error, 'There was an issue while attempting to delete the mapping');
  }
});

router.get('/basic/:mappingId', async (req: Request, res: Response) => {
  try {
    const associationMapping = await getSingleDBAssociationMappingFromId(req.params.mappingId);
    res.send(associationMapping);
  } catch (error) {
    handleError(error, 'Error getting association mapping');
  }
});

router.get('/all', async (req: Request, res: Response) => {
  console.log('in get all');
  try {
    const mappings = await getAllDBMappings();
    res.send(mappings);
  } catch (error) {
    handleError(error, 'Error getting all association mappings');
    res.status(500).send('Error fetching mappings');
  }
});

export default router;
