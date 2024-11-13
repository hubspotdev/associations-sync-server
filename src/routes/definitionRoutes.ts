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
  getAllAssociationDefinitions,
} from '../hubspot-client/definitionAssociations';
import handleError from '../utils/error';

const router = express.Router();

router.get('/:fromObject/:toObject', async (req: Request, res: Response) => {
  const { fromObject, toObject } = req.params;

  if (!fromObject || !toObject) {
    return res.status(400).json({ error: 'Missing required parameters: fromObject and toObject' });
  }

  try {
    const [dbAssociations, hubspotAssociations] = await Promise.all([
      getDBAssociationDefinitionsByType({ fromObject, toObject }),
      getAllAssociationDefinitions({ fromObject, toObject }),
    ]);

    return res.json({
      success: true,
      data: { dbAssociations, hubspotAssociations },
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to fetch association definitions');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch association definitions',
    });
  }
});

router.delete('/:associationId', async (req: Request, res: Response) => {
  const { associationId } = req.params;

  if (!associationId) {
    return res.status(400).json({ error: 'Missing required parameter: associationId' });
  }

  try {
    await deleteDBAssociationDefinition(associationId);
    const response = await archiveAssociationDefinition(req.body);
    return res.json({
      success: true,
      data: response,
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to archive association definition');
    return res.status(500).json({
      success: false,
      error: 'Failed to archive association definition',
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  try {
    const response = await saveAssociationDefinition(req.body);
    if (!response?.results?.[0]?.typeId || !response?.results?.[1]?.typeId) {
      return res.status(422).json({
        success: false,
        error: 'Invalid response from Hubspot',
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
      error: 'Failed to save association definition',
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    await updateDBAssociationDefinition(req.body, req.params.id);
    const response = await updateAssociationDefinition(req.body);
    res.send(response);
  } catch (error: unknown) {
    handleError(error, 'There was an issue while updating the association definition');
    res.status(500).send('Error updating association definition');
  }
});

export default router;
