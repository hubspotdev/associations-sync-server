import express, { Request, Response } from 'express';
import {
  saveDBAssociation,
  getSingleDBAssociationById,
  getAllDBAssociations,
} from '../prisma-client/singleAssociations';
import handleError from '../utils/error';
import { Association } from '../../types/common';
import deleteAssociationAndRelatedMappings from '../services/associationService';

interface AssociationRequest extends Request {
  body: Association;
}

const router = express.Router();

router.get('/all', async (_req: Request, res: Response) => {
  try {
    const associations = await getAllDBAssociations();

    return res.json({
      success: true,
      data: associations,
    });
  } catch (error: unknown) {
    handleError(error, 'Error getting all associations');
    return res.status(500).json({
      success: false,
      data: `There was an issue getting all associations: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

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

router.delete('/:associationId', async (req: Request, res: Response) => {
  const { associationId } = req.params;
  try {
    const result = await deleteAssociationAndRelatedMappings(associationId);

    if (!result.deletedAssociation) {
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
      data: `Failed to delete association ${associationId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

router.post('/', async (req: AssociationRequest, res: Response) => {
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
