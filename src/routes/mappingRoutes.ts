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

/**
 * @swagger
 * components:
 *   schemas:
 *     AssociationMapping:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         nativeAssociationId:
 *           type: string
 *         nativeObjectId:
 *           type: string
 *         toNativeObjectId:
 *           type: string
 *         fromObjectType:
 *           type: string
 *         toObjectType:
 *           type: string
 *         nativeAssociationLabel:
 *           type: string
 *         hubSpotAssociationLabel:
 *           type: string
 *         fromHubSpotObjectId:
 *           type: string
 *         toHubSpotObjectId:
 *           type: string
 *         customerId:
 *           type: string
 *         associationTypeId:
 *           type: integer
 *         associationCategory:
 *           type: string
 *           enum: [HUBSPOT_DEFINED, INTEGRATOR_DEFINED, USER_DEFINED]
 *         cardinality:
 *           type: string
 *           enum: [ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY]
 *     MappingResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           $ref: '#/components/schemas/AssociationMapping'
 *     BatchDeleteResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         deletedCount:
 *           type: number
 *           example: 5
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         data:
 *           type: string
 *           example: "Error saving mapping"
 */

/**
 * @swagger
 * /api/associations/mappings:
 *   post:
 *     summary: Create single association mapping
 *     tags: [Mappings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssociationMapping'
 *     responses:
 *       201:
 *         description: Successfully created mapping
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/AssociationMapping'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: string
 *                   example: "Request body is required"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: string
 *                   example: "Failed to save association mapping: Database error"
 */
router.post('/', async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Request body is required',
    });
  }

  try {
    const associationData = req.body;
    const [hubspotResponse, dbResponse] = await Promise.all([
      saveSingleHubspotAssociation(associationData),
      saveDBMapping(associationData),
    ]);

    if (hubspotResponse === undefined || !dbResponse) {
      throw new Error('Failed to save association');
    }

    return res.status(201).json({
      success: true,
      data: dbResponse,
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to save association mapping');
    return res.status(500).json({
      success: false,
      data: `Failed to save association mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

/**
 * @swagger
 * /api/associations/mappings/batch:
 *   post:
 *     summary: Create batch association mappings
 *     tags: [Mappings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/AssociationMapping'
 *     responses:
 *       201:
 *         description: Successfully created mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     hubspotResponse:
 *                       type: object
 *                     dbResponse:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AssociationMapping'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: string
 *                   example: "Invalid request: mappings must be a non-empty array"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: string
 *                   example: "Error saving mapping"
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const mappings = req.body;
    console.log('mappings', mappings);
    if (!Array.isArray(mappings) || mappings.length === 0) {
      return res.status(400).json({
        error: 'Invalid request: mappings must be a non-empty array',
      });
    }
    const dbResponse = await saveBatchDBMapping(req.body);
    const hubspotResponse = await saveBatchHubspotAssociation(req.body);

    return res.status(201).json({
      success: true,
      data: { hubspotResponse, dbResponse },
    });
  } catch (error:unknown) {
    handleError(error, 'There was an issue while saving association mappings');
    return res.status(500).send({ success: false, data: 'Error saving mapping' });
  }
});

/**
 * @swagger
 * /api/associations/mappings/batch:
 *   delete:
 *     summary: Delete multiple mappings
 *     tags: [Mappings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mappingIds
 *             properties:
 *               mappingIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Successfully deleted mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: number
 *                       example: 5
 *                     deletedRecords:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/AssociationMapping'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: string
 *                   example: "Invalid or empty mappingIds array"
 *       404:
 *         description: No mappings found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: string
 *                   example: "No mappings were deleted"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: string
 *                   example: "Failed to delete mappings: Database error"
 */
router.delete('/batch', async (req: Request, res: Response) => {
  const { mappingIds } = req.body;

  if (!Array.isArray(mappingIds) || mappingIds.length === 0) {
    return res.status(400).json({
      success: false,
      data: 'Invalid or empty mappingIds array',
    });
  }

  try {
    const associationMappings = await getBatchDBAssociationMappings(mappingIds);
    const response = await deleteBatchDBMappings(mappingIds);

    if (response) {
      await archiveBatchHubspotAssociation(associationMappings);
      return res.json({
        success: true,
        data: {
          deletedCount: mappingIds.length,
          deletedRecords: associationMappings,
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

/**
 * @swagger
 * /api/associations/mappings/basic/{mappingId}:
 *   delete:
 *     summary: Delete a single mapping
 *     tags: [Mappings]
 *     parameters:
 *       - in: path
 *         name: mappingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the mapping to delete
 *     responses:
 *       200:
 *         description: Successfully deleted mapping
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 deletedId:
 *                   type: string
 *                   example: "123"
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Mapping not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/basic/:mappingId', async (req: Request, res: Response) => {
  try {
    const { mappingId } = req.params;
    if (!mappingId) {
      return res.status(400).json({
        success: false,
        data: 'Missing mappingId parameter',
      });
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
      success: false,
      data: `Failed to delete mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

/**
 * @swagger
 * /api/associations/mappings/basic/{mappingId}:
 *   get:
 *     summary: Get a single mapping by ID
 *     tags: [Mappings]
 *     parameters:
 *       - in: path
 *         name: mappingId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the mapping to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved mapping
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssociationMapping'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Mapping not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
  } catch (error:unknown) {
    handleError(error, 'Error getting association mapping');
    return res.status(500).json({
      success: false,
      data: `Error retrieving mapping: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

/**
 * @swagger
 * /api/associations/mappings/all:
 *   get:
 *     summary: Get all mappings
 *     tags: [Mappings]
 *     responses:
 *       200:
 *         description: Successfully retrieved mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AssociationMapping'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 data:
 *                   type: string
 *                   example: "Error fetching mappings: Database error"
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const mappings = await getAllDBMappings();
    return res.json({
      success: true,
      data: mappings,
    });
  } catch (error:unknown) {
    handleError(error, 'Error getting all association mappings');
    return res.status(500).json({
      success: false,
      data: `Error fetching mappings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

export default router;
