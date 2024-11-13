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
  try {
    const dbAssociations = await getDBAssociationDefinitionsByType({
      fromObject: req.params.fromObject,
      toObject: req.params.toObject,
    });
    const hubspotAssociations = await getAllAssociationDefinitions({
      fromObject: req.params.fromObject,
      toObject: req.params.toObject,
    });
    res.json({ dbAssociations, hubspotAssociations });
  } catch (error) {
    handleError(error, 'There was an issue getting the native properties with mappings');
    res.status(500).send('Internal Server Error');
  }
});

router.delete('/definitions/:associationId', async (req: Request, res: Response) => {
  try {
    await deleteDBAssociationDefinition(req.params.associationId);
    const response = await archiveAssociationDefinition(req.body);
    res.send(response);
  } catch (error) {
    handleError(error, 'There was an issue while archiving the association definition');
    res.status(500).send('Error archiving association definition');
  }
});

router.post('/definition', async (req: Request, res: Response) => {
  try {
    const response = await saveAssociationDefinition(req.body);
    if (response) {
      const toTypeId = response.results[1].typeId;
      const fromTypeId = response.results[0].typeId;
      await saveDBAssociationDefinition({ ...req.body, toTypeId, fromTypeId });
      res.send(response);
    }
  } catch (error) {
    handleError(error, 'There was an issue while saving the association definition');
    res.status(500).send('Error saving association definition');
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
  try {
    deleteDBAssociation(req.params.associationId);
    res.send(`Association with ID ${req.params.associationId} deleted successfully.`);
  } catch (error) {
    handleError(error, 'There was an issue while attempting to delete the association');
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const prismaResponse = await saveDBAssociation(req.body);
    res.send(prismaResponse);
  } catch (error) {
    handleError(error, 'There was an issue while saving association');
    res.status(500).send('Error saving mapping');
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
