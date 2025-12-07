import { db } from "./db";
import { 
  users, 
  kyc, 
  vendorProfiles, 
  wallets, 
  offers,
  exchanges
} from "@shared/schema";
import bcrypt from "bcrypt";

const exchangeNames = ["OKX", "Binance", "Bybit", "KuCoin", "Huobi", "Gate.io", "Bitfinex"];
const paymentMethods = ["Binance UID", "OKX UID", "Bybit UID", "MEXC UID", "KuCoin UID", "Wallet Address", "Bank Transfer"];
const countries = ["Nigeria", "Kenya", "Tanzania", "Ghana", "South Africa", "United States", "United Kingdom", "Germany"];

const verifiedVendorUsernames = [
  "CryptoKing",
  "FastTrader",
  "TrustVault",
  "SafeExchange",
  "PrimeDeals"
];

const regularUsernames = [
  "alex_trader",
  "maria_crypto",
  "john_deals",
  "sarah_buys",
  "mike_seller",
  "emma_trades",
  "david_coins",
  "lisa_exchange",
  "chris_p2p",
  "anna_markets",
  "james_wallet",
  "kate_trading",
  "tom_holder",
  "nina_crypto",
  "paul_deals"
];

async function seed() {
  console.log("Starting seed process...");
  
  try {
    const adminPassword = await bcrypt.hash("#487530Turbo", 10);
    const userPassword = await bcrypt.hash("Password123!", 10);
    
    console.log("Creating USDT exchange...");
    await db.insert(exchanges).values({
      name: "USDT",
      symbol: "USDT",
      description: "Tether USD Stablecoin",
      isActive: true,
      sortOrder: 0,
    }).onConflictDoNothing();
    console.log("Created USDT exchange");
    
    console.log("\n=== Creating Admin Account ===");
    const [adminUser] = await db.insert(users).values({
      username: "kai",
      email: "kai@admin.com",
      password: adminPassword,
      role: "admin",
      emailVerified: true,
      isActive: true,
      isFrozen: false,
      twoFactorEnabled: false,
      loginAttempts: 0,
    }).returning();
    console.log(`Created root admin: kai (password: #487530Turbo)`);
    
    await db.insert(wallets).values({
      userId: adminUser.id,
      currency: "USDT",
    });
    
    console.log("\n=== Creating 5 Verified Vendors with Tick Badges ===");
    const verifiedVendorIds: string[] = [];
    
    for (let i = 0; i < 5; i++) {
      const username = verifiedVendorUsernames[i];
      
      const [vendorUser] = await db.insert(users).values({
        username,
        email: `${username.toLowerCase()}@vendor.com`,
        password: userPassword,
        role: "vendor",
        emailVerified: true,
        isActive: true,
        isFrozen: false,
        twoFactorEnabled: false,
        loginAttempts: 0,
      }).returning();
      
      await db.insert(kyc).values({
        userId: vendorUser.id,
        tier: "tier2",
        status: "approved",
        idType: "passport",
        idNumber: `PASS${1000000 + i}`,
        idDocumentUrl: "/uploads/sample-id.jpg",
        selfieUrl: "/uploads/sample-selfie.jpg",
        faceMatchScore: "95.00",
        adminNotes: "Admin approved verified vendor",
      });
      
      const [vendorProfile] = await db.insert(vendorProfiles).values({
        userId: vendorUser.id,
        businessName: null,
        bio: `Verified trusted vendor - ${username}. Fast trades and secure transactions.`,
        country: countries[i % countries.length],
        subscriptionPlan: i < 2 ? "featured" : i < 4 ? "pro" : "basic",
        isApproved: true,
        totalTrades: 100 + Math.floor(Math.random() * 300),
        completedTrades: 95 + Math.floor(Math.random() * 250),
        cancelledTrades: Math.floor(Math.random() * 5),
        averageRating: (4.5 + Math.random() * 0.5).toFixed(2),
        totalRatings: 50 + Math.floor(Math.random() * 100),
        suspiciousActivityScore: 0,
      }).returning();
      
      verifiedVendorIds.push(vendorProfile.id);
      
      await db.insert(wallets).values({
        userId: vendorUser.id,
        currency: "USDT",
        availableBalance: (500 + Math.random() * 1000).toFixed(8),
        escrowBalance: (100 + Math.random() * 200).toFixed(8),
      });
      
      console.log(`Created verified vendor: ${username} (tick badge approved by admin)`);
    }
    
    console.log("\n=== Creating 7 Offers for Each Verified Vendor ===");
    for (let i = 0; i < 5; i++) {
      const vendorId = verifiedVendorIds[i];
      const username = verifiedVendorUsernames[i];
      
      for (let j = 0; j < 7; j++) {
        const isSellOffer = j % 2 === 0;
        const exchangeName = exchangeNames[j % exchangeNames.length];
        const basePrice = isSellOffer ? (120 + Math.random() * 30) : (100 + Math.random() * 25);
        
        await db.insert(offers).values({
          vendorId,
          type: isSellOffer ? "sell" : "buy",
          currency: "USDT",
          pricePerUnit: basePrice.toFixed(2),
          minLimit: (1000 + Math.random() * 2000).toFixed(2),
          maxLimit: (50000 + Math.random() * 150000).toFixed(2),
          availableAmount: (100 + Math.random() * 500).toFixed(2),
          paymentMethods: [paymentMethods[j % paymentMethods.length], paymentMethods[(j + 1) % paymentMethods.length]],
          terms: isSellOffer 
            ? `${exchangeName} verified account for sale. Level 2 KYC completed. Instant transfer.`
            : `Looking to buy verified ${exchangeName} account. Will pay premium for accounts with trading history.`,
          isActive: true,
          isPriority: j < 2,
        });
      }
      console.log(`Created 7 offers for verified vendor: ${username}`);
    }
    
    console.log("\n=== Creating 15 Regular Users ===");
    const regularUserIds: { id: string; username: string }[] = [];
    
    for (let i = 0; i < 15; i++) {
      const username = regularUsernames[i];
      
      const [regularUser] = await db.insert(users).values({
        username,
        email: `${username.toLowerCase().replace('_', '')}@user.com`,
        password: userPassword,
        role: "customer",
        emailVerified: true,
        isActive: true,
        isFrozen: false,
        twoFactorEnabled: false,
        loginAttempts: 0,
      }).returning();
      
      regularUserIds.push({ id: regularUser.id, username });
      
      await db.insert(wallets).values({
        userId: regularUser.id,
        currency: "USDT",
        availableBalance: (50 + Math.random() * 200).toFixed(8),
        escrowBalance: "0.00000000",
      });
      
      console.log(`Created regular user: ${username}`);
    }
    
    console.log("\n=== Seed Summary ===");
    console.log(`Total Users: 21 (1 admin + 5 verified vendors + 15 regular users)`);
    console.log(`\nRoot Admin Account:`);
    console.log(`  Username: kai`);
    console.log(`  Password: #487530Turbo`);
    console.log(`  Role: admin`);
    console.log(`\n5 Verified Vendors (with tick badges):`);
    verifiedVendorUsernames.forEach((name, i) => {
      console.log(`  ${i + 1}. ${name} - Approved by admin, tick badge enabled`);
    });
    console.log(`\nTotal Offers: 35 (7 per verified vendor)`);
    console.log(`  - Mix of buying and selling offers`);
    console.log(`  - Vendor usernames displayed on P2P marketplace`);
    console.log(`\nAll vendor/user accounts have password: Password123!`);
    console.log("\nSeed completed successfully!");
    
  } catch (error) {
    console.error("Seed error:", error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
