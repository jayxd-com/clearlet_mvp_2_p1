/**
 * ClearLet Reward Configuration
 * Defines the amount of ClearCoins (CC) awarded for various platform activities.
 * All amounts are in CC units (integers).
 */

export const REWARD_AMOUNTS = {
  // User Growth
  USER_SIGNUP: 10,
  
  // Property Growth
  PROPERTY_LISTED: 10,
  
  // Activity Growth
  APPLICATION_SUBMITTED: 5,
  VIEWING_COMPLETED: 5,
  
  // Transactional Growth
  CONTRACT_SIGNED: 20,
  PAYMENT_MADE: 15,
  
  // Verification
  PROFILE_VERIFIED: 50,
  
  // Future potential rewards
  REFERRAL_SUCCESS: 50,
};

export type RewardActivityType = keyof typeof REWARD_AMOUNTS;