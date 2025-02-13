import { AssociationMapping, AssociationDefinition } from '@prisma/client';
import { AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec';
import {
  formatSingleRequestData,
  formatBatchRequestData,
  formatBatchArchiveRequest,
  formatDefinitionPostRequest,
  formatDefinitionUpdateRequest,
  formatCreateCardinalityRequest,
  formatUpdateCardinalityRequest,
  checkAccessToken,
  PORT,
  getCustomerId,
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

  describe('formatDefinitionPostRequest', () => {
    it('should format definition post request correctly', () => {
      const definition: AssociationDefinition = {
        id: 'def_123',
        fromObjectType: 'contact',
        toObjectType: 'company',
        associationLabel: 'Primary Contact',
        name: 'primary_contact',
        inverseLabel: 'Primary Company',
        fromTypeId: 1,
        toTypeId: 2,
        customerId: 'cust_123',
        cardinality: 'ONE_TO_ONE',
        fromMaxObjects: 1,
        toMaxObjects: 1,
        associationCategory: 'USER_DEFINED',
        associationTypeId: 1,
      };

      const result = formatDefinitionPostRequest(definition);

      expect(result).toEqual({
        fromObject: 'contact',
        toObject: 'company',
        requestInfo: {
          label: 'Primary Contact',
          name: 'primary_contact',
          inverseLabel: 'Primary Company',
        },
      });
    });

    it('should handle missing optional fields', () => {
      const definition = {
        id: 'def_123',
        fromObjectType: 'contact',
        toObjectType: 'company',
        name: 'primary_contact',
      } as AssociationDefinition;

      const result = formatDefinitionPostRequest(definition);

      expect(result).toEqual({
        fromObject: 'contact',
        toObject: 'company',
        requestInfo: {
          label: '',
          name: 'primary_contact',
          inverseLabel: undefined,
        },
      });
    });
  });

  describe('formatDefinitionUpdateRequest', () => {
    it('should format definition update request correctly', () => {
      const definition: AssociationDefinition = {
        id: 'def_123',
        fromObjectType: 'contact',
        toObjectType: 'company',
        associationLabel: 'Primary Contact',
        name: 'primary_contact',
        inverseLabel: 'Primary Company',
        fromTypeId: 1,
        toTypeId: 2,
        customerId: 'cust_123',
        cardinality: 'ONE_TO_ONE',
        fromMaxObjects: 1,
        toMaxObjects: 1,
        associationCategory: 'USER_DEFINED',
        associationTypeId: 1,
      };

      const result = formatDefinitionUpdateRequest(definition);

      expect(result).toEqual({
        fromObject: 'contact',
        toObject: 'company',
        requestInfo: {
          label: 'Primary Contact',
          associationTypeId: 1,
          inverseLabel: 'Primary Company',
        },
      });
    });
  });

  describe('formatBatchRequestData', () => {
    it('should format batch request data correctly', () => {
      const mappings: AssociationMapping[] = [{
        id: 'map_123',
        fromObjectType: 'contact',
        toObjectType: 'company',
        fromHubSpotObjectId: '123',
        toHubSpotObjectId: '456',
        associationCategory: 'USER_DEFINED',
        associationTypeId: 1,
        nativeAssociationId: 'nat_123',
        hubSpotAssociationLabel: 'Primary Contact',
        nativeObjectId: 'nat_obj_123',
        toNativeObjectId: 'nat_obj_456',
        nativeAssociationLabel: 'Primary Contact',
        customerId: 'cust_123',
        cardinality: 'ONE_TO_ONE',
      }];

      const result = formatBatchRequestData(mappings);

      expect(result).toEqual({
        fromObjectType: 'contact',
        toObjectType: 'company',
        inputs: [{
          _from: { id: '123' },
          to: { id: '456' },
          types: [{
            associationCategory: AssociationSpecAssociationCategoryEnum.UserDefined,
            associationTypeId: 1,
          }],
        }],
      });
    });
  });

  describe('formatBatchArchiveRequest', () => {
    it('should format batch archive request correctly', () => {
      const mappings: AssociationMapping[] = [{
        id: 'map_123',
        fromObjectType: 'contact',
        toObjectType: 'company',
        fromHubSpotObjectId: '123',
        toHubSpotObjectId: '456',
        associationCategory: 'USER_DEFINED',
        associationTypeId: 1,
        nativeAssociationId: 'nat_123',
        hubSpotAssociationLabel: 'Primary Contact',
        nativeObjectId: 'nat_obj_123',
        toNativeObjectId: 'nat_obj_456',
        nativeAssociationLabel: 'Primary Contact',
        customerId: 'cust_123',
        cardinality: 'ONE_TO_ONE',
      }];

      const result = formatBatchArchiveRequest(mappings);

      expect(result).toEqual({
        fromObjectType: 'contact',
        toObjectType: 'company',
        inputs: [{
          _from: { id: '123' },
          to: [{ id: '456' }],
        }],
      });
    });

    it('should return null for empty array', () => {
      const result = formatBatchArchiveRequest([]);
      expect(result).toBeNull();
    });
  });

  describe('formatCreateCardinalityRequest', () => {
    it('should format create cardinality request correctly', () => {
      const response = {
        results: [
          { typeId: 1, category: 'USER_DEFINED' },
          { typeId: 2, category: 'USER_DEFINED' },
        ],
      };

      const definition: AssociationDefinition = {
        id: 'def_123',
        fromObjectType: 'contact',
        toObjectType: 'company',
        fromMaxObjects: 1,
        toMaxObjects: 1,
      } as AssociationDefinition;

      const result = formatCreateCardinalityRequest(response, definition);

      expect(result).toEqual({
        inputs: [
          {
            typeId: 1,
            category: 'USER_DEFINED',
            maxToObjectIds: 1,
          },
          {
            typeId: 2,
            category: 'USER_DEFINED',
            maxToObjectIds: 1,
          },
        ],
      });
    });

    it('should handle missing cardinality values', () => {
      const response = {
        results: [
          { typeId: 1, category: 'USER_DEFINED' },
          { typeId: 2, category: 'USER_DEFINED' },
        ],
      };

      const definition = {} as AssociationDefinition;

      const result = formatCreateCardinalityRequest(response, definition);

      expect(result).toEqual({ inputs: [] });
    });
  });

  describe('formatUpdateCardinalityRequest', () => {
    it('should format update cardinality request correctly', () => {
      const definition: AssociationDefinition = {
        fromTypeId: 1,
        toTypeId: 2,
        fromMaxObjects: 1,
        toMaxObjects: 1,
        associationCategory: 'USER_DEFINED',
      } as AssociationDefinition;

      const result = formatUpdateCardinalityRequest(definition);

      expect(result).toEqual({
        inputs: [
          {
            typeId: 1,
            category: 'USER_DEFINED',
            maxToObjectIds: 1,
          },
          {
            typeId: 2,
            category: 'USER_DEFINED',
            maxToObjectIds: 1,
          },
        ],
      });
    });

    it('should handle missing cardinality values', () => {
      const definition = {} as AssociationDefinition;

      const result = formatUpdateCardinalityRequest(definition);

      expect(result).toEqual({ inputs: [] });
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

  describe('Constants and Simple Functions', () => {
    it('should export correct PORT value', () => {
      expect(PORT).toBe(3001);
    });

    it('should get customer ID', () => {
      expect(getCustomerId()).toBe('1');
    });
  });
});
