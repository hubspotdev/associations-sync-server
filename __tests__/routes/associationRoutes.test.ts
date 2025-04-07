import request from 'supertest';
import express from 'express';
import {
  describe, it, expect, beforeEach, jest,
} from '@jest/globals';
import associationRoutes from '../../src/routes/associationRoutes';
import * as dbClient from '../../src/prisma-client/singleAssociations';

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/api/associations', associationRoutes);

// Mock database client functions
jest.mock('../../src/prisma-client/singleAssociations');
jest.mock('../../src/utils/error', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock association data
const mockAssociation = {
  id: 'clh1234abcdef',
  objectType: 'contact',
  objectId: '123456',
  toObjectType: 'company',
  toObjectId: '789012',
  associationLabel: 'Primary Contact',
  associationTypeId: 1,
  associationCategory: 'USER_DEFINED',
  customerId: 'cust_123',
  cardinality: 'ONE_TO_MANY',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Association Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /:associationId', () => {
    it('should successfully return an association', async () => {
      (dbClient.getSingleDBAssociationById).mockResolvedValue(mockAssociation);

      const response = await request(app)
        .get('/api/associations/clh1234abcdef')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'clh1234abcdef',
          objectType: 'contact',
          toObjectType: 'company',
        }),
      });
      expect(dbClient.getSingleDBAssociationById).toHaveBeenCalledWith('clh1234abcdef');
    });

    it('should return 404 when association is not found', async () => {
      (dbClient.getSingleDBAssociationById).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/associations/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        data: 'Association not found',
      });
    });

    it('should handle database errors appropriately', async () => {
      (dbClient.getSingleDBAssociationById).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/associations/clh1234abcdef')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        data: expect.stringContaining('There was an issue getting the association'),
      });
    });
  });

  describe('DELETE /:associationId', () => {
    it('should successfully delete an association', async () => {
      const deletedAssociation = { id: 'clh1234abcdef' };
      (dbClient.deleteDBAssociation).mockResolvedValue(deletedAssociation);

      const response = await request(app)
        .delete('/api/associations/clh1234abcdef')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          deletedAssociation,
          deletedMappingsCount: 0,
        },
      });
      expect(dbClient.deleteDBAssociation).toHaveBeenCalledWith('clh1234abcdef');
    });

    it('should return 404 when trying to delete non-existent association', async () => {
      (dbClient.deleteDBAssociation).mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/associations/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        data: 'Association not found',
      });
    });

    it('should handle deletion errors appropriately', async () => {
      (dbClient.deleteDBAssociation).mockRejectedValue(new Error('Delete failed'));

      const response = await request(app)
        .delete('/api/associations/clh1234abcdef')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        data: expect.stringContaining('Failed to delete association'),
      });
    });
  });

  describe('POST /', () => {
    it('should successfully create a new association', async () => {
      (dbClient.saveDBAssociation).mockResolvedValue(mockAssociation);

      const response = await request(app)
        .post('/api/associations')
        .send(mockAssociation)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'clh1234abcdef',
          objectType: 'contact',
          toObjectType: 'company',
        }),
      });
      expect(dbClient.saveDBAssociation).toHaveBeenCalledWith(
        expect.objectContaining({
          objectType: 'contact',
          toObjectType: 'company',
        }),
      );
    });

    it('should return 400 when request body is empty', async () => {
      const response = await request(app)
        .post('/api/associations')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        data: 'Request body is required',
      });
      expect(dbClient.saveDBAssociation).not.toHaveBeenCalled();
    });

    it('should return 500 when creation fails with no data', async () => {
      (dbClient.saveDBAssociation).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/associations')
        .send(mockAssociation)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        data: 'Association creation failed - no data returned',
      });
    });

    it('should handle creation errors appropriately', async () => {
      (dbClient.saveDBAssociation).mockRejectedValue(new Error('Invalid input data'));

      const response = await request(app)
        .post('/api/associations')
        .send(mockAssociation)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        data: expect.stringContaining('Failed to save association'),
      });
    });

    it('should validate required fields in the request body', async () => {
      const invalidAssociation = {
        objectType: 'contact',
        // missing required fields
      };

      const response = await request(app)
        .post('/api/associations')
        .send(invalidAssociation)
        .expect(500); // Assuming Prisma will throw an error for missing required fields

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Failed to save association');
    });
  });
});
