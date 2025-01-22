import { AssociationMapping } from '@prisma/client';
import {
  describe, it, expect, jest, beforeEach,
} from '@jest/globals';
import prisma from '../../../prisma-client/prisma-initialization';
import {
  saveBatchDBMapping,
  deleteBatchDBMappings,
  getBatchDBAssociationMappings,
} from '../../../prisma-client/batchAssociations';
import handleError from '../../../utils/error';

// Mock the Prisma client
jest.mock('../../../prisma-client/prisma-initialization', () => ({
  associationMapping: {
    upsert: jest.fn(() => Promise.resolve({})),
    delete: jest.fn(() => Promise.resolve({})),
    findMany: jest.fn(),
  },
  $transaction: jest.fn((operations: Array<() => unknown>) => Promise.resolve(operations.map((op) => op()))),
}));

// Mock error handler
jest.mock('../../../utils/error', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('Batch Associations Database Client', () => {
  const mockMapping: AssociationMapping = {
    id: 'map_123',
    nativeAssociationId: 'nat_123',
    hubSpotAssociationLabel: 'Primary Contact',
    fromHubSpotObjectId: 'hs_123',
    toHubSpotObjectId: 'hs_456',
    associationTypeId: 1,
    nativeObjectId: 'nat_obj_123',
    toNativeObjectId: 'nat_obj_456',
    nativeAssociationLabel: 'Primary Contact',
    customerId: 'cust_123',
    fromObjectType: 'contact',
    toObjectType: 'company',
    associationCategory: 'USER_DEFINED',
    cardinality: 'ONE_TO_ONE',
  };

  const mockMapping2: AssociationMapping = {
    ...mockMapping,
    id: 'map_456',
    nativeAssociationId: 'nat_456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveBatchDBMapping', () => {
    it('should successfully batch upsert mappings', async () => {
      const mappings = [mockMapping, mockMapping2];

      // Mock the upsert operation to return the input
      (prisma.associationMapping.upsert as jest.Mock).mockImplementation(
        (args) => Promise.resolve({ ...args.create }),
      );

      const result = await saveBatchDBMapping(mappings);

      expect(result).toHaveLength(2);
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Function), // upsert operations are wrapped in functions
          expect.any(Function),
        ]),
      );
    });

    it('should handle database errors during batch upsert', async () => {
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
          value: 'P2002',
          enumerable: true,
        },
      });

      (prisma.$transaction as jest.Mock).mockRejectedValue(mockError);

      await expect(saveBatchDBMapping([mockMapping, mockMapping2])).rejects.toThrow();
      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue while attempting to save the association mappings',
      );
    });

    it('should create correct upsert operations for each mapping', async () => {
      const mappings = [mockMapping];

      // Mock the upsert operation to return the input mapping
      (prisma.associationMapping.upsert as jest.Mock).mockImplementation(
        (args:any) => Promise.resolve({ ...args.create }),
      );
      // Mock transaction to return array of results
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockMapping]);

      const result = await saveBatchDBMapping(mappings);

      expect(result).toEqual([mockMapping]); // Verify the return value

      // Get the actual upsert operation passed to transaction
      const transactionCall = (prisma.$transaction as jest.Mock).mock.calls[0][0];
      const upsertOperation = transactionCall[0];

      // Verify the upsert operation structure
      expect(upsertOperation).toEqual({
        where: { nativeAssociationId: mockMapping.nativeAssociationId },
        update: {
          hubSpotAssociationLabel: mockMapping.hubSpotAssociationLabel,
          fromHubSpotObjectId: mockMapping.fromHubSpotObjectId,
          toHubSpotObjectId: mockMapping.toHubSpotObjectId,
          associationTypeId: mockMapping.associationTypeId,
          fromObjectType: mockMapping.fromObjectType,
          toObjectType: mockMapping.toObjectType,
          associationCategory: mockMapping.associationCategory,
          cardinality: mockMapping.cardinality,
        },
        create: mockMapping,
      });
    });
  });

  describe('deleteBatchDBMappings', () => {
    it('should successfully delete multiple mappings', async () => {
      const mappingIds = ['map_123', 'map_456'];
      (prisma.$transaction as jest.Mock).mockResolvedValue([mockMapping, mockMapping2]);

      const result = await deleteBatchDBMappings(mappingIds);

      expect(result).toBe('Mappings with IDs map_123, map_456 were deleted successfully.');
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Promise), // delete operations
          expect.any(Promise),
        ]),
      );
    });

    it('should handle database errors during batch delete', async () => {
      const mockError = Object.create(Error.prototype, {
        name: {
          value: 'PrismaClientKnownRequestError',
          enumerable: true,
        },
        message: {
          value: 'Record not found',
          enumerable: true,
        },
        code: {
          value: 'P2025',
          enumerable: true,
        },
      });

      (prisma.$transaction as jest.Mock).mockRejectedValue(mockError);

      await expect(deleteBatchDBMappings(['map_123', 'map_456'])).rejects.toThrow();
      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue while deleting the association mappings',
      );
    });
  });

  describe('getBatchDBAssociationMappings', () => {
    it('should successfully fetch multiple mappings by IDs', async () => {
      const mappingIds = ['map_123', 'map_456'];
      const mockResults = [mockMapping, mockMapping2];

      (prisma.associationMapping.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getBatchDBAssociationMappings(mappingIds);

      expect(result).toEqual(mockResults);
      expect(prisma.associationMapping.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: mappingIds,
          },
        },
      });
    });

    it('should handle empty results', async () => {
      (prisma.associationMapping.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getBatchDBAssociationMappings(['map_123']);

      expect(result).toEqual([]);
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

      (prisma.associationMapping.findMany as jest.Mock).mockRejectedValue(mockError);

      await expect(getBatchDBAssociationMappings(['map_123'])).rejects.toThrow();
      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue while fetching the association mappings',
      );
    });

    it('should handle null response', async () => {
      (prisma.associationMapping.findMany as jest.Mock).mockResolvedValue(null);

      const result = await getBatchDBAssociationMappings(['map_123']);

      expect(result).toEqual([]);
    });
  });
});
