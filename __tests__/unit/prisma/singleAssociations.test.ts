import { Association } from '@prisma/client';
import {
  describe, it, expect, jest, beforeEach,
} from '@jest/globals';
import prisma from '../../../src/prisma-client/prisma-initialization';
import {
  getDBAssociationsByCustomerId,
  getSingleDBAssociationById,
  saveDBAssociation,
  deleteDBAssociation,
} from '../../../src/prisma-client/singleAssociations';
import handleError from '../../../src/utils/error';

// Mock the Prisma client
jest.mock('../../../src/prisma-client/prisma-initialization', () => ({
  association: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock error handler
jest.mock('../../../src/utils/error', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Single Associations Database Client', () => {
  const mockAssociation: Association = {
    id: 'assoc_123',
    objectType: 'contact',
    objectId: 'obj_123',
    toObjectType: 'company',
    toObjectId: 'obj_456',
    associationLabel: 'Primary Contact',
    associationTypeId: 1,
    associationCategory: 'USER_DEFINED',
    customerId: 'cust_123',
    cardinality: 'ONE_TO_ONE',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDBAssociationsByCustomerId', () => {
    it('should successfully fetch associations by customer ID', async () => {
      const mockResults: Association[] = [mockAssociation];
      (prisma.association.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getDBAssociationsByCustomerId('cust_123');

      expect(result).toEqual(mockResults);
      expect(prisma.association.findMany).toHaveBeenCalledWith({
        where: { customerId: 'cust_123' },
      });
    });

    it('should handle database errors', async () => {
      const mockError = new Error('Database error');
      (prisma.association.findMany as jest.Mock).mockRejectedValue(mockError);

      await expect(getDBAssociationsByCustomerId('cust_123')).rejects.toThrow('Database error');
    });
  });

  describe('getSingleDBAssociationById', () => {
    it('should successfully fetch a single association', async () => {
      (prisma.association.findUnique as jest.Mock).mockResolvedValue(mockAssociation);

      const result = await getSingleDBAssociationById('assoc_123');

      expect(result).toEqual(mockAssociation);
      expect(prisma.association.findUnique).toHaveBeenCalledWith({
        where: { id: 'assoc_123' },
      });
    });

    it('should handle lookup errors', async () => {
      const mockError = new Error('Lookup failed');
      (prisma.association.findUnique as jest.Mock).mockRejectedValue(mockError);

      await expect(getSingleDBAssociationById('assoc_123')).rejects.toThrow('Lookup failed');
    });
  });

  describe('saveDBAssociation', () => {
    it('should successfully upsert an association', async () => {
      (prisma.association.upsert as jest.Mock).mockResolvedValue(mockAssociation);

      const result = await saveDBAssociation(mockAssociation);

      expect(result).toEqual(mockAssociation);
      expect(prisma.association.upsert).toHaveBeenCalledWith({
        where: {
          customerId_toObjectId_objectId_associationLabel_associationTypeId: {
            customerId: mockAssociation.customerId,
            toObjectId: mockAssociation.toObjectId,
            objectId: mockAssociation.objectId,
            associationLabel: mockAssociation.associationLabel,
            associationTypeId: mockAssociation.associationTypeId,
          },
        },
        update: {
          associationCategory: mockAssociation.associationCategory,
          cardinality: mockAssociation.cardinality,
        },
        create: {
          objectType: mockAssociation.objectType,
          objectId: mockAssociation.objectId,
          toObjectType: mockAssociation.toObjectType,
          toObjectId: mockAssociation.toObjectId,
          associationLabel: mockAssociation.associationLabel,
          associationTypeId: mockAssociation.associationTypeId,
          associationCategory: mockAssociation.associationCategory,
          customerId: mockAssociation.customerId,
          cardinality: mockAssociation.cardinality,
        },
      });
    });

    it('should throw error when upsert fails', async () => {
      const mockError = new Error('Upsert failed');
      (prisma.association.upsert as jest.Mock).mockRejectedValue(mockError);

      await expect(saveDBAssociation(mockAssociation)).rejects.toThrow('Upsert failed');
      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue while attempting to save the association',
      );
    });
  });

  describe('deleteDBAssociation', () => {
    it('should successfully delete an association', async () => {
      const mockDeletedAssociation = { id: 'assoc_123' /* other fields */ };
      (prisma.association.delete as jest.Mock).mockResolvedValue(mockDeletedAssociation);

      const result = await deleteDBAssociation('assoc_123');
      expect(result).toEqual(mockDeletedAssociation);
    });
  });
});
