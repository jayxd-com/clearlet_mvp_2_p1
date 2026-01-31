import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../drizzle/schema";
import { userProfiles } from "../drizzle/schema";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { awardOwnerForActivity, awardUserForActivity } from "../server/owner-earnings-service";
import { REWARD_AMOUNTS } from "../server/config/rewards";
import { closeDb, createNotification } from "../server/db";
import { sendWelcomeEmail } from "../server/email-service";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  endpoint: process.env.AWS_ENDPOINT || undefined,
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
});

async function uploadSeederImage(filename: string): Promise<string | null> {
  const filePath = path.resolve(__dirname, `../seederData/property/${filename}`);
  if (!fs.existsSync(filePath)) {
    // console.warn(`Image not found: ${filename}, skipping upload.`);
    return null;
  }

  try {
    const fileContent = fs.readFileSync(filePath);
    const key = `uploads/properties/seeder/${filename}`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: "image/jpeg",
      ACL: "public-read",
    }));

    // Construct public URL
    const endpoint = process.env.PUBLIC_S3_ENDPOINT || process.env.AWS_ENDPOINT || "http://localhost:9000";
    if (process.env.S3_FORCE_PATH_STYLE === "true") {
        return `${endpoint}/${process.env.AWS_BUCKET_NAME}/${key}`;
    }
    return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error(`Failed to upload ${filename}:`, error);
    return null;
  }
}

