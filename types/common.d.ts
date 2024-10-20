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
type AssociationCategory =
  'HUBSPOT_DEFINED' |
  'INTEGRATOR_DEFINED' |
  'USER_DEFINED'

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

// }
