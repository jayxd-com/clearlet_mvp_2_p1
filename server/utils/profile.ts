import { users, userProfiles } from "../../drizzle/schema";

export function isProfileComplete(user: typeof users.$inferSelect, profile: typeof userProfiles.$inferSelect | null): boolean {
  console.log('Profile Testing Start', user, profile);
  if (!user || !profile) return false;

  // Basic User Info
  if (!user.name || user.name.trim() === "") return false;
  if (!user.phone || user.phone.trim() === "") return false;

  // Profile Personal Info
  if (!profile.dniNie || profile.dniNie.trim() === "") return false;
  if (!profile.bio || profile.bio.trim() === "") return false;

  // Profile Location
  if (!profile.address || profile.address.trim() === "") return false;
  if (!profile.city || profile.city.trim() === "") return false;
  // if (!profile.country || profile.country.trim() === "") return false; // Relaxed check

  return true;
}
