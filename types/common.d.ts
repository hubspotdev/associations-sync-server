import {  AssociationSpecAssociationCategoryEnum } from '@hubspot/api-client/lib/codegen/crm/companies';
import { BatchInputPublicAssociationMultiArchive, BatchInputPublicAssociationMultiPost, BatchInputPublicDefaultAssociationMultiPost } from '@hubspot/api-client/lib/codegen/crm/associations/v4';
import {AssociationSpec} from '@hubspot/api-client/lib/codegen/crm/associations/v4/models/AssociationSpec'

// declare module "default" {
  enum Objects {
    Contact = "Contact",
    Company = "Company",
  }

  enum Direction {
    toHubSpot = "toHubSpot",
    toNative = "toNative",
    biDirectional = "biDirectional",
  }

  export interface LogMessage {
    message: string;
    object?: any;
    context?:string;
    data?: any;
    stack?: string;
    code?: string;
    statusCode?: number;
    correlationId?: string;
    details?: any[];
    error?: Error
}

type LogLevel = 'Info' | 'Warning' | 'Error';

 export interface LogObject {
    logMessage : LogMessage,
    critical? : boolean,
    context : string,
    type? : string
    level?: LogLevel
}


export interface AssociationRequest {
  objectType: string;
  objectId: string;
  toObjectType: string;
  toObjectId: string;
  associationType:AssociationSpec[];
}

export interface AssociationBatchRequest {
  objectType: string;
  objectId: string;
  toObjectType: string;
  toObjectId: string;
  associations: BatchInputPublicAssociationMultiPost;
}
export interface AssociationBatchArchiveRequest {
  objectType: string;
  toObjectType: string;
  associations: BatchInputPublicAssociationMultiArchive;
}
// type AssociationCategory =
//   'HUBSPOT_DEFINED' |
//   'INTEGRATOR_DEFINED' |
//   'USER_DEFINED'

export interface AssociationMapping {
  id: number;
  nativeAssociationId: number;
  // hubSpotAssociationId: number;
  nativeObjectId: string;
  toNativeObjectId: string;
  fromObjectType: string;
  toObjectType: string;
  nativeAssociationLabel: string;
  hubSpotAssociationLabel: string;
  fromHubSpotObjectId: string;
  toHubSpotObjectId: string;
  customerId: string;
  associationTypeId: number;
  associationCategory: AssociationSpecAssociationCategoryEnum;
  cardinality: string;
}

export enum AssociationCategory {
  HUBSPOT_DEFINED = "HUBSPOT_DEFINED",
  INTEGRATOR_DEFINED = "INTEGRATOR_DEFINED",
  USER_DEFINED = "USER_DEFINED"
}

// TypeScript equivalent for Prisma enum `Cardinality`
enum Cardinality {
  ONE_TO_ONE = "ONE_TO_ONE",
  ONE_TO_MANY = "ONE_TO_MANY",
  MANY_TO_ONE = "MANY_TO_ONE",
  MANY_TO_MANY = "MANY_TO_MANY"
}

export interface Association {
  id: string;
  objectType: string;
  objectId: string;
  toObjectType: string;
  toObjectId: string;
  associationLabel: string;
  secondaryAssociationLabel?: string; // Optional property
  associationTypeId: number;
  associationCategory: AssociationCategory;
  customerId: string;
  cardinality: Cardinality;
}

type AssociationDefinitionCreateRequest = {
  fromObject: string;
  toObject: string;
  requestInfo: {
    label:string;
    name: string;
    inverseLabel?:string
  }
};

type AssociationDefinitionUpdateRequest = {
  fromObject: string;
  toObject: string;
  fromCardinality?:number,
  toCardinality?:number,
  requestInfo: {
    label:string;
    associationTypeId: number;
    inverseLabel?:string
  }[]
};

type AssociationDefinitionArchiveRequest = {
  fromObjectType: string;
  toObjectType: string;
  associationTypeId: number;
};

// }
