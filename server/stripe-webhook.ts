import { Request, Response } from "express";
import Stripe from "stripe";
import { ENV } from "./env";
import { getDb } from "./db";
import { payments, contracts } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyPaymentCompleted } from "./notifications-service";

const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2023-10-16" as any,
});

const webhookSecret = ENV.stripeWebhookSecret;

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    // Stripe webhook middleware typically provides raw body, but we need to ensure express provides it
    // In index.ts, we must use express.raw({ type: 'application/json' }) for this route
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error processing event: ${err.message}`);
    res.status(500).send("Internal Server Error");
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe Webhook] PaymentIntent succeeded: ${paymentIntent.id}`);
  
  const contractIdStr = paymentIntent.metadata?.contractId;
  const tenantIdStr = paymentIntent.metadata?.tenantId;
  
  if (!contractIdStr || !tenantIdStr) {
    console.warn("[Stripe Webhook] Missing metadata in payment intent");
    return;
  }

  const contractId = parseInt(contractIdStr);
  const tenantId = parseInt(tenantIdStr);
  const amount = paymentIntent.amount;

  const db = await getDb() as any;
  if (!db) {
    console.error("[Stripe Webhook] Database not available");
    return;
  }

  // Find the pending payment record
  const paymentRecord = await db.query.payments.findFirst({
    where: (payments: any, { eq, or }: any) => or(
        eq(payments.stripePaymentIntentId, paymentIntent.id),
        and(
            eq(payments.contractId, contractId),
            eq(payments.tenantId, tenantId),
            eq(payments.status, 'pending'),
            eq(payments.amount, amount)
        )
    ),
  });

  if (paymentRecord) {
    await db.update(payments)
        .set({
            status: "completed",
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: (paymentIntent.latest_charge as string) || null,
            paidAt: new Date()
        })
        .where(eq(payments.id, paymentRecord.id));
        
    console.log(`[Stripe Webhook] Updated payment ${paymentRecord.id} to completed`);
  }

  // Update Contract Logic (Deposit / Rent) based on type
  const type = paymentIntent.metadata?.type;
  
  if (type === 'deposit') {
    await db.update(contracts)
        .set({
            depositPaid: true,
            depositPaidAt: new Date(),
            depositPaymentMethod: 'stripe',
            depositPaymentReference: paymentIntent.id
        })
        .where(eq(contracts.id, contractId));
    console.log(`[Stripe Webhook] Marked contract ${contractId} deposit as paid`);
  } else if (type === 'first_month_rent') {
    await db.update(contracts)
        .set({
            firstMonthRentPaid: true,
            firstMonthRentPaidAt: new Date(),
            firstMonthRentPaymentMethod: 'stripe',
            firstMonthRentPaymentReference: paymentIntent.id
        })
        .where(eq(contracts.id, contractId));
    console.log(`[Stripe Webhook] Marked contract ${contractId} first month rent as paid`);
  }

  // Send Notification
  try {
    const description = type === 'deposit' ? 'Security Deposit' : type === 'first_month_rent' ? 'First Month Rent' : 'Rent Payment';
    await notifyPaymentCompleted({
        userId: tenantId,
        amount: amount,
        description: description,
        type: 'rent'
    });
  } catch (e) {
    console.error("[Stripe Webhook] Failed to send notification", e);
  }
}
