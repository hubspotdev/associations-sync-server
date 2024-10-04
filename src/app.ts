import "dotenv/config";
import express, { Application, Request, Response } from "express";
import shutdown from './utils/shutdown';
import {getAssociationsByCustomerId, getMappings, saveMapping, deleteMapping} from "./mappings";
import { PORT, getCustomerId } from "./utils/utils";
import { AssociationMapping, Association } from "@prisma/client";
import handleError from './utils/error'

const app: Application = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get(
  "/api/native-associations-with-mappings",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const customerId = getCustomerId(); // Assuming function to extract the customer ID
      const associations = await getAssociationsByCustomerId(customerId);

      const associationIds = associations.map((association) => association.id);
      const mappings = await getMappings(associationIds);

      const responseData = associations.map((association) => ({
        association,
        mappings: mappings.filter((mapping) => mapping.associationId === association.id),
      }));

      console.log('Response from native-associations-with-mappings:', responseData);
      res.json(responseData);
    } catch (error) {
      handleError(error, 'There was an issue getting the native properties with mappings ');
      res.status(500).send("Internal Server Error");
    }
  }
);
// app.get("/api/hubspot-associations", async (req: Request, res: Response): Promise<void> => {
//   try {
//     const customerId: string = getCustomerId();
//     const properties = await getHubSpotAssociations(customerId);
//     res.send(properties);
//   } catch (error) {
//     handleError(error, 'There was an issue getting Hubspot properties ')
//     res.status(500).send('Internal Server Error');
//   }})

app.post("/api/association/mappings", async (req: Request, res: Response): Promise<void> => {
  try{
    const response = await saveMapping(req.body as AssociationMapping);
    console.log('succesfully saved mapping', response)
    res.send(response);
  } catch(error) {
    handleError(error, 'There was an issue while saving property mappings ')
    res.status(500).send('Error saving mapping')
  }
});

app.delete("/api/associations/mappings/:mappingId", async (req: Request, res: Response): Promise<void> => {
  const mappingToDelete = req.params.mappingId;
  const mappingId = parseInt(mappingToDelete);
  if (!mappingId ) {
    res.status(400).send("Invalid mapping Id format");
  }
  try {
    const deleteMappingResult = await deleteMapping(mappingId);
    res.send(deleteMappingResult);
  } catch(error) {
    handleError(error, 'There was an issue while attempting to delete the mapping ')
  }
});


const server = app.listen(PORT, function () {
  console.log(`App is listening on port ${PORT} !`);
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  shutdown()
});

export default server
