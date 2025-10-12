import { db } from "./db";
import { hotels, pmsConfigurations, registrationContracts, users } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create a test hotel
    const [hotel] = await db
      .insert(hotels)
      .values({
        name: "Grand Plaza Hotel",
        address: "123 Main Street, New York, NY 10001",
        phone: "+1 (555) 123-4567",
        email: "info@grandplaza.com",
      })
      .returning();

    console.log("✅ Created hotel:", hotel.name);

    // Create PMS configuration for the hotel
    await db.insert(pmsConfigurations).values({
      hotelId: hotel.id,
      pmsType: "opera_cloud",
      apiEndpoint: "https://api.opera-cloud.com/v1",
      credentials: {
        apiKey: "demo-api-key",
        hotelId: hotel.id,
      },
      isActive: true,
    });

    console.log("✅ Created PMS configuration (Opera Cloud)");

    // Create sample registration contracts
    const sampleContracts = [
      {
        hotelId: hotel.id,
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
        hotelId: hotel.id,
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
        hotelId: hotel.id,
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

    // Create admin and hotel staff users
    await db.insert(users).values([
      {
        username: "admin@hotel.com",
        password: "password", // In production, this should be hashed
        role: "admin",
        hotelId: null,
      },
      {
        username: "hotel@hotel.com",
        password: "password", // In production, this should be hashed
        role: "hotel_staff",
        hotelId: hotel.id,
      },
    ]);

    console.log("✅ Created admin and hotel staff users");

    console.log("\n✨ Seeding completed successfully!");
    console.log("\nTest credentials:");
    console.log("  Admin: admin@hotel.com / password");
    console.log("  Hotel Staff: hotel@hotel.com / password");
    console.log(`\nHotel ID: ${hotel.id}`);
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
