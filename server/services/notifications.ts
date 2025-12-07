import { storage } from "../storage";
import type { InsertNotification } from "@shared/schema";

export async function createNotification(
  userId: string,
  type: InsertNotification["type"],
  title: string,
  message: string,
  link?: string,
  metadata?: any
): Promise<void> {
  await storage.createNotification({
    userId,
    type,
    title,
    message,
    link,
    metadata,
  });
}

export async function notifyOrderCreated(orderId: string, buyerId: string, vendorId: string): Promise<void> {
  const vendorProfile = await storage.getVendorProfile(vendorId);
  if (vendorProfile) {
    await createNotification(
      vendorProfile.userId,
      "order",
      "New Order",
      "You have received a new order",
      `/order/${orderId}`
    );
  }
}

export async function notifyOrderPaid(orderId: string, vendorId: string): Promise<void> {
  const vendorProfile = await storage.getVendorProfile(vendorId);
  if (vendorProfile) {
    await createNotification(
      vendorProfile.userId,
      "payment",
      "Payment Marked",
      "Buyer has marked the payment as sent",
      `/order/${orderId}`
    );
  }
}

export async function notifyOrderCompleted(orderId: string, buyerId: string): Promise<void> {
  await createNotification(
    buyerId,
    "order",
    "Order Completed",
    "Your order has been completed successfully",
    `/order/${orderId}`
  );
}

export async function notifyDisputeOpened(orderId: string, userId: string): Promise<void> {
  await createNotification(
    userId,
    "dispute",
    "Dispute Opened",
    "A dispute has been opened for your order",
    `/order/${orderId}`
  );
}
