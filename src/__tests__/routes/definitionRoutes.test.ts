import request from 'supertest';
import express from 'express';
import {
  describe, it, expect, beforeEach, jest,
} from '@jest/globals';
import definitionRoutes from '../../routes/definitionRoutes';
import * as dbClient from '../../prisma-client/definitionAssociations';
import * as hubspotClient from '../../hubspot-client/definitionAssociations';
import { mockDefinition, mockHubspotResponse } from '../__mocks__/definitionMocks';

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/api/associations/definitions', definitionRoutes);

// Mock all database and HubSpot client functions
jest.mock('../../prisma-client/definitionAssociations');
jest.mock('../../hubspot-client/definitionAssociations');
jest.mock('../../utils/error', () => ({
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
      (dbClient.deleteDBAssociationDefinition).mockResolvedValue(true);
      (hubspotClient.archiveAssociationDefinition).mockResolvedValue({ success: true });

      const response = await request(app)
        .delete('/api/associations/definitions/123')
        .send(mockDefinition)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(dbClient.deleteDBAssociationDefinition).toHaveBeenCalledWith('123');
      expect(hubspotClient.archiveAssociationDefinition).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockDefinition,
        }),
      );
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
      expect(response.body.error).toContain('Failed to archive association definition');
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
