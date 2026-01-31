import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuth } from "@/hooks/useAuth";

/**
 * OnboardingTour - Interactive guided tour for new users
 * Provides role-specific walkthroughs for Admin, Landlord, and Tenant accounts
 */

interface TourStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
  };
}

// Admin Tour Steps
const adminTourSteps: TourStep[] = [
  {
    element: "#dashboard-overview",
    popover: {
      title: "👋 Welcome to ClearLet Admin Dashboard",
      description: "As an admin, you have full access to platform management, analytics, and user oversight. Let's take a quick tour!",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#stats-cards",
    popover: {
      title: "📊 Platform Statistics",
      description: "Monitor key metrics including total users, active properties, pending applications, and active contracts at a glance.",
      side: "bottom",
    },
  },
  {
    element: "#sidebar-users",
    popover: {
      title: "👥 User Management",
      description: "Access the user management section to view all registered users, manage roles, and monitor account activity.",
      side: "bottom",
    },
  },
];

// Landlord Tour Steps
const landlordTourSteps: TourStep[] = [
  {
    element: "#dashboard-overview",
    popover: {
      title: "👋 Welcome to Your Landlord Dashboard",
      description: "Manage your properties, review tenant applications, and handle contracts all in one place. Let's explore!",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#properties-section",
    popover: {
      title: "🏠 Your Properties",
      description: "View all your listed properties, add new listings, edit details, and manage availability status.",
      side: "bottom",
    },
  },

  {
    element: "#add-property-button",
    popover: {
      title: "➕ Add New Property",
      description: "Ready to list a new property? Click here to create a new listing with photos, details, and rental terms.",
      side: "left",
    },
  },
];

// Tenant Tour Steps
const tenantTourSteps: TourStep[] = [
  {
    element: "#dashboard-overview",
    popover: {
      title: "👋 Welcome to Your Tenant Dashboard",
      description: "Search for properties, submit applications, and manage your rental journey. Let's get started!",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#search-properties",
    popover: {
      title: "🔍 Search Properties",
      description: "Browse available properties using filters like location, budget, move-in date, and property features.",
      side: "bottom",
    },
  },

];

export function OnboardingTour() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Check if user has already seen the tour
    const tourKey = `tour_completed_${user.id}`;
    const hasSeenTour = localStorage.getItem(tourKey);

    if (hasSeenTour) return;

    // Determine which tour to show based on user type
    let tourSteps: TourStep[] = [];
    
    if (user.role === "admin" || user.userType === "admin") {
      tourSteps = adminTourSteps;
    } else if (user.userType === "landlord") {
      tourSteps = landlordTourSteps;
    } else if (user.userType === "tenant") {
      tourSteps = tenantTourSteps;
    }

    if (tourSteps.length === 0) return;

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const driverObj = driver({
        showProgress: true,
        steps: tourSteps,
        onDestroyStarted: () => {
          // Mark tour as completed when user closes it
          localStorage.setItem(tourKey, "true");
          driverObj.destroy();
        },
        popoverClass: "driverjs-theme",
        progressText: "{{current}} of {{total}}",
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Got it! ✓",
      });

      driverObj.drive();
    }, 1000); // Delay to ensure DOM elements are rendered

    return () => clearTimeout(timer);
  }, [user]);

  return null; // This component doesn't render anything
}

/**
 * Function to manually trigger the tour (can be called from a button)
 */
export function startTour(userType: "admin" | "landlord" | "tenant") {
  let tourSteps: TourStep[] = [];
  
  if (userType === "admin") {
    tourSteps = adminTourSteps;
  } else if (userType === "landlord") {
    tourSteps = landlordTourSteps;
  } else if (userType === "tenant") {
    tourSteps = tenantTourSteps;
  }

  if (tourSteps.length === 0) return;

  const driverObj = driver({
    showProgress: true,
    steps: tourSteps,
    onDestroyStarted: () => {
      driverObj.destroy();
    },
    popoverClass: "driverjs-theme",
    progressText: "{{current}} of {{total}}",
    nextBtnText: "Next →",
    prevBtnText: "← Back",
    doneBtnText: "Got it! ✓",
  });

  driverObj.drive();
}
