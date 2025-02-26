import { AssociationDefinition } from '@prisma/client';
import {
  describe, it, expect, jest, beforeEach,
} from '@jest/globals';
import prisma from '../../../src/prisma-client/prisma-initialization';
import {
  getDBAssociationDefinitionsByType,
  saveDBAssociationDefinition,
  updateDBAssociationDefinition,
  deleteDBAssociationDefinition,
} from '../../../src/prisma-client/definitionAssociations';
import handleError from '../../../src/utils/error';

// Mock the Prisma client
jest.mock('../../../src/prisma-client/prisma-initialization', () => ({
  associationDefinition: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock error handler
jest.mock('../../../src/utils/error', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Definition Associations Database Client', () => {
  const mockDefinition: AssociationDefinition = {
    id: 'def_123',
    fromTypeId: 1,
    toTypeId: 2,
    fromObjectType: 'contact',
    toObjectType: 'company',
    associationLabel: 'Primary Contact',
    name: 'primary_contact',
    inverseLabel: 'Primary Company',
    associationTypeId: 1,
    customerId: 'cust_123',
    cardinality: 'ONE_TO_ONE',
    fromMaxObjects: 1,
    toMaxObjects: 1,
    associationCategory: 'USER_DEFINED',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDBAssociationDefinitionsByType', () => {
    it('should successfully fetch definitions by type', async () => {
      const mockData = {
        fromObject: 'contact',
        toObject: 'company',
      };
      const mockResults = [mockDefinition];

      (prisma.associationDefinition.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getDBAssociationDefinitionsByType(mockData);

      expect(result).toEqual(mockResults);
      expect(prisma.associationDefinition.findMany).toHaveBeenCalledWith({
        where: {
          fromObjectType: {
            equals: 'contact',
            mode: 'insensitive',
          },
          toObjectType: {
            equals: 'company',
            mode: 'insensitive',
          },
        },
      });
    });

    it('should handle empty results', async () => {
      (prisma.associationDefinition.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getDBAssociationDefinitionsByType({
        fromObject: 'contact',
        toObject: 'company',
      });

      expect(result).toEqual([]);
    });

    it('should handle case-insensitive search', async () => {
      await getDBAssociationDefinitionsByType({
        fromObject: 'ConTaCt',
        toObject: 'ComPaNy',
      });

      expect(prisma.associationDefinition.findMany).toHaveBeenCalledWith({
        where: {
          fromObjectType: {
            equals: 'ConTaCt',
            mode: 'insensitive',
          },
          toObjectType: {
            equals: 'ComPaNy',
            mode: 'insensitive',
          },
        },
      });
    });

    it('should handle database errors', async () => {
      const mockError = Object.create(Error.prototype, {
        name: {
          value: 'PrismaClientKnownRequestError',
          enumerable: true,
        },
        message: {
          value: 'Database error',
          enumerable: true,
        },
        code: {
          value: 'P2000',
          enumerable: true,
        },
      });

      (prisma.associationDefinition.findMany as jest.Mock).mockRejectedValue(mockError);

      await expect(getDBAssociationDefinitionsByType({
        fromObject: 'contact',
        toObject: 'company',
      })).rejects.toThrow();

      // Verify error was handled
      expect(handleError).toHaveBeenCalledWith(
        mockError,
        expect.any(String),
      );
    });
  });

  describe('saveDBAssociationDefinition', () => {
    it('should successfully create a definition', async () => {
      (prisma.associationDefinition.create as jest.Mock).mockResolvedValue(mockDefinition);

      const result = await saveDBAssociationDefinition(mockDefinition);

      expect(result).toEqual(mockDefinition);
      expect(prisma.associationDefinition.create).toHaveBeenCalledWith({
        data: mockDefinition,
      });
    });

    it('should handle unique constraint violations', async () => {
      // Create proper Prisma error structure
      const uniqueError = Object.create(Error.prototype, {
        name: {
          value: 'PrismaClientKnownRequestError',
          enumerable: true,
        },
        code: {
          value: 'P2002',
          enumerable: true,
        },
        message: {
          value: 'Unique constraint failed',
          enumerable: true,
        },
        meta: {
          value: { target: ['associationLabel'] },
          enumerable: true,
        },
      });

      (prisma.associationDefinition.create as jest.Mock).mockRejectedValue(uniqueError);

      await expect(saveDBAssociationDefinition(mockDefinition))
        .rejects
        .toThrow('Unique constraint failed');
    });
  });

  describe('updateDBAssociationDefinition', () => {
    it('should successfully update a definition', async () => {
      (prisma.associationDefinition.update as jest.Mock).mockResolvedValue(mockDefinition);

      const result = await updateDBAssociationDefinition(mockDefinition, 'def_123');

      expect(result).toEqual(mockDefinition);
      expect(prisma.associationDefinition.update).toHaveBeenCalledWith({
        where: { id: 'def_123' },
        data: mockDefinition,
      });
    });

    it('should handle non-existent records', async () => {
      const notFoundError = new Error('Record not found');
      notFoundError.name = 'PrismaClientKnownRequestError';
      notFoundError.code = 'P2025';

      (prisma.associationDefinition.update as jest.Mock).mockRejectedValue(notFoundError);

      await expect(updateDBAssociationDefinition(mockDefinition, 'nonexistent'))
        .rejects
        .toThrow();
    });

    it('should handle partial updates', async () => {
      const partialDefinition = {
        associationLabel: 'Updated Label',
        inverseLabel: 'Updated Inverse Label',
      };

      (prisma.associationDefinition.update as jest.Mock).mockResolvedValue({
        ...mockDefinition,
        ...partialDefinition,
      });

      const result = await updateDBAssociationDefinition(partialDefinition, 'def_123');

      expect(result.associationLabel).toBe('Updated Label');
      expect(result.inverseLabel).toBe('Updated Inverse Label');
      expect(prisma.associationDefinition.update).toHaveBeenCalledWith({
        where: { id: 'def_123' },
        data: partialDefinition,
      });
    });
  });

  describe('deleteDBAssociationDefinition', () => {
    it('should successfully delete a definition', async () => {
      (prisma.associationDefinition.delete as jest.Mock).mockResolvedValue(mockDefinition);

      const result = await deleteDBAssociationDefinition('def_123');

      expect(result).toEqual(mockDefinition);
      expect(prisma.associationDefinition.delete).toHaveBeenCalledWith({
        where: { id: 'def_123' },
      });
    });

    it('should handle non-existent records', async () => {
      const notFoundError = new Error('Record not found');
      notFoundError.name = 'PrismaClientKnownRequestError';
      notFoundError.code = 'P2025';

      (prisma.associationDefinition.delete as jest.Mock).mockRejectedValue(notFoundError);

      await expect(deleteDBAssociationDefinition('nonexistent'))
        .rejects
        .toThrow();
    });

    it('should handle database constraint violations', async () => {
      const constraintError = new Error('Foreign key constraint failed');
      constraintError.name = 'PrismaClientKnownRequestError';
      constraintError.code = 'P2003';

      (prisma.associationDefinition.delete as jest.Mock).mockRejectedValue(constraintError);

      await expect(deleteDBAssociationDefinition('def_123'))
        .rejects
        .toThrow('Cannot delete definition due to existing references');
    });
  });
});
