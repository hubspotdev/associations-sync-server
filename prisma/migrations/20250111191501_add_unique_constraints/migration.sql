-- CreateEnum
CREATE TYPE "AssociationCategory" AS ENUM ('HUBSPOT_DEFINED', 'INTEGRATOR_DEFINED', 'USER_DEFINED');

-- CreateEnum
CREATE TYPE "Cardinality" AS ENUM ('ONE_TO_ONE', 'ONE_TO_MANY', 'MANY_TO_ONE', 'MANY_TO_MANY');

-- CreateTable
CREATE TABLE "AssociationDefinition" (
    "id" TEXT NOT NULL,
    "fromTypeId" INTEGER,
    "toTypeId" INTEGER,
    "fromObjectType" VARCHAR(255) NOT NULL,
    "toObjectType" VARCHAR(255) NOT NULL,
    "associationLabel" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "inverseLabel" VARCHAR(255),
    "associationTypeId" INTEGER,
    "customerId" VARCHAR(255) NOT NULL,
    "cardinality" "Cardinality" NOT NULL,
    "fromCardinality" INTEGER,
    "toCardinality" INTEGER,
    "associationCategory" "AssociationCategory" NOT NULL,

    CONSTRAINT "AssociationDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Association" (
    "id" TEXT NOT NULL,
    "objectType" VARCHAR(255) NOT NULL,
    "objectId" TEXT NOT NULL,
    "toObjectType" VARCHAR(255) NOT NULL,
    "toObjectId" TEXT NOT NULL,
    "associationLabel" VARCHAR(255) NOT NULL,
    "associationTypeId" INTEGER NOT NULL,
    "associationCategory" "AssociationCategory" NOT NULL,
    "customerId" VARCHAR(255) NOT NULL,
    "cardinality" "Cardinality" NOT NULL,

    CONSTRAINT "Association_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociationMapping" (
    "id" TEXT NOT NULL,
    "nativeAssociationId" TEXT NOT NULL,
    "nativeObjectId" VARCHAR(255) NOT NULL,
    "toNativeObjectId" VARCHAR(255) NOT NULL,
    "fromObjectType" VARCHAR(255) NOT NULL,
    "toObjectType" VARCHAR(255) NOT NULL,
    "nativeAssociationLabel" VARCHAR(255) NOT NULL,
    "hubSpotAssociationLabel" VARCHAR(255) NOT NULL,
    "fromHubSpotObjectId" VARCHAR(255) NOT NULL,
    "toHubSpotObjectId" VARCHAR(255) NOT NULL,
    "customerId" VARCHAR(255) NOT NULL,
    "associationTypeId" INTEGER NOT NULL,
    "associationCategory" "AssociationCategory" NOT NULL,
    "cardinality" "Cardinality" NOT NULL,

    CONSTRAINT "AssociationMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "createdate" TIMESTAMP(3) NOT NULL,
    "domain" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "createdate" TIMESTAMP(3) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "firstname" VARCHAR(255) NOT NULL,
    "lastmodifieddate" TIMESTAMP(3) NOT NULL,
    "lastname" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archived" BOOLEAN NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Authorization" (
    "customerId" VARCHAR(255) NOT NULL,
    "hsPortalId" VARCHAR(255) NOT NULL,
    "accessToken" VARCHAR(255) NOT NULL,
    "refreshToken" VARCHAR(255) NOT NULL,
    "expiresIn" INTEGER,
    "expiresAt" TIMESTAMP(6),

    CONSTRAINT "Authorization_pkey" PRIMARY KEY ("customerId")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssociationDefinition_fromObjectType_toObjectType_associati_key" ON "AssociationDefinition"("fromObjectType", "toObjectType", "associationLabel", "associationTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Association_customerId_toObjectId_objectId_associationLabel_key" ON "Association"("customerId", "toObjectId", "objectId", "associationLabel", "associationTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "AssociationMapping_nativeAssociationId_key" ON "AssociationMapping"("nativeAssociationId");

-- CreateIndex
CREATE UNIQUE INDEX "AssociationMapping_customerId_fromHubSpotObjectId_toHubSpot_key" ON "AssociationMapping"("customerId", "fromHubSpotObjectId", "toHubSpotObjectId", "associationTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "Company"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_email_key" ON "Contact"("email");
