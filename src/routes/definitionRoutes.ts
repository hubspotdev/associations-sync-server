import express, { Request, Response } from 'express';
import {
  getDBAssociationDefinitionsByType,
  deleteDBAssociationDefinition,
  saveDBAssociationDefinition,
  updateDBAssociationDefinition,
} from '../prisma-client/definitionAssociations';
import {
  saveAssociationDefinition,
  updateAssociationDefinition,
  archiveAssociationDefinition,
  getAllAssociationDefinitionsByType,
} from '../hubspot-client/definitionAssociations';
import handleError from '../utils/error';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AssociationDefinition:
 *       type: object
 *       required:
 *         - fromObjectType
 *         - toObjectType
 *         - associationLabel
 *         - name
 *         - customerId
 *         - cardinality
 *         - associationCategory
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated CUID identifier for the association definition
 *           example: "clh7890abcdef"
 *         fromTypeId:
 *           type: integer
 *           description: HubSpot's internal ID for the source object type
 *           nullable: true
 *           example: 2
 *         toTypeId:
 *           type: integer
 *           description: HubSpot's internal ID for the target object type
 *           nullable: true
 *           example: 3
 *         fromObjectType:
 *           type: string
 *           description: The source object type in HubSpot (e.g., contact, company, deal)
 *           example: "contact"
 *         toObjectType:
 *           type: string
 *           description: The target object type in HubSpot (e.g., company, deal, ticket)
 *           example: "company"
 *         associationLabel:
 *           type: string
 *           description: Human-readable name for the association
 *           example: "Primary Company"
 *         name:
 *           type: string
 *           description: The label that describes the relationship from source to target
 *           example: "contact_to_company"
 *         inverseLabel:
 *           type: string
 *           description: Optional label for the reverse relationship (target to source)
 *           nullable: true
 *           example: "company_to_contact"
 *         associationTypeId:
 *           type: integer
 *           description: HubSpot's unique identifier for this association type
 *           nullable: true
 *           example: 1
 *         customerId:
 *           type: string
 *           description: Unique identifier for the customer/portal
 *           example: "cust_12345"
 *         cardinality:
 *           type: string
 *           description: Defines the relationship multiplicity between objects
 *           enum: [ONE_TO_ONE, ONE_TO_MANY, MANY_TO_ONE, MANY_TO_MANY]
 *           example: "ONE_TO_MANY"
 *         fromCardinality:
 *           type: integer
 *           description: Maximum number of associations allowed from the source object
 *           nullable: true
 *           example: 1
 *         toCardinality:
 *           type: integer
 *           description: Maximum number of associations allowed to the target object
 *           nullable: true
 *           example: 100
 *         associationCategory:
 *           type: string
 *           description: Indicates who defined the association type
 *           enum: [HUBSPOT_DEFINED, INTEGRATOR_DEFINED, USER_DEFINED]
 *           example: "USER_DEFINED"
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *     DefinitionsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             dbAssociations:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AssociationDefinition'
 *             hubspotAssociations:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AssociationDefinition'
 */

/**
 * @swagger
 * /api/associations/definitions/{fromObject}/{toObject}:
 *   get:
 *     summary: Get association definitions
 *     tags: [Definitions]
 *     parameters:
 *       - in: path
 *         name: fromObject
 *         required: true
 *         schema:
 *           type: string
 *         description: Source object type (e.g., 'contact', 'company')
 *       - in: path
 *         name: toObject
 *         required: true
 *         schema:
 *           type: string
 *         description: Target object type (e.g., 'deal', 'ticket')
 *     responses:
 *       200:
 *         description: Successfully retrieved definitions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DefinitionsResponse'
 *       400:
 *         description: Missing parameters
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
router.get('/', async (req: Request, res: Response) => res.status(404).json({
  success: false,
  data: 'Missing required parameters: fromObject and toObject',
}));

router.get('/:fromObject/:toObject', async (req: Request, res: Response) => {
  const { fromObject, toObject } = req.params;

  try {
    const [dbAssociations, hubspotAssociations] = await Promise.all([
      getDBAssociationDefinitionsByType({ fromObject, toObject }),
      getAllAssociationDefinitionsByType({ fromObject, toObject }),
    ]);

    return res.json({
      success: true,
      data: { dbAssociations, hubspotAssociations },
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to fetch association definitions');
    return res.status(500).json({
      success: false,
      data: `Failed to fetch association definitions: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

/**
 * @swagger
 * /api/associations/definitions/{associationId}:
 *   delete:
 *     summary: Delete association definition
 *     description: Delete an association definition from both database and HubSpot
 *     tags: [Definitions]
 *     parameters:
 *       - in: path
 *         name: associationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the association definition to delete
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssociationDefinition'
 *     responses:
 *       200:
 *         description: Successfully deleted definition
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
 *       400:
 *         description: Missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Association definition not found
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
 *                   example: "Association definition with id {associationId} not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/', async (req: Request, res: Response) => res.status(404).json({
  success: false,
  data: 'Missing required parameter: associationId',
}));

router.delete('/:associationId', async (req: Request, res: Response) => {
  const { associationId } = req.params;

  try {
    await deleteDBAssociationDefinition(associationId);
    const response = await archiveAssociationDefinition(req.body);
    return res.json({
      success: true,
      data: response,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return res.status(404).json({
        success: false,
        data: `Association definition with id ${associationId} not found`,
      });
    }

    handleError(error, 'Failed to archive association definition');
    return res.status(500).json({
      success: false,
      error: `Failed to archive association definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

/**
 * @swagger
 * /api/associations/definitions:
 *   post:
 *     summary: Create association definition
 *     description: Create a new association definition in both database and HubSpot
 *     tags: [Definitions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssociationDefinition'
 *     responses:
 *       200:
 *         description: Successfully created definition
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
 *       400:
 *         description: Missing or invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       422:
 *         description: Invalid response from HubSpot
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
router.post('/', async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      data: 'Request body is required',
    });
  }

  try {
    const response = await saveAssociationDefinition(req.body);
    if (!response?.results?.[0]?.typeId || !response?.results?.[1]?.typeId) {
      return res.status(422).json({
        success: false,
        data: 'Invalid response from Hubspot',
      });
    }

    const toTypeId = response.results[1].typeId;
    const fromTypeId = response.results[0].typeId;
    await saveDBAssociationDefinition({ ...req.body, toTypeId, fromTypeId });

    return res.json({
      success: true,
      data: response,
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to save association definition');
    return res.status(500).json({
      success: false,
      data: `Failed to save association definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

/**
 * @swagger
 * /api/associations/definitions/{id}:
 *   put:
 *     summary: Update association definition
 *     description: Update an existing association definition in both database and HubSpot
 *     tags: [Definitions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the association definition to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssociationDefinition'
 *     responses:
 *       200:
 *         description: Successfully updated definition
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
 *       400:
 *         description: Missing or invalid request body
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
router.put('/:id', async (req: Request, res: Response) => {
  try {
    await updateDBAssociationDefinition(req.body, req.params.id);
    const response = await updateAssociationDefinition(req.body);
    return res.json({
      success: true,
      data: response,
    });
  } catch (error: unknown) {
    handleError(error, 'There was an issue while updating the association definition');
    return res.status(500).json({
      success: false,
      data: `Error updating association definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

export default router;
