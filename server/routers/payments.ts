import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { getTenantPayments, getDb, getLandlordPayments } from "../db";
import { payments, contracts, appSettings, properties, users } from "../../drizzle/schema";
import { eq, and, desc, sql, gte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { ENV } from "../env";
import { notifyPaymentCompleted } from "../notifications-service";

const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-01-27.acacia" as any,
});

export const paymentsRouter = router({
  getStripeConfig: protectedProcedure.query(() => {
    return {
      publishableKey: ENV.stripePublishableKey,
    };
  }),

  getTenantPayments: protectedProcedure.query(async ({ ctx }) => {
    const payments = await getTenantPayments(ctx.user.id);
    return payments;
  }),

  getLandlordPayments: protectedProcedure.query(async ({ ctx }) => {
    const payments = await getLandlordPayments(ctx.user.id);
    return payments;
  }),

  getLandlordStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Aggregate statistics
    const stats = await db
      .select({
        totalEarnings: sql<number>`sum(case when status = 'completed' then netAmount else 0 end)`, // Use netAmount
        totalPayments: sql<number>`count(*)`,
        pendingPayments: sql<number>`sum(case when status = 'pending' then netAmount else 0 end)`, // Use netAmount
        pendingPaymentsCount: sql<number>`count(case when status = 'pending' then 1 else null end)`,
      })
      .from(payments)
      .where(eq(payments.landlordId, ctx.user.id));

    // Get this month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonth = await db
      .select({
        earnings: sql<number>`sum(netAmount)`, // Use netAmount
      })
      .from(payments)
      .where(and(
        eq(payments.landlordId, ctx.user.id),
        eq(payments.status, "completed"),
        gte(payments.paidAt, startOfMonth)
      ));

    return {
      totalEarnings: Number(stats[0]?.totalEarnings || 0),
      totalPayments: Number(stats[0]?.totalPayments || 0),
      pendingPayments: Number(stats[0]?.pendingPayments || 0),
      pendingPaymentsCount: Number(stats[0]?.pendingPaymentsCount || 0),
      thisMonthEarnings: Number(thisMonth[0]?.earnings || 0),
    };
  }),

  getMonthlyEarnings: protectedProcedure
    .input(z.object({ months: z.number().default(12) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - input.months);

      // Fetch monthly data
      const monthly = await db
        .select({
          month: sql<string>`date_format(paidAt, '%Y-%m')`,
          total: sql<number>`sum(netAmount)`, // Use netAmount
        })
        .from(payments)
        .where(and(
          eq(payments.landlordId, ctx.user.id),
          eq(payments.status, "completed"),
          gte(payments.paidAt, startDate)
        ))
        .groupBy(sql`date_format(${payments.paidAt}, '%Y-%m')`)
        .orderBy(sql`date_format(${payments.paidAt}, '%Y-%m')`);

      return {
        labels: monthly.map((m: any) => m.month),
        data: monthly.map((m: any) => Number(m.total || 0) / 100), // Convert to EUR
      };
    }),

  createPaymentIntent: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      amount: z.number(), // Amount in EUR (decimal)
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify contract exists and belongs to user
      const contract = await db.query.contracts.findFirst({
        where: and(
          eq(contracts.id, input.contractId),
          eq(contracts.tenantId, ctx.user.id)
        ),
        with: { landlord: true } // Fetch landlord
      });

      if (!contract) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Contract not found" });
      }

      // Convert amount to cents for Stripe
      const amountInCents = Math.round(input.amount * 100);

      // Get Platform Commission %
      const settings = await db.select().from(appSettings).limit(1);
      const commissionPct = settings[0]?.platformCommissionPercentage || 5; // Default 5%

      // Calculate Split
      const platformFee = Math.round(amountInCents * (commissionPct / 100));
      const netAmount = amountInCents - platformFee;

      try {
        const paymentIntentData: Stripe.PaymentIntentCreateParams = {
            amount: amountInCents,
            currency: (contract.currency || "eur").toLowerCase(),
            description: input.description,
            metadata: {
              contractId: input.contractId.toString(),
              tenantId: ctx.user.id.toString(),
              landlordId: contract.landlordId.toString(),
              platformFee: platformFee.toString(),
              netAmount: netAmount.toString(),
            },
        };

        // Manual Payout Mode: No transfer_data. Funds stay in platform account.
        // We will manually pay the landlord `netAmount` later.

        const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

        // Create a pending payment record in our DB
        const [result] = await db.insert(payments).values({
          contractId: input.contractId,
          tenantId: ctx.user.id,
          landlordId: contract.landlordId,
          propertyId: contract.propertyId,
          amount: amountInCents,
          currency: contract.currency || "EUR",
          status: "pending",
          stripePaymentIntentId: paymentIntent.id,
          dueDate: new Date(),
          description: input.description,
          platformFee: platformFee,
          netAmount: netAmount,
        });

        return {
          clientSecret: paymentIntent.client_secret,
          paymentId: result.insertId,
          amount: input.amount,
        };
      } catch (error: any) {
        console.error("Stripe error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to create payment intent",
        });
      }
    }),

  confirmPayment: protectedProcedure
    .input(z.object({
      paymentId: z.number(),
      stripeChargeId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const payment = await db.query.payments.findFirst({
        where: and(
          eq(payments.id, input.paymentId),
          eq(payments.tenantId, ctx.user.id)
        ),
      });

      if (!payment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Payment record not found" });
      }

      // Update payment status
      await db.update(payments)
        .set({
          status: "completed",
          stripeChargeId: input.stripeChargeId,
          paidAt: new Date(),
        })
        .where(eq(payments.id, input.paymentId));

      // Send notification
      try {
        await notifyPaymentCompleted({
          userId: ctx.user.id,
          amount: payment.amount,
          description: payment.description || "Rent payment",
          type: "rent",
        });
      } catch (err) {
        console.error("Failed to send payment notification:", err);
      }

      // If this was a deposit or first month rent, update the contract
      if (payment.contractId) {
        const contract = await db.query.contracts.findFirst({
          where: eq(contracts.id, payment.contractId),
        });

        if (contract) {
          if (!contract.depositPaid && payment.amount === contract.securityDeposit) {
            await db.update(contracts)
              .set({ depositPaid: true, depositPaidAt: new Date() })
              .where(eq(contracts.id, contract.id));
          } else if (!contract.firstMonthRentPaid && payment.amount === contract.monthlyRent) {
            await db.update(contracts)
              .set({ firstMonthRentPaid: true, firstMonthRentPaidAt: new Date() })
              .where(eq(contracts.id, contract.id));
          }
        }
      }

      return { success: true };
    }),

  downloadReceipt: protectedProcedure
    .input(z.object({ paymentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb() as any;
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Use Core API to avoid JSON syntax issues on MariaDB
      const rows = await db
        .select({
          payment: payments,
          property: properties,
          tenant: {
            name: users.name,
            email: users.email,
          },
          landlord: {
            name: sql<string>`u_landlord.name`,
            email: sql<string>`u_landlord.email`,
          }
        })
        .from(payments)
        .innerJoin(properties, eq(payments.propertyId, properties.id))
        .innerJoin(users, eq(payments.tenantId, users.id))
        .innerJoin(sql`users as u_landlord`, eq(payments.landlordId, sql`u_landlord.id`))
        .where(and(
          eq(payments.id, input.paymentId),
          or(
            eq(payments.tenantId, ctx.user.id),
            eq(payments.landlordId, ctx.user.id)
          )
        ))
        .limit(1);

      if (rows.length === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Payment not found" });

      const row = rows[0];
      const payment = row.payment;

      const { generateReceiptPdf } = await import("../receipt-pdf-service");

      const url = await generateReceiptPdf({
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        date: payment.paidAt || payment.createdAt,
        description: payment.description || "Payment",
        tenantName: row.tenant.name || "Tenant",
        landlordName: row.landlord.name || "Landlord",
        propertyTitle: row.property.title || "Property",
        propertyAddress: row.property.address || "",
        paymentMethod: payment.paymentMethod,
      });

      // Update receipt URL in DB
      await db.update(payments).set({ receiptUrl: url }).where(eq(payments.id, payment.id));

      return { url };
    }),
});