import { storage } from "../storage";

export async function holdEscrow(
  vendorId: string,
  amount: string,
  orderId: string
): Promise<void> {
  const vendorProfile = await storage.getVendorProfile(vendorId);
  if (!vendorProfile) {
    throw new Error("Vendor not found");
  }

  const wallet = await storage.getWalletByUserId(vendorProfile.userId, "USDT");
  if (!wallet) {
    throw new Error("Vendor wallet not found");
  }

  const availableBalance = parseFloat(wallet.availableBalance);
  const holdAmount = parseFloat(amount);

  if (availableBalance < holdAmount) {
    throw new Error("Insufficient balance");
  }

  await storage.holdEscrow(wallet.id, amount);

  await storage.createTransaction({
    userId: vendorProfile.userId,
    walletId: wallet.id,
    type: "escrow_hold",
    amount,
    currency: "USDT",
    relatedOrderId: orderId,
    description: `Escrow hold for order ${orderId}`,
  });
}

export async function releaseEscrow(
  vendorId: string,
  buyerId: string,
  amount: string,
  orderId: string
): Promise<void> {
  const vendorProfile = await storage.getVendorProfile(vendorId);
  if (!vendorProfile) {
    throw new Error("Vendor not found");
  }

  const vendorWallet = await storage.getWalletByUserId(vendorProfile.userId, "USDT");
  if (!vendorWallet) {
    throw new Error("Vendor wallet not found");
  }

  await storage.releaseEscrow(vendorWallet.id, amount);

  await storage.createTransaction({
    userId: vendorProfile.userId,
    walletId: vendorWallet.id,
    type: "escrow_release",
    amount,
    currency: "USDT",
    relatedOrderId: orderId,
    description: `Escrow released for order ${orderId}`,
  });

  const buyerWallet = await storage.getWalletByUserId(buyerId, "USDT");
  if (buyerWallet) {
    const newBalance = (parseFloat(buyerWallet.availableBalance) + parseFloat(amount)).toFixed(8);
    await storage.updateWalletBalance(buyerWallet.id, newBalance, buyerWallet.escrowBalance);

    await storage.createTransaction({
      userId: buyerId,
      walletId: buyerWallet.id,
      type: "escrow_release",
      amount,
      currency: "USDT",
      relatedOrderId: orderId,
      description: `Received from order ${orderId}`,
    });
  }
}

export async function refundEscrow(
  vendorId: string,
  amount: string,
  orderId: string
): Promise<void> {
  const vendorProfile = await storage.getVendorProfile(vendorId);
  if (!vendorProfile) {
    throw new Error("Vendor not found");
  }

  const vendorWallet = await storage.getWalletByUserId(vendorProfile.userId, "USDT");
  if (!vendorWallet) {
    throw new Error("Vendor wallet not found");
  }

  const newEscrow = (parseFloat(vendorWallet.escrowBalance) - parseFloat(amount)).toFixed(8);
  const newAvailable = (parseFloat(vendorWallet.availableBalance) + parseFloat(amount)).toFixed(8);
  
  await storage.updateWalletBalance(vendorWallet.id, newAvailable, newEscrow);

  await storage.createTransaction({
    userId: vendorProfile.userId,
    walletId: vendorWallet.id,
    type: "refund",
    amount,
    currency: "USDT",
    relatedOrderId: orderId,
    description: `Refund for disputed order ${orderId}`,
  });
}
