import handleError from "./utils/error";
import { getCustomerId } from "./utils/utils";
import { Client } from "@hubspot/api-client";
import * as hubspot from '@hubspot/api-client';

const OAUTH_SERVICE_URL = process.env.OAUTH_SERVICE_URL || 'http://oauth-service:3001';
const hubspotClient = new hubspot.Client();

/**
 * Retrieves a HubSpot access token for a customer
 * customerId - The ID of the customer
 * Returns the access token
 */
export async function getHubSpotToken(customerId: string): Promise<string | null> {
  try {
    const response = await fetch(`${OAUTH_SERVICE_URL}/api/get-token?customerId=${customerId}`);
    const data = await response.json();

    if (!data.accessToken) {
      const errorMessage = data.errorMessage || 'No OAuth authorization found. Please complete the OAuth flow first.';
      handleError(
        new Error(errorMessage),
        "There was an issue while retrieving the HubSpot access token",
        false
      );
      return null;
    }

    return data.accessToken;
  } catch (error) {
    handleError(
      error,
      "There was an issue while retrieving the HubSpot access token",
      false
    );
    return null;
  }
}

/**
 * Applies the access token to the HubSpot client
 * accessToken - The HubSpot access token
 * Returns the configured HubSpot client
 */
function applyHubSpotAccessToken(accessToken: string): Client {
  try {
    hubspotClient.setAccessToken(accessToken);
    return hubspotClient;
  } catch (error) {
    handleError(
      error,
      "There was an issue while setting the HubSpot access token",
      false
    );
    throw error;
  }
}

/**
 * Authenticates the HubSpot client and ensures required properties exist
 */
async function authenticateHubspotClient(): Promise<Client | null> {
  try {
    const customerId = getCustomerId();
    const accessToken = await getHubSpotToken(customerId);

    if (!accessToken) {
      return null;
    }

    // Apply the token first
    const client = applyHubSpotAccessToken(accessToken);


    return client;
  } catch (error) {
    handleError(
      error,
      "There was an issue while authenticating the HubSpot client",
      false
    );
    return null;
  }
}

export { authenticateHubspotClient, hubspotClient };
