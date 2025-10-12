# Hotel PMS Integration Guide

## Overview

Arrivo is currently using **mock data** for testing. To connect to your real hotel PMS system, you need to:

1. Get API credentials from your PMS provider
2. Update the database with your credentials
3. Replace mock code with real API calls
4. Test the connection

---

## Step 1: Get API Credentials

Contact your PMS provider and request API access:

### Opera Cloud (Oracle Hospitality)
- API Endpoint: `https://api.opera-cloud.com/v1` (or your region-specific endpoint)
- Client ID / API Key
- Client Secret
- Hotel ID (Property Code)
- Chain Code (if applicable)

**Documentation:** https://docs.oracle.com/en/industries/hospitality/opera-cloud-services/

### Protel
- API Endpoint: Your hotel's Protel server URL
- Username
- Password  
- Property ID

**Documentation:** https://developer.protel.io/

### Cloudbeds
- API Endpoint: `https://api.cloudbeds.com/api/v1.2`
- Client ID
- Client Secret
- Property ID

**Documentation:** https://hotels.cloudbeds.com/api/docs/

---

## Step 2: Add Credentials to Database

### Update existing configuration:

```sql
-- Update Opera Cloud credentials for Grand Plaza Hotel
UPDATE pms_configurations
SET credentials = '{
  "apiKey": "YOUR_ACTUAL_API_KEY",
  "apiSecret": "YOUR_ACTUAL_API_SECRET",
  "hotelId": "YOUR_HOTEL_PROPERTY_CODE"
}'::json
WHERE hotel_id = '89e84b73-cca7-4bd4-9dba-af421b2805f6'
AND pms_type = 'opera_cloud';
```

### Or insert new configuration:

```sql
INSERT INTO pms_configurations (hotel_id, pms_type, api_endpoint, credentials, is_active)
VALUES (
  '89e84b73-cca7-4bd4-9dba-af421b2805f6',
  'opera_cloud',
  'https://api.opera-cloud.com/v1',
  '{"apiKey": "YOUR_KEY", "apiSecret": "YOUR_SECRET", "hotelId": "YOUR_HOTEL_ID"}'::json,
  true
);
```

---

## Step 3: Update Connector Code

The PMS connectors are located in `server/pms/connectors/`. Currently they return mock data. You need to replace the mock code with real API calls.

### Example: Opera Cloud Connector

**File:** `server/pms/connectors/opera-cloud.ts`

**Current (Mock):**
```typescript
async lookupReservation(confirmationNumber: string): Promise<PmsReservation | null> {
  // Mock data
  return {
    guestName: "John Doe",
    reservationNumber: confirmationNumber,
    // ... fake data
  };
}
```

**Update to Real API:**
```typescript
async lookupReservation(confirmationNumber: string): Promise<PmsReservation | null> {
  try {
    // Make actual API call to Opera Cloud
    const response = await fetch(
      `${this.apiEndpoint}/reservations/${confirmationNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'x-app-key': this.hotelId,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Transform Opera Cloud response to Arrivo format
    return {
      guestName: data.guestDetails.name,
      reservationNumber: data.confirmationNumber,
      confirmationNumber: data.confirmationNumber,
      arrivalDate: data.checkInDate,
      departureDate: data.checkOutDate,
      roomType: data.roomType,
      roomNumber: data.roomNumber,
      numberOfNights: data.numberOfNights,
      email: data.guestDetails.email,
      phone: data.guestDetails.phone,
      numberOfGuests: data.numberOfGuests,
      specialRequests: data.specialRequests,
    };
  } catch (error) {
    console.error("Opera Cloud lookup error:", error);
    return null;
  }
}
```

**Update getArrivals() similarly:**
```typescript
async getArrivals(date: Date): Promise<PmsArrival[]> {
  try {
    const dateStr = date.toISOString().split('T')[0];
    
    // Call Opera Cloud arrivals API
    const response = await fetch(
      `${this.apiEndpoint}/arrivals?date=${dateStr}&hotelId=${this.hotelId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'x-app-key': this.hotelId,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch arrivals:", response.status);
      return [];
    }

    const data = await response.json();
    
    // Transform Opera Cloud arrivals to Arrivo format
    return data.reservations.map((res: any) => ({
      reservationNumber: res.confirmationNumber,
      guestName: res.guestName,
      email: res.guestEmail,
      phoneNumber: res.guestPhone,
      address: res.guestAddress,
      roomType: res.roomType,
      roomNumber: res.roomNumber,
      checkInDate: res.arrivalDate,
      checkOutDate: res.departureDate,
      numberOfNights: res.numberOfNights,
      estimatedArrivalTime: res.estimatedArrival,
    }));
  } catch (error) {
    console.error("Opera Cloud getArrivals error:", error);
    return [];
  }
}
```

---

## Step 4: Test Connection

After updating the connector code:

1. **Restart the application** (it auto-restarts when you save files)

2. **Test manual lookup:**
   - Go to Hotel Dashboard → Manual Check-in
   - Enter a real confirmation number from your PMS
   - Verify it fetches actual guest data

3. **Test automatic sync:**
   - Wait for the hourly sync to run (or restart the server to trigger immediate sync)
   - Check the arrivals: `SELECT * FROM arrivals WHERE hotel_id = 'YOUR_HOTEL_ID';`
   - Verify real arrival data is synced

4. **Check logs:**
   - Look for API errors in the console
   - Verify authentication is working
   - Check that data is being transformed correctly

---

## Important Notes

### 🔒 Security Considerations

**IMPORTANT:** API credentials are currently stored in the database. For production:

1. **Use Environment Variables** for sensitive credentials:
   ```bash
   OPERA_CLOUD_API_KEY=your_key_here
   OPERA_CLOUD_API_SECRET=your_secret_here
   ```

2. **Encrypt credentials** in the database using a library like `crypto`

3. **Use Replit Secrets** for API keys instead of hardcoding

4. **Implement rate limiting** to avoid API quota issues

### 🌐 API Rate Limits

Most PMS systems have rate limits:
- Opera Cloud: ~1000 requests/hour
- Protel: Varies by plan
- Cloudbeds: ~500 requests/hour

The hourly sync is designed to stay within these limits.

### 🔄 Data Mapping

Each PMS returns data in different formats. You'll need to:
1. Study your PMS API documentation
2. Map their field names to Arrivo's format
3. Handle missing or optional fields
4. Test with real data

---

## Need Help?

If you need assistance:
1. Check your PMS provider's API documentation
2. Test API calls using Postman or curl first
3. Look at API response examples to understand the data structure
4. Reach out to your PMS provider's developer support

---

## Quick Start Example

Here's a minimal example to test your Opera Cloud connection:

```typescript
// Test connection manually
async function testOperaConnection() {
  const response = await fetch('https://api.opera-cloud.com/v1/health', {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'x-app-key': 'YOUR_HOTEL_ID'
    }
  });
  
  console.log('Connection test:', response.ok ? 'SUCCESS' : 'FAILED');
}
```

Once this works, you can implement the full lookup and arrivals methods.
