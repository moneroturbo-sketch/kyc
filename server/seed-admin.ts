import { db } from "./db";
import { users, wallets } from "@shared/schema";
import { hashPassword } from "./utils/bcrypt";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  console.log("Seeding admin user...");

  const existingUser = await db.select().from(users).where(eq(users.username, "Kai")).limit(1);
  
  if (existingUser.length > 0) {
    console.log("Admin user Kai already exists. Updating password and role...");
    const hashedPassword = await hashPassword("#387530Turbo");
    await db.update(users).set({ 
      role: "admin",
      password: hashedPassword 
    }).where(eq(users.username, "Kai"));
    
    const existingWallet = await db.select().from(wallets).where(eq(wallets.userId, existingUser[0].id)).limit(1);
    if (existingWallet.length === 0) {
      await db.insert(wallets).values({
        userId: existingUser[0].id,
        currency: "USDT",
      });
      console.log("Wallet created for Kai!");
    }
    
    console.log("Admin role and password updated!");
    process.exit(0);
  }

  const hashedPassword = await hashPassword("#387530Turbo");

  const [adminUser] = await db.insert(users).values({
    username: "Kai",
    email: "kai@admin.local",
    password: hashedPassword,
    role: "admin",
    emailVerified: true,
    isActive: true,
  }).returning();

  await db.insert(wallets).values({
    userId: adminUser.id,
    currency: "USDT",
  });

  console.log("Admin user Kai created successfully!");
  console.log("Username: Kai");
  console.log("Role: admin");
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Error seeding admin:", err);
  process.exit(1);
});
