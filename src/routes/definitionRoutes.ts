import express, { Request, Response } from 'express';
import {
  updateDBAssociationDefinition,
} from '../prisma-client/definitionAssociations';
import {
  updateAssociationDefinition,
} from '../hubspot-client/definitionAssociations';
import handleError from '../utils/error';
import {
  getAssociationDefinitions,
  deleteDefinitionAndRelatedMappings,
  createAssociationDefinition,
} from '../services/definitionService';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => res.status(404).json({
  success: false,
  data: 'Missing required parameters: fromObject and toObject',
}));

router.get('/:fromObject/:toObject', async (req: Request, res: Response) => {
  const { fromObject, toObject } = req.params;

  try {
    const { dbAssociations, hubspotAssociations } = await getAssociationDefinitions({
      fromObject,
      toObject,
    });

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

router.delete('/', async (req: Request, res: Response) => res.status(404).json({
  success: false,
  data: 'Missing required parameter: associationId',
}));

router.delete('/:associationDefinitionId', async (req: Request, res: Response) => {
  const { associationDefinitionId } = req.params;

  try {
    const result = await deleteDefinitionAndRelatedMappings(associationDefinitionId);

    if (!result.deletedDefinition) {
      return res.status(404).json({
        success: false,
        data: `Association definition with id ${associationDefinitionId} not found`,
      });
    }

    return res.json({
      success: true,
      data: {
        message: `Successfully deleted association definition ${associationDefinitionId}`,
        deletedMappingsCount: result.deletedMappingsCount,
      },
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to archive association definition');
    return res.status(500).json({
      success: false,
      data: `Failed to archive association definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

router.post('/', async (req: Request, res: Response) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      data: 'Request body is required',
    });
  }

  try {
    const result = await createAssociationDefinition(req.body);

    return res.json({
      success: true,
      data: result.hubspotResponse,
    });
  } catch (error: unknown) {
    handleError(error, 'Failed to save association definition');

    if (error instanceof Error && error.message.includes('Invalid response from Hubspot')) {
      return res.status(422).json({
        success: false,
        data: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      data: `Failed to save association definition: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
});

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