const PASSWORD_HASH = await bcrypt.hash("password", 10);

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    const DATABASE_URL = process.env.DATABASE_URL || "";
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection, { schema, mode: "default" });

    // Clear existing data (optional, but good for fresh seeds)
    console.log("🗑️ Clearing existing data...");
    await db.delete(schema.users);
    await db.delete(schema.properties);
    await db.delete(schema.clearCoinWallets);
    await db.delete(schema.clearCoinTransactions);
    // Add other tables to clear if needed

    console.log("👑 Creating mock admin user...");
    await db.insert(schema.users).values({
      email: "admin@clearlet.demo",
      name: "Admin User",
      passwordHash: PASSWORD_HASH,
      role: "admin",
      userType: "admin",
      verificationStatus: "verified",
      isSuperAdmin: true,
    });

    console.log("📝 Creating landlord user...");
    await db.insert(schema.users).values({
      email: "landlord@example.com",
      name: "John Property Owner",
      passwordHash: PASSWORD_HASH,
      role: "user",
      userType: "landlord",
      verificationStatus: "verified",
    });

    console.log("👥 Creating tenant users...");
    await db.insert(schema.users).values([
      {
        email: "tenant@example.com",
        name: "Sarah Johnson",
        passwordHash: PASSWORD_HASH,
        role: "user",
        userType: "tenant",
        verificationStatus: "unverified",
      },
      {
        email: "marco.rodriguez@example.com",
        name: "Marco Rodriguez",
        passwordHash: PASSWORD_HASH,
        role: "user",
        userType: "tenant",
        verificationStatus: "pending",
      },
      {
        email: "emma.wilson@example.com",
        name: "Emma Wilson",
        passwordHash: PASSWORD_HASH,
        role: "user",
        userType: "tenant",
        verificationStatus: "verified",
      },
    ]);

    console.log("👤 Creating user profiles...");
    const allUsers = await db.select().from(schema.users);
    for (const user of allUsers) {
      await db.insert(schema.userProfiles).values({
        userId: user.id,
        verificationScore: user.verificationStatus === 'verified' ? 100 : 0,
        tenantScore: 0,
        bio: `Hello, I'm ${user.name}`,
      });

      // Simulate Signup Rewards
      if (user.role === 'user') { // Only award for regular users, not the admin seed
         // Award ClearCoins to owner for new signup
         await awardOwnerForActivity({
            activityType: "USER_SIGNUP",
            amount: REWARD_AMOUNTS.USER_SIGNUP,
            description: `New user signup: ${user.name} (${user.userType})`,
            relatedUserId: user.id,
          });
  
          // Award ClearCoins to the user for signing up
          await awardUserForActivity({
            userId: user.id,
            activityType: "USER_SIGNUP",
            amount: REWARD_AMOUNTS.USER_SIGNUP,
            description: "Welcome bonus for signing up!",
          });
          
          // Notify user about the reward
          await createNotification({
            userId: user.id,
            type: "system",
            title: "Welcome Bonus!",
            message: `You've earned +${REWARD_AMOUNTS.USER_SIGNUP} ClearCoins for joining ClearLet.`,
            link: "/tenant/wallet",
          });

          // Send Welcome Email
          await sendWelcomeEmail(user.email, user.name, "en");

          console.log(`💰 Awarded signup bonus and sent welcome email to ${user.name}`);
      }
    }

    // Get the landlord's ID to associate properties
    const landlordUser = await db.query.users.findFirst({
      where: eq(schema.users.email, "landlord@example.com"),
    });

    if (landlordUser) {
      console.log("🏡 Creating sample properties with uploaded images...");
      
      // Upload images for Property 1
      const prop1Images = [];
      for (let i = 1; i <= 5; i++) {
        const url = await uploadSeederImage(`property_1_${i}.jpg`);
        if (url) prop1Images.push(url);
      }
      if (prop1Images.length === 0) prop1Images.push("https://images.unsplash.com/photo-1580587771525-78b9dba38a72?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");

      // Upload images for Property 2
      const prop2Images = [];
      for (let i = 1; i <= 5; i++) {
        const url = await uploadSeederImage(`property_2_${i}.jpg`);
        if (url) prop2Images.push(url);
      }
      if (prop2Images.length === 0) prop2Images.push("https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");

      // Upload images for Property 3
      const prop3Images = [];
      for (let i = 1; i <= 5; i++) {
        const url = await uploadSeederImage(`property_3_${i}.jpg`);
        if (url) prop3Images.push(url);
      }
      if (prop3Images.length === 0) prop3Images.push("https://images.unsplash.com/photo-1502672260266-b81ee1814a2e?q=80&w=2874&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");

      // Upload images for Property 4
      const prop4Images = [];
      for (let i = 1; i <= 5; i++) {
        const url = await uploadSeederImage(`property_4_${i}.jpg`);
        if (url) prop4Images.push(url);
      }
      if (prop4Images.length === 0) prop4Images.push("https://images.unsplash.com/photo-1568605114243-e2277c40e15b?q=80&w=2940&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D");

      await db.insert(schema.properties).values([
        {
          userId: landlordUser.id,
          title: "Sunny Apartment in Barcelona",
          description: "Beautiful 2-bedroom apartment with a view of Sagrada Familia.",
          address: "Carrer de Mallorca 401",
          city: "Barcelona",
          country: "Spain",
          zipCode: "08013",
          latitude: "41.4036",
          longitude: "2.1744",
          bedrooms: 2,
          bathrooms: 1,
          squareFeet: 850,
          rentPrice: 120000, // €1200.00 in cents
          currency: "EUR",
          amenities: ["balcony", "air_conditioning", "furnished"],
          images: prop1Images,
          status: "active",
          verifiedLandlord: true,
          allowPets: false,
        },
        {
          userId: landlordUser.id,
          title: "Modern Flat in Madrid Center",
          description: "Spacious 3-bedroom flat, recently renovated, close to Plaza Mayor.",
          address: "Calle Mayor 1",
          city: "Madrid",
          country: "Spain",
          zipCode: "28013",
          latitude: "40.4168",
          longitude: "-3.7038",
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1100,
          rentPrice: 180000, // €1800.00 in cents
          currency: "EUR",
          amenities: ["elevator", "heating", "unfurnished"],
          images: prop2Images,
          status: "active",
          verifiedLandlord: true,
          allowPets: true,
          petDeposit: 50000, // €500.00
          petRestrictions: "Small pets only",
        },
        {
          userId: landlordUser.id,
          title: "Cozy Studio in Valencia",
          description: "Compact and efficient studio apartment, perfect for students.",
          address: "Plaça de la Reina 1",
          city: "Valencia",
          country: "Spain",
          zipCode: "46001",
          latitude: "39.4700",
          longitude: "-0.3763",
          bedrooms: 0, // Studio
          bathrooms: 1,
          squareFeet: 350,
          rentPrice: 75000, // €750.00 in cents
          currency: "EUR",
          amenities: ["furnished", "wifi"],
          images: prop3Images,
          status: "pending_verification",
          verifiedLandlord: false,
          allowPets: false,
        },
        {
          userId: landlordUser.id,
          title: "Luxury Villa in Marbella",
          description: "Exclusive villa with private pool and sea views.",
          address: "Urbanización Sierra Blanca",
          city: "Marbella",
          country: "Spain",
          zipCode: "29602",
          latitude: "36.5113",
          longitude: "-4.8916",
          bedrooms: 5,
          bathrooms: 4,
          squareFeet: 3000,
          rentPrice: 500000, // €5000.00 in cents
          currency: "EUR",
          amenities: ["pool", "garden", "garage", "sea_view"],
          images: prop4Images,
          status: "active",
          verifiedLandlord: true,
          allowPets: false,
        },
      ]);
      console.log("🏡 Sample properties created.");
    } else {
      console.warn("Landlord user not found, skipping property creation.");
    }

    console.log("✅ Database seed completed successfully!");
    await connection.end();
    await closeDb();
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
