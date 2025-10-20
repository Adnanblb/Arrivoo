import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  const adminEmail = "albalbisi77@gmail.com";
  const adminPassword = "123Adnan";

  try {
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("Admin user already exists");
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      hotelName: "System Administrator",
      role: "admin",
      hotelId: null, // Admin has no specific hotel
    });

    console.log("✅ Admin user created successfully!");
    console.log("Email:", adminEmail);
    console.log("Role: admin");
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedAdmin();
