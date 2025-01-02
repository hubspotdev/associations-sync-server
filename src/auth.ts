/* eslint-disable @typescript-eslint/naming-convention */
import 'dotenv/config';
import * as hubspot from '@hubspot/api-client';
import { Authorization } from '@prisma/client';
import { PORT, getCustomerId } from './utils/utils';
import handleError from './utils/error';
import prisma from './prisma-client/prisma-initalization';

interface ExchangeProof {
  grant_type: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  code?: string;
  refresh_token?: string;
}

type HubspotAccountInfo = {
  portalId: number;
  // Additional properties can be uncommented as needed
  // accountType: string;
  // timeZone: string;
  // companyCurrency: string;
  // additionalCurrencies: any[];
  // utcOffset: string;
  // utcOffsetMilliseconds: number;
  // uiDomain: string;
  // dataHostingLocation: string;
};

const CLIENT_ID: string = process.env.CLIENT_ID || 'CLIENT_ID required';
const CLIENT_SECRET: string = process.env.CLIENT_SECRET || 'CLIENT_SECRET required';

const REDIRECT_URI: string = `http://localhost:${PORT}/api/install/oauth-callback`;
const hubspotClient = new hubspot.Client();

const SCOPES = [
  'crm.objects.companies.read',
  'crm.objects.companies.write',
  'crm.objects.contacts.read',
  'crm.objects.contacts.write',
  'crm.objects.deals.read',
  'crm.objects.deals.write',
  'oauth',
];

const scopeString = SCOPES.toString().replaceAll(',', ' ').trim();
console.log('SCOPES++', scopeString);
const authUrl = hubspotClient.oauth.getAuthorizationUrl(
  CLIENT_ID,
  REDIRECT_URI,
  scopeString,
);

const EXCHANGE_CONSTANTS = {
  redirect_uri: REDIRECT_URI,
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
};

const getExpiresAt = (expiresIn: number): Date => {
  const now = new Date();
  return new Date(now.getTime() + expiresIn * 1000);
};

const getHubSpotId = async (accessToken: string): Promise<string | void | null> => {
  try {
    hubspotClient.setAccessToken(accessToken);
    const hubspotAccountInfoResponse = await hubspotClient.apiRequest({
      path: '/account-info/v3/details',
      method: 'GET',
    });

    const hubspotAccountInfo: HubspotAccountInfo = await hubspotAccountInfoResponse.json();
    const hubSpotPortalId = hubspotAccountInfo.portalId;
    return hubSpotPortalId.toString();
  } catch (error:unknown) {
    handleError(error, 'Error getting HubSpot ID');
    return null;
  }
};

const exchangeForTokens = async (
  exchangeProof: ExchangeProof,
): Promise<Authorization | void | null> => {
  const {
    code,
    redirect_uri,
    client_id,
    client_secret,
    grant_type,
    refresh_token,
  } = exchangeProof;

  try {
    const tokenResponse = await hubspotClient.oauth.tokensApi.create(
      grant_type,
      code,
      redirect_uri,
      client_id,
      client_secret,
      refresh_token,
    );

    const {
      accessToken,
      refreshToken,
      expiresIn,
    } = tokenResponse;

    const expiresAt: Date = getExpiresAt(expiresIn);
    const customerId: string = getCustomerId();
    const hsPortalId: string | void | null = await getHubSpotId(accessToken);
    console.log('ACCESS TOKEN ==', accessToken);

    if (typeof hsPortalId !== 'string') {
      throw new Error(
        'The HubSpot Portal ID was not a string; there may be an issue with the HubSpot client or access tokens',
      );
    }

    const tokenInfo = await prisma.authorization.upsert({
      where: {
        customerId,
      },
      update: {
        refreshToken,
        accessToken,
        expiresIn,
        expiresAt,
        hsPortalId,
      },
      create: {
        refreshToken,
        accessToken,
        expiresIn,
        expiresAt,
        hsPortalId,
        customerId,
      },
    });

    return tokenInfo;
  } catch (error: unknown) {
    handleError(error, "There was an issue upserting the user's auth token info to Prisma", true);
    return null;
  }
};

async function getAccessToken(customerId: string): Promise<string | void | null> {
  if (process.env.ACCESS_TOKEN) {
    console.log('getting access token from env', process.env.ACCESS_TOKEN);
    return process.env.ACCESS_TOKEN;
  }
  try {
    const currentCreds = (await prisma.authorization.findFirst({
      select: {
        accessToken: true,
        expiresAt: true,
        refreshToken: true,
      },
      where: {
        customerId,
      },
    })) as Authorization;

    if (currentCreds?.expiresAt && currentCreds.expiresAt > new Date()) {
      return currentCreds.accessToken;
    }

    const updatedCreds = await exchangeForTokens({
      ...EXCHANGE_CONSTANTS,
      grant_type: 'refresh_token',
      refresh_token: currentCreds?.refreshToken,
    });

    if (updatedCreds instanceof Error) {
      throw updatedCreds;
    } else {
      return updatedCreds?.accessToken;
    }
  } catch (error:unknown) {
    handleError(error, 'There was an issue getting or exchanging access tokens', true);
    return null;
  }
}

const redeemCode = async (code: string): Promise<Authorization | null | void> => {
  try {
    return await exchangeForTokens({
      ...EXCHANGE_CONSTANTS,
      code,
      grant_type: 'authorization_code',
    });
  } catch (error:unknown) {
    handleError(error, 'There was an issue while exchanging OAuth tokens');
    return null;
  }
};

export {
  exchangeForTokens,
  redeemCode,
  getAccessToken,
  prisma,
  hubspotClient,
  authUrl,
};
