/**
 * ClearLet Tenant Score Algorithm
 * 
 * Calculates a comprehensive score (0-100) based on:
 * - Rental History (25%)
 * - Employment Status (20%)
 * - Annual Salary (20%)
 * - Payment History (20%)
 * - References & Reviews (15%)
 */

export interface TenantScoreFactors {
  // Rental history in months
  rentalHistoryMonths: number;
  
  // Employment status: "employed" | "self-employed" | "student" | "unemployed"
  employmentStatus: "employed" | "self-employed" | "student" | "unemployed";
  
  // Annual salary in EUR
  annualSalary: number;
  
  // Number of on-time rent payments
  onTimePayments: number;
  
  // Number of late payments
  latePayments: number;
  
  // Number of evictions
  evictions: number;
  
  // Number of positive references
  positiveReferences: number;
  
  // Number of negative references
  negativeReferences: number;
  
  // Whether they have been verified on ClearLet
  isVerified: boolean;
}

export interface TenantScoreBreakdown {
  totalScore: number;
  rentalHistoryScore: number;
  employmentScore: number;
  salaryScore: number;
  paymentHistoryScore: number;
  referencesScore: number;
  breakdown: {
    rentalHistory: { score: number; weight: number; maxScore: number };
    employment: { score: number; weight: number; maxScore: number };
    salary: { score: number; weight: number; maxScore: number };
    paymentHistory: { score: number; weight: number; maxScore: number };
    references: { score: number; weight: number; maxScore: number };
  };
}

/**
 * Calculate ClearLet Tenant Score
 * Returns a score between 0-100
 */
export function calculateTenantScore(
  factors: TenantScoreFactors
): TenantScoreBreakdown {
  // 1. Rental History Score (25% weight)
  // Formula: months_renting × 0.5, penalty: -20 points per eviction
  const rentalHistoryScore = calculateRentalHistoryScore(
    factors.rentalHistoryMonths,
    factors.evictions
  );

  // 2. Employment Status Score (20% weight)
  // Formula: Employed: 20, Self-employed: 15, Student: 10, Unemployed: 0
  const employmentScore = calculateEmploymentScore(factors.employmentStatus);

  // 3. Annual Salary Score (20% weight)
  // Formula: salary / 1000, capped at 20 points maximum
  const salaryScore = calculateSalaryScore(factors.annualSalary);

  // 4. Payment History Score (20% weight)
  // Formula: (on_time_payments / total_payments) × 20
  const paymentHistoryScore = calculatePaymentHistoryScore(
    factors.onTimePayments,
    factors.latePayments
  );

  // 5. References Score (15% weight)
  // Formula: (positive_refs / total_refs) × 15
  const referencesScore = calculateReferencesScore(
    factors.positiveReferences,
    factors.negativeReferences
  );

  // 6. Verification Bonus
  // +5 points if documents verified
  const verificationBonus = factors.isVerified ? 5 : 0;

  // Calculate total score (sum of all components, capped at 100)
  const totalScore = Math.min(
    100,
    Math.round(
      rentalHistoryScore +
        employmentScore +
        salaryScore +
        paymentHistoryScore +
        referencesScore +
        verificationBonus
    )
  );

  return {
    totalScore,
    rentalHistoryScore,
    employmentScore,
    salaryScore,
    paymentHistoryScore,
    referencesScore,
    breakdown: {
      rentalHistory: {
        score: rentalHistoryScore,
        weight: 0.25,
        maxScore: 25, // 25% of 100
      },
      employment: {
        score: employmentScore,
        weight: 0.2,
        maxScore: 20, // 20% of 100
      },
      salary: {
        score: salaryScore,
        weight: 0.2,
        maxScore: 20, // 20% of 100
      },
      paymentHistory: {
        score: paymentHistoryScore,
        weight: 0.2,
        maxScore: 20, // 20% of 100
      },
      references: {
        score: referencesScore,
        weight: 0.15,
        maxScore: 15, // 15% of 100
      },
    },
  };
}

/**
 * Rental History Score (25% weight)
 * Formula: months_renting × 0.5
 * Penalty: -20 points per eviction
 */
function calculateRentalHistoryScore(
  rentalHistoryMonths: number,
  evictions: number
): number {
  // Base score: months × 0.5
  let score = rentalHistoryMonths * 0.5;
  
  // Penalty: -20 points per eviction
  score -= evictions * 20;

  // Return score (will be multiplied by 0.25 weight later)
  return Math.max(0, score);
}

/**
 * Employment Status Score (20% weight)
 * - Employed: 20 points
 * - Self-employed: 15 points
 * - Student: 10 points
 * - Unemployed: 0 points
 */
function calculateEmploymentScore(
  employmentStatus: "employed" | "self-employed" | "student" | "unemployed"
): number {
  switch (employmentStatus) {
    case "employed":
      return 20;
    case "self-employed":
      return 15;
    case "student":
      return 10;
    case "unemployed":
      return 0;
    default:
      return 0;
  }
}

/**
 * Annual Salary Score (20% weight)
 * Formula: salary / 1000
 * Capped at 20 points maximum
 */
function calculateSalaryScore(annualSalary: number): number {
  // Convert salary to points: salary / 1000
  // Cap at 20 points maximum
  const score = annualSalary / 1000;
  return Math.min(20, Math.max(0, score));
}

/**
 * Payment History Score (20% weight)
 * Formula: (on_time_payments / total_payments) × 20
 */
function calculatePaymentHistoryScore(
  onTimePayments: number,
  latePayments: number
): number {
  const totalPayments = onTimePayments + latePayments;

  // No payment history yet
  if (totalPayments === 0) {
    return 0; // No points if no payment history
  }

  // Calculate: (on_time_payments / total_payments) × 20
  const onTimeRatio = onTimePayments / totalPayments;
  return onTimeRatio * 20;
}

/**
 * References Score (15% weight)
 * Formula: (positive_refs / total_refs) × 15
 */
function calculateReferencesScore(
  positiveReferences: number,
  negativeReferences: number
): number {
  const totalReferences = positiveReferences + negativeReferences;

  // No references yet
  if (totalReferences === 0) {
    return 0; // No points if no references
  }

  // Calculate: (positive_refs / total_refs) × 15
  const positiveRatio = positiveReferences / totalReferences;
  return positiveRatio * 15;
}

/**
 * Get score tier and recommendation
 */
export function getTenantScoreTier(
  score: number
): {
  tier: "excellent" | "good" | "fair" | "poor";
  label: string;
  recommendation: string;
} {
  if (score >= 85) {
    return {
      tier: "excellent",
      label: "Excellent Tenant",
      recommendation:
        "Highly trusted. Landlords prioritize applications from tenants with this score.",
    };
  } else if (score >= 70) {
    return {
      tier: "good",
      label: "Good Tenant",
      recommendation:
        "Reliable. Most landlords will consider your application positively.",
    };
  } else if (score >= 50) {
    return {
      tier: "fair",
      label: "Fair Tenant",
      recommendation:
        "Building history. Focus on maintaining consistent payments and employment.",
    };
  } else {
    return {
      tier: "poor",
      label: "Building Trust",
      recommendation:
        "New to the platform. Build your rental history and payment record to improve.",
    };
  }
}
