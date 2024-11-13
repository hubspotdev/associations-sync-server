import express, { Request, Response } from 'express';
import {
  saveDBAssociation,
  getSingleDBAssociationById,
  deleteDBAssociation,
} from '../prisma-client/singleAssociations';
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

router.get('/definitions/:fromObject/:toObject', async (req: Request, res: Response) => {
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
  } catch (error) {
    handleError(error, 'Failed to fetch association definitions');
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch association definitions',
    });
  }
});

router.delete('/definitions/:associationId', async (req: Request, res: Response) => {
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
  } catch (error) {
    handleError(error, 'Failed to archive association definition');
    return res.status(500).json({
      success: false,
      error: 'Failed to archive association definition',
    });
  }
});

router.post('/definition', async (req: Request, res: Response) => {
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
  } catch (error) {
    handleError(error, 'Failed to save association definition');
    return res.status(500).json({
      success: false,
      error: 'Failed to save association definition',
    });
  }
});

router.put('/definition/:id', async (req: Request, res: Response) => {
  try {
    await updateDBAssociationDefinition(req.body, req.params.id);
    const response = await updateAssociationDefinition(req.body);
    res.send(response);
  } catch (error) {
    handleError(error, 'There was an issue while updating the association definition');
    res.status(500).send('Error updating association definition');
  }
});

router.get('/:associationId', async (req: Request, res: Response) => {
  try {
    const association = await getSingleDBAssociationById(req.params.associationId);
    res.send(association);
  } catch (error) {
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
  } catch (error) {
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
  } catch (error) {
    handleError(error, 'Failed to save association');
    return res.status(500).json({
      success: false,
      error: 'Failed to save association',
    });
  }
});

// router.get('/definitions/by-role/:roleType', async (req: Request, res: Response) => {
//   try {
//     const associations = await getDBAssociationDefinitionsByRole(req.params.roleType);
//     res.json(associations);
//   } catch (error) {
//     handleError(error, 'Error getting associations by role type');
//     res.status(500).send('Internal Server Error');
//   }
// });

// // Get all available roles between two object types
// router.get('/definitions/:fromType/:toType', async (req: Request, res: Response) => {
//   try {
//     const { fromType, toType } = req.params;

//     // Get from both sources in parallel
//     const [dbAssociations, hubspotAssociations] = await Promise.all([
//       getDBAssociationDefinitionsByTypes(fromType, toType),
//       getHubspotAssociationDefinitions(fromType, toType),
//     ]);

//     // Compare and flag any discrepancies
//     const merged = mergeAndFlagDiscrepancies(dbAssociations, hubspotAssociations);

//     res.json({
//       data: merged,
//       sources: {
//         database: { count: dbAssociations.length },
//         hubspot: { count: hubspotAssociations.length },
//       },
//       syncStatus: merged.some((m) => m.hasDiscrepancy) ? 'out_of_sync' : 'in_sync',
//     });
//   } catch (error) {
//     handleError(error, 'Error getting associations between object types');
//     res.status(500).send('Internal Server Error');
//   }
// });

export default router;
