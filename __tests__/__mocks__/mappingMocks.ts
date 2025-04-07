export const mockMapping = {
  id: 'map_123',
  nativeAssociationId: 'nat_123',
  nativeObjectId: 'obj_123',
  toNativeObjectId: 'obj_456',
  fromObjectType: 'contact',
  toObjectType: 'company',
  nativeAssociationLabel: 'Primary Contact',
  hubSpotAssociationLabel: 'primary_contact',
  fromHubSpotObjectId: 'hub_123',
  toHubSpotObjectId: 'hub_456',
  customerId: 'cust_123',
  associationTypeId: 1,
  associationCategory: 'USER_DEFINED',
  cardinality: 'ONE_TO_ONE',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockHubspotResponse = {
  id: 'hub_assoc_123',
  fromObjectId: 'hub_123',
  toObjectId: 'hub_456',
  category: 'USER_DEFINED',
  typeId: 1,
};

// Add a dummy test to satisfy Jest's requirement for test files
if (process.env.NODE_ENV === 'test') {
  describe('Mapping Mocks', () => {
    it('should exist', () => {
      expect(mockMapping).toBeDefined();
      expect(mockHubspotResponse).toBeDefined();
    });
  });
}
