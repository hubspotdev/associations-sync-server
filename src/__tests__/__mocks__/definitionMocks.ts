export const mockDefinition: AssociationDefinition = {
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
  fromCardinality: 1,
  toCardinality: 1,
  associationCategory: 'USER_DEFINED',
};

export const mockHubspotResponse = {
  id: 'hub_assoc_123',
  fromObjectId: 'hub_123',
  toObjectId: 'hub_456',
  category: 'USER_DEFINED',
  typeId: 1,
};

if (process.env.NODE_ENV === 'test') {
  describe('Definition Mocks', () => {
    it('should exist', () => {
      expect(mockDefinition).toBeDefined();
      expect(mockHubspotResponse).toBeDefined();
    });
  });
}
