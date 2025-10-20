import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function resetAdminPassword() {
  const email = 'albalbisi77@gmail.com';
  const newPassword = 'Admin@123'; // Temporary password
  
  console.log(`🔑 Resetting password for ${email}...`);
  
  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  // Update the user
  const result = await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, email))
    .returning();
  
  if (result.length > 0) {
    console.log('✅ Password reset successfully!');
    console.log(`\n📧 Email: ${email}`);
    console.log(`🔐 New Password: ${newPassword}`);
    console.log(`\n⚠️  IMPORTANT: Change this password after logging in!`);
  } else {
    console.log('❌ User not found');
  }
  
  process.exit(0);
}

resetAdminPassword();
