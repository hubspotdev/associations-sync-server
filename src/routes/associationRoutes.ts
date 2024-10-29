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
} from '../hubspot-client/definitionAssociations';
import handleError from '../utils/error';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const associations = await getDBAssociationDefinitionsByType(req.body);
    res.json(associations);
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

export default router;
