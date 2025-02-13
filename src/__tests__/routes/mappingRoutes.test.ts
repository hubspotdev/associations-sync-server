import request from 'supertest';
import express from 'express';
import {
  describe, it, expect, beforeEach, jest,
} from '@jest/globals';
import mappingRoutes from '../../routes/mappingRoutes';
import * as singleDbClient from '../../prisma-client/mappedAssociations';
import * as batchDbClient from '../../prisma-client/batchAssociations';
import * as singleHubspotClient from '../../hubspot-client/singleAssociations';
import * as batchHubspotClient from '../../hubspot-client/batchAssociations';
import { mockMapping, mockHubspotResponse } from '../__mocks__/mappingMocks';

// Setup express app for testing
const app = express();
app.use(express.json());
app.use('/api/associations/mappings', mappingRoutes);

// Mock all database and HubSpot client functions
jest.mock('../../prisma-client/mappedAssociations');
jest.mock('../../prisma-client/batchAssociations');
jest.mock('../../hubspot-client/singleAssociations');
jest.mock('../../hubspot-client/batchAssociations');
jest.mock('../../utils/error', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Mapping Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should successfully create a single mapping', async () => {
      (singleHubspotClient.saveSingleHubspotAssociation).mockResolvedValue(mockHubspotResponse);
      (singleDbClient.saveDBMapping).mockResolvedValue(mockMapping);

      const response = await request(app)
        .post('/api/associations/mappings')
        .send(mockMapping)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockMapping,
      });
      expect(singleHubspotClient.saveSingleHubspotAssociation).toHaveBeenCalledWith(mockMapping);
      expect(singleDbClient.saveDBMapping).toHaveBeenCalledWith(mockMapping);
    });

    it('should return 400 if request body is empty', async () => {
      const response = await request(app)
        .post('/api/associations/mappings')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        data: 'Request body is required',
      });
    });

    it('should handle errors appropriately', async () => {
      (singleHubspotClient.saveSingleHubspotAssociation).mockRejectedValue(new Error('Save failed'));

      const response = await request(app)
        .post('/api/associations/mappings')
        .send(mockMapping)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Failed to save association mapping');
    });
  });

  describe('POST /batch', () => {
    it('should successfully create batch mappings', async () => {
      const mockMappings = [mockMapping, { ...mockMapping, id: 'map_124' }];

      (batchHubspotClient.saveBatchHubspotAssociation).mockResolvedValue([mockHubspotResponse]);
      (batchDbClient.saveBatchDBMapping).mockResolvedValue(mockMappings);

      const response = await request(app)
        .post('/api/associations/mappings/batch')
        .send(mockMappings)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: {
          hubspotResponse: [mockHubspotResponse],
          dbResponse: mockMappings,
        },
      });
    });

    it('should handle errors appropriately', async () => {
      (batchDbClient.saveBatchDBMapping).mockRejectedValue(new Error('Batch save failed'));

      const response = await request(app)
        .post('/api/associations/mappings/batch')
        .send([mockMapping])
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        data: 'Error saving mapping',
      });
    });
  });

  describe('DELETE /batch', () => {
    it('should successfully delete batch mappings', async () => {
      const mappingIds = ['map_123', 'map_124'];
      (batchDbClient.getBatchDBAssociationMappings).mockResolvedValue([mockMapping, mockMapping]);
      (batchDbClient.deleteBatchDBMappings).mockResolvedValue(true);
      // (batchHubspotClient.archiveBatchHubspotAssociation).mockResolvedValue([]);

      const response = await request(app)
        .delete('/api/associations/mappings/batch')
        .send({ mappingIds })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          deletedCount: 2,
          deletedRecords: [mockMapping, mockMapping],
        },
      });

      expect(batchDbClient.getBatchDBAssociationMappings).toHaveBeenCalledWith(mappingIds);
      expect(batchDbClient.deleteBatchDBMappings).toHaveBeenCalledWith(mappingIds);
      // expect(batchHubspotClient.archiveBatchHubspotAssociation).toHaveBeenCalledWith([mockMapping, mockMapping]);
    });

    it('should return 400 if mappingIds array is empty', async () => {
      const response = await request(app)
        .delete('/api/associations/mappings/batch')
        .send({ mappingIds: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Invalid or empty mappingIds array');
    });

    it('should return 404 if no mappings were deleted', async () => {
      (batchDbClient.deleteBatchDBMappings).mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/associations/mappings/batch')
        .send({ mappingIds: ['map_123'] })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('No mappings were deleted');
    });
  });

  describe('DELETE /basic/:mappingId', () => {
    it('should successfully delete a single mapping', async () => {
      (singleDbClient.getSingleDBAssociationMappingFromId).mockResolvedValue(mockMapping);
      (singleDbClient.deleteDBMapping).mockResolvedValue(true);
      (singleHubspotClient.archiveSingleHubspotAssociation).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/associations/mappings/basic/map_123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        deletedId: 'map_123',
      });
    });
  });

  describe('GET /basic/:mappingId', () => {
    it('should successfully get a single mapping', async () => {
      (singleDbClient.getSingleDBAssociationMappingFromId).mockResolvedValue(mockMapping);

      const response = await request(app)
        .get('/api/associations/mappings/basic/map_123')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockMapping,
      });
    });

    it('should return 404 if mapping not found', async () => {
      (singleDbClient.getSingleDBAssociationMappingFromId).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/associations/mappings/basic/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Mapping not found');
    });
  });

  describe('GET /all', () => {
    it('should successfully get all mappings', async () => {
      const mockMappings = [mockMapping, { ...mockMapping, id: 'map_124' }];
      (singleDbClient.getAllDBMappings).mockResolvedValue(mockMappings);

      const response = await request(app)
        .get('/api/associations/mappings/all')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockMappings,
      });
    });

    it('should handle errors appropriately', async () => {
      (singleDbClient.getAllDBMappings).mockRejectedValue(new Error('Failed to fetch'));

      const response = await request(app)
        .get('/api/associations/mappings/all')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toContain('Error fetching mappings');
    });
  });
});
