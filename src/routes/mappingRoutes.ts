import express, { Request, Response } from 'express';
import {
  getSingleDBAssociationMappingFromId,
  getAllDBMappings,
} from '../prisma-client/mappedAssociations';
<<<<<<< HEAD
import {
  saveSingleHubspotAssociation,
  archiveSingleHubspotAssociation,
} from '../hubspot-client/singleAssociations';
import {
  // archiveBatchHubspotAssociation,
  saveBatchHubspotAssociation,
} from '../hubspot-client/batchAssociations';
=======
>>>>>>> testing-chatGPT-extension
import handleError from '../utils/error';
import { createMapping, createBatchMappings, deleteBatchMappings } from '../services/mappingService';

const router = express.Router();

router.post('/', async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Request body is required',
    });
  }

  try {
    const result = await createMapping(req.body);

    return res.status(201).json({
      success: true,
      data: result.dbResponse,
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to save association mapping');
    return res.status(500).json({
      success: false,
      data: `Failed to save association mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

router.post('/batch', async (req: Request, res: Response) => {
  try {
    const result = await createBatchMappings(req.body);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    handleError(error, 'There was an issue while saving association mappings');

    if (error instanceof Error && error.message.includes('Invalid request')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      data: 'Error saving mapping',
    });
  }
});

router.delete('/batch', async (req: Request, res: Response) => {
  const { mappingIds } = req.body;

  if (!Array.isArray(mappingIds) || mappingIds.length === 0) {
    return res.status(400).json({
      success: false,
      data: 'Invalid or empty mappingIds array',
    });
  }

  try {
    const response = await deleteBatchMappings(mappingIds);

    if (response) {
      // Code below will delete the associations in HubSpot
      // await archiveBatchHubspotAssociation(associationMappings);
      return res.json({
        success: true,
        data: {
          deletedCount: response.deletedCount,
          deletedRecords: response.deletedRecords,
        },
      });
    }

    return res.status(404).json({
      success: false,
      data: 'No mappings were deleted',
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to delete mappings');
    return res.status(500).json({
      success: false,
      data: `Failed to delete mappings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

router.get('/basic/:mappingId', async (req: Request, res: Response) => {
  try {
    const { mappingId } = req.params;

    if (!mappingId) {
      return res.status(400).json({
        success: false,
        data: 'Missing mappingId parameter',
      });
    }

    const associationMapping = await getSingleDBAssociationMappingFromId(mappingId);

    if (!associationMapping) {
      return res.status(404).json({
        success: false,
        data: 'Mapping not found',
      });
    }

    return res.json({
      success: true,
      data: associationMapping,
    });
  } catch (error: unknown) {
    handleError(error, 'Error getting association mapping');
    return res.status(500).json({
      success: false,
      data: `Error retrieving mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

router.get('/all', async (req: Request, res: Response) => {
  try {
    const mappings = await getAllDBMappings();
    return res.json({
      success: true,
      data: mappings,
    });
  } catch (error: unknown) {
    handleError(error, 'Error getting all association mappings');
    return res.status(500).json({
      success: false,
      data: `Error fetching mappings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

export default router;
