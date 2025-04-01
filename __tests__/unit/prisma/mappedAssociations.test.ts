import { AssociationMapping } from '@prisma/client';
import {
  describe, it, expect, jest, beforeEach,
} from '@jest/globals';
import prisma from '../../../src/prisma-client/prisma-initialization';
import {
  getDBMappings,
  saveDBMapping,
  deleteDBMapping,
  getSingleDBAssociationMappingFromId,
  getSingleDBAssociationMapping,
  getAllDBMappings,
} from '../../../src/prisma-client/mappedAssociations';
import handleError from '../../../src/utils/error';

// Mock the Prisma client
jest.mock('../../../src/prisma-client/prisma-initialization', () => ({
  associationMapping: {
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

describe('Mapped Associations Database Client', () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDBMappings', () => {
    it('should successfully fetch mappings by native IDs', async () => {
      const nativeIds = ['nat_123', 'nat_456'];
      const mockResults = [mockMapping];

      (prisma.associationMapping.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getDBMappings(nativeIds);

      expect(result).toEqual(mockResults);
      expect(prisma.associationMapping.findMany).toHaveBeenCalledWith({
        where: {
          nativeAssociationId: {
            in: nativeIds,
          },
        },
      });
    });

    it('should handle empty results', async () => {
      (prisma.associationMapping.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getDBMappings(['nat_123']);

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

      await expect(getDBMappings(['nat_123'])).rejects.toThrow();
      expect(handleError).toHaveBeenCalledWith(mockError, 'Error fetching mappings');
    });
  });

  describe('saveDBMapping', () => {
    it('should successfully upsert a mapping', async () => {
      // Mock with the complete expected return value
      (prisma.associationMapping.upsert as jest.Mock).mockImplementation((args) => Promise.resolve({
        id: mockMapping.id,
        nativeAssociationId: args.where.nativeAssociationId,
        hubSpotAssociationLabel: args.create.hubSpotAssociationLabel,
        fromHubSpotObjectId: args.create.fromHubSpotObjectId,
        toHubSpotObjectId: args.create.toHubSpotObjectId,
        associationTypeId: args.create.associationTypeId,
        nativeObjectId: args.create.nativeObjectId,
        toNativeObjectId: args.create.toNativeObjectId,
        nativeAssociationLabel: args.create.nativeAssociationLabel,
        customerId: args.create.customerId,
        fromObjectType: args.create.fromObjectType,
        toObjectType: args.create.toObjectType,
        associationCategory: args.create.associationCategory,
        cardinality: args.create.cardinality,
      }));

      const result = await saveDBMapping(mockMapping);

      expect(result).toEqual(mockMapping);
      expect(prisma.associationMapping.upsert).toHaveBeenCalledWith({
        where: {
          nativeAssociationId: mockMapping.nativeAssociationId,
        },
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
        create: {
          nativeAssociationId: mockMapping.nativeAssociationId,
          hubSpotAssociationLabel: mockMapping.hubSpotAssociationLabel,
          fromHubSpotObjectId: mockMapping.fromHubSpotObjectId,
          toHubSpotObjectId: mockMapping.toHubSpotObjectId,
          associationTypeId: mockMapping.associationTypeId,
          nativeObjectId: mockMapping.nativeObjectId,
          toNativeObjectId: mockMapping.toNativeObjectId,
          nativeAssociationLabel: mockMapping.nativeAssociationLabel,
          customerId: mockMapping.customerId,
          fromObjectType: mockMapping.fromObjectType,
          toObjectType: mockMapping.toObjectType,
          associationCategory: mockMapping.associationCategory,
          cardinality: mockMapping.cardinality,
        },
      });
    });

    it('should handle errors properly', async () => {
      const mockError = new Error('Database error');
      (prisma.associationMapping.upsert as jest.Mock).mockRejectedValue(mockError);

      await expect(saveDBMapping(mockMapping)).rejects.toThrow('Database error');
      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue while attempting to save the association mapping',
      );
    });
  });

  describe('getSingleDBAssociationMapping', () => {
    it('should successfully fetch a single mapping by native ID', async () => {
      (prisma.associationMapping.findUnique as jest.Mock).mockResolvedValue(mockMapping);

      const result = await getSingleDBAssociationMapping(mockMapping.nativeAssociationId);

      expect(result).toEqual(mockMapping);
      expect(prisma.associationMapping.findUnique).toHaveBeenCalledWith({
        where: {
          nativeAssociationId: mockMapping.nativeAssociationId,
        },
      });
    });

    it('should return null for non-existent mapping', async () => {
      (prisma.associationMapping.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getSingleDBAssociationMapping('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getSingleDBAssociationMappingFromId', () => {
    it('should successfully fetch a single mapping by ID', async () => {
      (prisma.associationMapping.findUnique as jest.Mock).mockResolvedValue(mockMapping);

      const result = await getSingleDBAssociationMappingFromId(mockMapping.id);

      expect(result).toEqual(mockMapping);
      expect(prisma.associationMapping.findUnique).toHaveBeenCalledWith({
        where: {
          id: mockMapping.id,
        },
      });
    });

    it('should return null for non-existent mapping', async () => {
      (prisma.associationMapping.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getSingleDBAssociationMappingFromId('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('deleteDBMapping', () => {
    it('should successfully delete a mapping', async () => {
      (prisma.associationMapping.delete as jest.Mock).mockResolvedValue(mockMapping);

      const result = await deleteDBMapping(mockMapping.id);

      expect(result).toBe(`Mapping with ID ${mockMapping.id} deleted successfully.`);
      expect(prisma.associationMapping.delete).toHaveBeenCalledWith({
        where: {
          id: mockMapping.id,
        },
      });
    });

    it('should handle deletion errors', async () => {
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

      (prisma.associationMapping.delete as jest.Mock).mockRejectedValue(mockError);

      await expect(deleteDBMapping('nonexistent')).rejects.toThrow();
      expect(handleError).toHaveBeenCalledWith(
        mockError,
        'There was an issue while deleting this association mapping',
      );
    });
  });

  describe('getAllDBMappings', () => {
    it('should successfully fetch all mappings', async () => {
      const mockResults = [mockMapping];
      (prisma.associationMapping.findMany as jest.Mock).mockResolvedValue(mockResults);

      const result = await getAllDBMappings();

      expect(result).toEqual(mockResults);
      expect(prisma.associationMapping.findMany).toHaveBeenCalled();
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

      await expect(getAllDBMappings()).rejects.toThrow();
      expect(handleError).toHaveBeenCalledWith(mockError, 'Error fetching all association mappings');
    });
  });
});
