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
    const associationData = req.body;
    const [hubspotResponse, dbResponse] = await Promise.all([
      saveSingleHubspotAssociation(associationData),
      saveDBMapping(associationData),
    ]);

    if (hubspotResponse === undefined || dbResponse === undefined) {
      throw new Error('Failed to save association');
    }

    return res.status(201).json({
      success: true,
      hubspot: hubspotResponse,
      database: dbResponse,
    });
  } catch (error:unknown) {
    handleError(error, 'There was an issue while saving association mapping');
    return res.status(500).json({
      error: 'Error saving mapping',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const mappings = req.body;
    console.log('mappings', mappings);
    // Basic validation
    if (!Array.isArray(mappings) || mappings.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: mappings must be a non-empty array',
      });
    }
    const dbResponse = await saveBatchDBMapping(req.body);
    const hubspotResponse = await saveBatchHubspotAssociation(req.body);

    return res.status(201).json({
      success: true,
      hubspot: hubspotResponse,
      database: dbResponse,
    });
  } catch (error:unknown) {
    handleError(error, 'There was an issue while saving association mappings');
    return res.status(500).send('Error saving mapping');
  }
});

router.delete('/batch', async (req: Request, res: Response) => {
  try {
    const mappingsToDelete = req.body.mappingIds;
    if (!Array.isArray(mappingsToDelete) || mappingsToDelete.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty mappingIds array' });
    }

    const associationMappings = await getBatchDBAssociationMappings(mappingsToDelete);
    const response = await deleteBatchDBMappings(mappingsToDelete);
    if (response) {
      await archiveBatchHubspotAssociation(associationMappings);
      return res.json({ success: true, deletedCount: mappingsToDelete.length });
    }

    return res.status(404).json({ error: 'No mappings were deleted' });
  } catch (error:unknown) {
    handleError(error, 'There was an issue while attempting to delete the mappings');
    return res.status(500).json({
      error: 'Failed to delete mappings',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/basic/:mappingId', async (req: Request, res: Response) => {
  try {
    const { mappingId } = req.params;
    if (!mappingId) {
      return res.status(400).json({ error: 'Missing mappingId parameter' });
    }

    const [associationMapping, deleteResponse] = await Promise.all([
      getSingleDBAssociationMappingFromId(mappingId),
      deleteDBMapping(mappingId),
    ]);

    if (!deleteResponse) {
      return res.status(404).json({ error: 'Mapping not found' });
    }

    if (associationMapping) {
      await archiveSingleHubspotAssociation(associationMapping);
    }

    return res.json({ success: true, deletedId: mappingId });
  } catch (error:unknown) {
    handleError(error, 'There was an issue while attempting to delete the mapping');
    return res.status(500).json({
      error: 'Failed to delete mapping',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/basic/:mappingId', async (req: Request, res: Response) => {
  try {
    const { mappingId } = req.params;

    if (!mappingId) {
      return res.status(400).json({
        error: 'Missing mappingId parameter',
      });
    }

    const associationMapping = await getSingleDBAssociationMappingFromId(mappingId);

    if (!associationMapping) {
      return res.status(404).json({
        error: 'Mapping not found',
      });
    }

    return res.json(associationMapping);
  } catch (error:unknown) {
    handleError(error, 'Error getting association mapping');
    return res.status(500).json({
      error: 'Error retrieving mapping',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const mappings = await getAllDBMappings();
    res.send(mappings);
  } catch (error:unknown) {
    handleError(error, 'Error getting all association mappings');
    res.status(500).send('Error fetching mappings');
  }
});

export default router;
