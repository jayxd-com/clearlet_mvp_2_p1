import { loadStripe, StripeConstructorOptions } from "@stripe/stripe-js";

/**
 * Loads Stripe with the application's default configuration.
 * Disables the Stripe assistant/developer tools by default.
 */
export const loadStripeWithConfig = (publishableKey: string) => {
  // Cast options to any to allow 'assistant' property which is not in the official types yet
  const options = { assistant: false } as any as StripeConstructorOptions;
  return loadStripe(publishableKey, options);
};
