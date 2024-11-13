import express, { Request, Response } from 'express';
import {
  saveDBAssociation,
  getSingleDBAssociationById,
  deleteDBAssociation,
} from '../prisma-client/singleAssociations';
import handleError from '../utils/error';

const router = express.Router();

router.get('/:associationId', async (req: Request, res: Response) => {
  try {
    const association = await getSingleDBAssociationById(req.params.associationId);
    res.send(association);
  } catch (error: unknown) {
    handleError(error, 'Error getting association');
  }
});

router.delete('/:associationId', async (req: Request, res: Response) => {
  const { associationId } = req.params;
  try {
    await deleteDBAssociation(associationId);
    return res.json({
      success: true,
      message: `Association with ID ${associationId} deleted successfully`,
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to delete association');
    return res.status(500).json({
      success: false,
      error: 'Failed to delete association',
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  try {
    const prismaResponse = await saveDBAssociation(req.body);
    return res.json({
      success: true,
      data: prismaResponse,
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to save association');
    return res.status(500).json({
      success: false,
      error: 'Failed to save association',
    });
  }
});

export default router;
