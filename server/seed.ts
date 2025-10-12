import { db } from "./db";
import { hotels, pmsConfigurations, registrationContracts, users } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create Rosewood Jeddah hotel
    const [rosewoodHotel] = await db
      .insert(hotels)
      .values({
        name: "Rosewood Jeddah",
        address: "Jeddah, Saudi Arabia",
        phone: "+966 12 123 4567",
        email: "Albalbisi11@gmail.com",
        logoUrl: null, // TODO: Add actual logo URL
      })
      .returning();

    console.log("✅ Created hotel:", rosewoodHotel.name);
    
    // Create Grand Plaza Hotel for testing
    const [grandPlazaHotel] = await db
      .insert(hotels)
      .values({
        name: "Grand Plaza Hotel",
        address: "123 Main Street, New York, NY 10001",
        phone: "+1 (555) 123-4567",
        email: "info@grandplaza.com",
        logoUrl: null,
      })
      .returning();

    console.log("✅ Created hotel:", grandPlazaHotel.name);

    // Create PMS configurations
    await db.insert(pmsConfigurations).values([
      {
        hotelId: rosewoodHotel.id,
        pmsType: "opera_cloud",
        apiEndpoint: "https://api.opera-cloud.com/v1",
        credentials: {
          apiKey: "demo-api-key",
          hotelId: rosewoodHotel.id,
        },
        isActive: true,
      },
      {
        hotelId: grandPlazaHotel.id,
        pmsType: "opera_cloud",
        apiEndpoint: "https://api.opera-cloud.com/v1",
        credentials: {
          apiKey: "demo-api-key",
          hotelId: grandPlazaHotel.id,
        },
        isActive: true,
      }
    ]);

    console.log("✅ Created PMS configurations (Opera Cloud)");

    // Create sample registration contracts for Grand Plaza
    const sampleContracts = [
      {
        hotelId: grandPlazaHotel.id,
        guestName: "John Smith",
        email: "john.smith@email.com",
        phone: "+1 (555) 111-2222",
        address: "456 Oak Ave, Boston, MA",
        idNumber: "P12345678",
        reservationNumber: "RES-2024-001",
        confirmationNumber: "RES-2024-001",
        roomNumber: "Suite 302",
        roomType: "Deluxe Suite",
        arrivalDate: "2024-10-12",
        departureDate: "2024-10-15",
        numberOfNights: 3,
        numberOfGuests: 2,
        signatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        pmsSource: "opera_cloud",
        status: "completed",
      },
      {
        hotelId: grandPlazaHotel.id,
        guestName: "Sarah Johnson",
        email: "sarah.j@email.com",
        phone: "+1 (555) 333-4444",
        address: "789 Elm Street, Chicago, IL",
        idNumber: "DL987654321",
        reservationNumber: "RES-2024-002",
        confirmationNumber: "RES-2024-002",
        roomNumber: "Room 215",
        roomType: "Standard King",
        arrivalDate: "2024-10-12",
        departureDate: "2024-10-14",
        numberOfNights: 2,
        numberOfGuests: 1,
        signatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        pmsSource: "opera_cloud",
        status: "completed",
      },
      {
        hotelId: grandPlazaHotel.id,
        guestName: "Michael Chen",
        email: "m.chen@email.com",
        phone: "+1 (555) 555-6666",
        address: "321 Pine Rd, San Francisco, CA",
        idNumber: "P87654321",
        reservationNumber: "RES-2024-003",
        confirmationNumber: "RES-2024-003",
        roomNumber: "Room 410",
        roomType: "Superior Double",
        arrivalDate: "2024-10-11",
        departureDate: "2024-10-16",
        numberOfNights: 5,
        numberOfGuests: 2,
        signatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        pmsSource: "opera_cloud",
        status: "completed",
      },
    ];

    for (const contract of sampleContracts) {
      await db.insert(registrationContracts).values(contract);
    }

    console.log(`✅ Created ${sampleContracts.length} sample registration contracts`);

    // Create user accounts with properly hashed passwords
    const rosewoodPassword = await hashPassword("Rosewood@990");
    const testPassword = await hashPassword("password");
    
    await db.insert(users).values([
      {
        email: "Albalbisi11@gmail.com",
        password: rosewoodPassword,
        hotelName: "Rosewood Jeddah",
        role: "hotel_staff",
        hotelId: rosewoodHotel.id,
        logoUrl: null,
        twoFactorEnabled: false,
      },
      {
        email: "admin@hotel.com",
        password: testPassword,
        hotelName: "Arrivo Admin",
        role: "admin",
        hotelId: null,
        logoUrl: null,
        twoFactorEnabled: false,
      },
      {
        email: "hotel@hotel.com",
        password: testPassword,
        hotelName: "Grand Plaza Hotel",
        role: "hotel_staff",
        hotelId: grandPlazaHotel.id,
        logoUrl: null,
        twoFactorEnabled: false,
      },
    ]);

    console.log("✅ Created user accounts");

    console.log("\n✨ Seeding completed successfully!");
    console.log("\nLogin credentials:");
    console.log("  Rosewood Jeddah: Albalbisi11@gmail.com / Rosewood@990");
    console.log("  Admin: admin@hotel.com / password");
    console.log("  Grand Plaza: hotel@hotel.com / password");
    console.log(`\nRosewood Hotel ID: ${rosewoodHotel.id}`);
    console.log(`Grand Plaza Hotel ID: ${grandPlazaHotel.id}`);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seed()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
