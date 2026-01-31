import { router, protectedProcedure } from "../trpc";
import { getTenantActiveRental, getTenantActiveRentals } from "../db";

export const tenantRouter = router({
  getActiveRental: protectedProcedure
    .query(({ ctx }) => getTenantActiveRental(ctx.user.id)),
    
  getAllActiveRentals: protectedProcedure
    .query(({ ctx }) => getTenantActiveRentals(ctx.user.id)),
});
