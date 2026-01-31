import Stripe from 'stripe';
import { ENV } from './env';

// Initialize Stripe with the secret key
export const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: '2023-10-16' as any, // Using a recent stable version
});

/**
 * Creates a Stripe Connect Express account for a landlord
 */
export async function createConnectAccount(email: string) {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'ES', // Default to Spain for this project
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    return account;
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    throw error;
  }
}

/**
 * Creates an account link for onboarding
 */
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
    return accountLink;
  } catch (error) {
    console.error('Error creating account link:', error);
    throw error;
  }
}

/**
 * Creates a login link for the Express Dashboard
 */
export async function createLoginLink(accountId: string) {
  try {
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return loginLink;
  } catch (error) {
    console.error('Error creating login link:', error);
    throw error;
  }
}

/**
 * Retrieves account details to check status
 */
export async function getAccount(accountId: string) {
  try {
    const account = await stripe.accounts.retrieve(accountId);
    return account;
  } catch (error) {
    console.error('Error retrieving account:', error);
    throw error;
  }
}
