import { AssociationMapping, AssociationDefinition } from '@prisma/client';
import {
  formatSingleRequestData,
  formatBatchRequestData,
  formatBatchArchiveRequest,
  checkAccessToken,
  formatDefinitionPostRequest,
  formatDefinitionUpdateRequest,
} from '../../../utils/utils';

describe('Utils Functions', () => {
  describe('formatSingleRequestData', () => {
    it('should format single request data correctly', () => {
      const input = {
        fromObjectType: 'contact',
        fromHubSpotObjectId: '123',
        toObjectType: 'company',
        toHubSpotObjectId: '456',
        associationCategory: 'USER_DEFINED',
        associationTypeId: 1,
      };

      const result = formatSingleRequestData(input);

      expect(result).toEqual({
        objectType: 'contact',
        objectId: '123',
        toObjectType: 'company',
        toObjectId: '456',
        associationType: [{
          associationCategory: 'USER_DEFINED',
          associationTypeId: 1,
        }],
      });
    });
  });

  describe('formatBatchArchiveRequest', () => {
    it('should return null for empty array', () => {
      const result = formatBatchArchiveRequest([]);
      expect(result).toBeNull();
    });

    it('should format batch archive request correctly', () => {
      const mockDefinitions = [{
        fromObjectType: 'contact',
        toObjectType: 'company',
        fromHubSpotObjectId: '123',
        toHubSpotObjectId: '456',
      }] as AssociationMapping[];

      const result = formatBatchArchiveRequest(mockDefinitions);

      expect(result).toEqual({
        fromObjectType: 'contact',
        toObjectType: 'company',
        inputs: [{
          _from: { id: '123' },
          to: [{ id: '456' }],
        }],
      });
    });
  });

  describe('checkAccessToken', () => {
    it('should throw error for null token', () => {
      expect(() => checkAccessToken(null)).toThrow('Access token is null');
    });

    it('should throw error for undefined token', () => {
      expect(() => checkAccessToken(undefined)).toThrow('Access token is not defined');
    });

    it('should throw error for empty string token', () => {
      expect(() => checkAccessToken('')).toThrow('Access token is empty');
    });

    it('should throw error for non-string token', () => {
      expect(() => checkAccessToken(123 as any)).toThrow('Access token is not a string');
    });

    it('should not throw for valid token', () => {
      expect(() => checkAccessToken('valid-token')).not.toThrow();
    });
  });
});
