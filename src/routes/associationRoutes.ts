import express, { Request, Response } from 'express';
import {
  saveDBAssociation,
  getSingleDBAssociationById,
  deleteDBAssociation,
} from '../prisma-client/singleAssociations';
import handleError from '../utils/error';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AssociationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Association'
 *     Association:
 *       type: object
 *       required:
 *         - objectType
 *         - objectId
 *         - toObjectType
 *         - toObjectId
 *         - associationLabel
 *         - associationTypeId
 *         - associationCategory
 *         - customerId
 *         - cardinality
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated CUID identifier for the association
 *           example: "clh1234abcdef"
 *         objectType:
 *           type: string
 *           description: The type of the source object (e.g., contact, company, deal)
 *           example: "contact"
 *         objectId:
 *           type: string
 *           description: Unique identifier of the source object
 *           example: "123456"
 *         toObjectType:
 *           type: string
 *           description: The type of the target object (e.g., contact, company, deal)
 *           example: "company"
 *         toObjectId:
 *           type: string
 *           description: Unique identifier of the target object
 *           example: "789012"
 *         associationLabel:
 *           type: string
 *           description: Human-readable name for the association type
 *           example: "Primary Contact"
 *         associationTypeId:
 *           type: integer
 *           description: Unique identifier for the association type
 *           example: 1
 *         associationCategory:
 *           type: string
 *           description: Indicates who defined the association type
 *           enum: [HUBSPOT_DEFINED, INTEGRATOR_DEFINED, USER_DEFINED]
 *           example: "USER_DEFINED"
 *         customerId:
 *           type: string
 *           description: Unique identifier of the customer who owns this association
 *           example: "cust_123"
 *         cardinality:
 *           type: string
 *           description: Defines the relationship multiplicity between associated objects
 *           enum: [ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY]
 *           example: "ONE_TO_MANY"
 */

/**
 * @swagger
 * /api/associations/{associationId}:
 *   get:
 *     summary: Get a single association by ID
 *     tags: [Associations]
 *     parameters:
 *       - in: path
 *         name: associationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The association ID
 *     responses:
 *       '200':
 *         description: Successfully retrieved association
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Association'
 *       '404':
 *         description: Association not found
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
 *                   example: "Association not found"
 *       '500':
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
 *                   example: "There was an issue getting the association: Record not found in database"
 */
router.get('/:associationId', async (req: Request, res: Response) => {
  try {
    const association = await getSingleDBAssociationById(req.params.associationId);
    if (!association) {
      return res.status(404).json({
        success: false,
        data: 'Association not found',
      });
    }
    return res.json({
      success: true,
      data: association,
    });
  } catch (error: unknown) {
    handleError(error, 'Error getting association');
    return res.status(500).json({
      success: false,
      data: `There was an issue getting the association: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

/**
 * @swagger
 * /api/associations/{associationId}:
 *   delete:
 *     summary: Delete an association by ID
 *     tags: [Associations]
 *     parameters:
 *       - in: path
 *         name: associationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The association ID to delete
 *     responses:
 *       200:
 *         description: Association deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Association'
 *       404:
 *         description: Association not found
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
 *                   example: "Association not found"
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
 *                   example: "Failed to delete association: Database connection error"
 */
router.delete('/:associationId', async (req: Request, res: Response) => {
  const { associationId } = req.params;
  try {
    const result = await deleteDBAssociation(associationId);
    if (result === undefined) {
      return res.status(404).json({
        success: false,
        data: 'Association not found',
      });
    }
    return res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to delete association');
    return res.status(500).json({
      success: false,
      data: `Failed to delete association: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

/**
 * @swagger
 * /api/associations:
 *   post:
 *     summary: Create a new association
 *     tags: [Associations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - objectType
 *               - objectId
 *               - toObjectType
 *               - toObjectId
 *               - associationLabel
 *               - associationTypeId
 *               - associationCategory
 *               - customerId
 *               - cardinality
 *             properties:
 *               objectType:
 *                 type: string
 *                 description: The type of the source object (e.g., contact, company, deal)
 *                 example: "contact"
 *               objectId:
 *                 type: string
 *                 description: ID of the source object
 *                 example: "123456"
 *               toObjectType:
 *                 type: string
 *                 description: The type of the target object (e.g., contact, company, deal)
 *                 example: "company"
 *               toObjectId:
 *                 type: string
 *                 description: ID of the target object
 *                 example: "789012"
 *               associationLabel:
 *                 type: string
 *                 description: Human-readable name for the association type
 *                 example: "Primary Contact"
 *               associationTypeId:
 *                 type: integer
 *                 description: Type of association
 *                 example: 1
 *               associationCategory:
 *                 type: string
 *                 enum: [HUBSPOT_DEFINED, INTEGRATOR_DEFINED, USER_DEFINED]
 *                 description: Indicates who defined the association type
 *                 example: "USER_DEFINED"
 *               customerId:
 *                 type: string
 *                 description: Unique identifier of the customer who owns this association
 *                 example: "cust_123"
 *               cardinality:
 *                 type: string
 *                 enum: [ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY]
 *                 description: Defines the relationship multiplicity between associated objects
 *                 example: "ONE_TO_MANY"
 *     responses:
 *       200:
 *         description: Association created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Association'
 *       400:
 *         description: Invalid request body
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
 *                   example: "Failed to save association: Invalid input data"
 */
router.post('/', async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      data: 'Request body is required',
    });
  }

  try {
    const prismaResponse = await saveDBAssociation(req.body);

    if (!prismaResponse || !prismaResponse.id) {
      return res.status(500).json({
        success: false,
        data: 'Association creation failed - no data returned',
      });
    }

    return res.json({
      success: true,
      data: prismaResponse,
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to save association');
    return res.status(500).json({
      success: false,
      data: `Failed to save association: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

export default router;
