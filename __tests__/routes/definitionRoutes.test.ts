import request from 'supertest';
import express from 'express';
import {
  describe, it, expect, beforeEach, jest,
} from '@jest/globals';
import definitionRoutes from '../../src/routes/definitionRoutes';
import * as dbClient from '../../src/prisma-client/definitionAssociations';
import * as batchClient from '../../src/prisma-client/batchAssociations';
import * as hubspotClient from '../../src/hubspot-client/definitionAssociations';
import { mockDefinition, mockHubspotResponse } from '../__mocks__/definitionMocks';

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/api/associations/definitions', definitionRoutes);

// Mock all database and HubSpot client functions
jest.mock('../../src/prisma-client/definitionAssociations');
jest.mock('../../src/hubspot-client/definitionAssociations');
jest.mock('../../src/prisma-client/batchAssociations');
jest.mock('../../src/utils/error', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Definition Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /:fromObject/:toObject', () => {
    it('should return definitions from both DB and HubSpot', async () => {
      const mockDbAssociations = [mockDefinition];
      const mockHubspotAssociations = [mockHubspotResponse];

      (dbClient.getDBAssociationDefinitionsByType).mockResolvedValue(mockDbAssociations);
      (hubspotClient.getAllAssociationDefinitionsByType).mockResolvedValue(mockHubspotAssociations);

      const response = await request(app)
        .get('/api/associations/definitions/contact/company')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          dbAssociations: mockDbAssociations,
          hubspotAssociations: mockHubspotAssociations,
        },
      });
    });

    it('should return 404 if parameters are missing', async () => {
      const response = await request(app)
        .get('/api/associations/definitions/')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Missing required parameters');
    });

    it('should handle errors appropriately', async () => {
      (dbClient.getDBAssociationDefinitionsByType).mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .get('/api/associations/definitions/contact/company')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Failed to fetch association definitions');
    });
  });

  describe('DELETE /:associationId', () => {
    it('should successfully delete a definition', async () => {
      // Mock the DB response to include associationTypeId
      const mockDeleteResponse = {
        ...mockDefinition,
        associationTypeId: 1, // Ensure this is set for single direction case
      };

      (dbClient.deleteDBAssociationDefinition).mockResolvedValue(mockDeleteResponse);
      (batchClient.getBatchDBAssociationMappingsByAssociationId).mockResolvedValue([]);

      const response = await request(app)
        .delete('/api/associations/definitions/123')
        .send(mockDefinition)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        message: 'Successfully deleted association definition 123',
        deletedMappingsCount: 0,
      });

      expect(dbClient.deleteDBAssociationDefinition).toHaveBeenCalledWith('123');
    });

    // Add a new test for bidirectional case
    it('should successfully delete a bidirectional definition', async () => {
      const associationDefinitionId = '123'; // Define the ID explicitly
      const mockBidirectionalResponse = {
        ...mockDefinition,
        id: associationDefinitionId, // Add the ID to the mock response
        fromTypeId: 1,
        toTypeId: 2,
        associationTypeId: null, // This triggers bidirectional case
      };

      (dbClient.deleteDBAssociationDefinition).mockResolvedValue(mockBidirectionalResponse);
      (hubspotClient.archiveAssociationDefinition).mockResolvedValue({ success: true });
      (batchClient.getBatchDBAssociationMappingsByAssociationId).mockResolvedValue([]);

      const response = await request(app)
        .delete(`/api/associations/definitions/${associationDefinitionId}`) // Use template literal
        .expect(200); // Remove .send() since we're passing the ID in the URL

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        message: `Successfully deleted association definition ${associationDefinitionId}`,
        deletedMappingsCount: 0,
      });

      // Verify the correct ID was passed to the service functions
      expect(dbClient.deleteDBAssociationDefinition).toHaveBeenCalledWith(associationDefinitionId);
      expect(batchClient.getBatchDBAssociationMappingsByAssociationId).toHaveBeenCalledWith(associationDefinitionId);
    });

    it('should return 404 if associationId is missing', async () => {
      const response = await request(app)
        .delete('/api/associations/definitions/')
        .send(mockDefinition)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Missing required parameter');
    });

    it('should handle errors appropriately', async () => {
      (dbClient.deleteDBAssociationDefinition).mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/associations/definitions/123')
        .send(mockDefinition)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Failed to archive association definition');
    });
  });

  describe('POST /', () => {
    it('should successfully create a new definition', async () => {
      const hubspotResponse = {
        results: [
          { typeId: 1 },
          { typeId: 2 },
        ],
      };

      (hubspotClient.saveAssociationDefinition).mockResolvedValue(hubspotResponse);
      (dbClient.saveDBAssociationDefinition).mockResolvedValue(mockDefinition);

      const response = await request(app)
        .post('/api/associations/definitions')
        .send(mockDefinition)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(hubspotResponse);
      expect(dbClient.saveDBAssociationDefinition).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockDefinition,
          fromTypeId: 1,
          toTypeId: 2,
        }),
      );
    });

    it('should return 400 if request body is empty', async () => {
      const response = await request(app)
        .post('/api/associations/definitions')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Request body is required');
    });

    it('should return 422 if HubSpot response is invalid', async () => {
      (hubspotClient.saveAssociationDefinition).mockResolvedValue({
        results: [{ invalid: 'response' }],
      });

      const response = await request(app)
        .post('/api/associations/definitions')
        .send(mockDefinition)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Invalid response from Hubspot');
    });
  });

  describe('PUT /:id', () => {
    it('should successfully update a definition', async () => {
      (dbClient.updateDBAssociationDefinition).mockResolvedValue(mockDefinition);
      (hubspotClient.updateAssociationDefinition).mockResolvedValue({ success: true });

      const response = await request(app)
        .put('/api/associations/definitions/123')
        .send(mockDefinition)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(dbClient.updateDBAssociationDefinition).toHaveBeenCalledWith(mockDefinition, '123');
      expect(hubspotClient.updateAssociationDefinition).toHaveBeenCalledWith(mockDefinition);
    });

    it('should handle errors appropriately', async () => {
      (dbClient.updateDBAssociationDefinition).mockRejectedValue(new Error('Update failed'));

      const response = await request(app)
        .put('/api/associations/definitions/123')
        .send(mockDefinition)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Error updating association definition');
    });
  });
});
