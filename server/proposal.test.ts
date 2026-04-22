import { describe, expect, it } from "vitest";
import { calculateFee, ECOMMERCE_TIERS, NON_ECOMMERCE_TIERS, APP_PASSWORD } from "../shared/constants";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "../shared/const";

// ── Ecommerce Fee Calculation Tests ──────────────────────────────────────────

describe("calculateFee - ecommerce", () => {
  it("returns flat $600 for spend $1-$2999", () => {
    const result = calculateFee(1500, true);
    expect(result.monthlyFee).toBe(600);
    expect(result.percent).toBe("flat");
  });

  it("returns 20% for $3000-$7499 range", () => {
    const result = calculateFee(5000, true);
    expect(result.monthlyFee).toBe(1000);
    expect(result.percent).toBe("20%");
  });

  it("returns 18% for $7500-$11999 range", () => {
    const result = calculateFee(10000, true);
    expect(result.monthlyFee).toBe(1800);
    expect(result.percent).toBe("18%");
  });

  it("returns 17% for $12000-$19999 range", () => {
    const result = calculateFee(15000, true);
    expect(result.monthlyFee).toBe(2550);
    expect(result.percent).toBe("17%");
  });

  it("returns 16% for $20000-$29999 range", () => {
    const result = calculateFee(25000, true);
    expect(result.monthlyFee).toBe(4000);
    expect(result.percent).toBe("16%");
  });

  it("returns 15% for $30000-$44999 range", () => {
    const result = calculateFee(40000, true);
    expect(result.monthlyFee).toBe(6000);
    expect(result.percent).toBe("15%");
  });

  it("returns 14% for $45000-$59999 range", () => {
    const result = calculateFee(50000, true);
    expect(result.monthlyFee).toBe(7000);
    expect(result.percent).toBe("14%");
  });

  it("returns 13% for $60000-$74999 range", () => {
    const result = calculateFee(65000, true);
    expect(result.monthlyFee).toBe(8450);
    expect(result.percent).toBe("13%");
  });

  it("returns 12% for $75000-$100000 range", () => {
    const result = calculateFee(90000, true);
    expect(result.monthlyFee).toBe(10800);
    expect(result.percent).toBe("12%");
  });

  it("ecommerce has 9 tiers (no Custom tier)", () => {
    expect(ECOMMERCE_TIERS).toHaveLength(9);
  });
});

// ── Non-Ecommerce Fee Calculation Tests ───────────────────────────────────────

describe("calculateFee - non-ecommerce", () => {
  it("returns flat $400 for spend $1-$1999", () => {
    const result = calculateFee(1500, false);
    expect(result.monthlyFee).toBe(400);
    expect(result.percent).toBe("flat");
  });

  it("returns 20% for $2000-$5999 range", () => {
    const result = calculateFee(4000, false);
    expect(result.monthlyFee).toBe(800);
    expect(result.percent).toBe("20%");
  });

  it("returns 18% for $6000-$9999 range", () => {
    const result = calculateFee(8000, false);
    expect(result.monthlyFee).toBe(1440);
    expect(result.percent).toBe("18%");
  });

  it("returns 16% for $10000-$19999 range (Crema Cafe scenario: $10073)", () => {
    const result = calculateFee(10073, false);
    expect(result.monthlyFee).toBe(1612);
    expect(result.percent).toBe("16%");
  });

  it("returns 15% for $20000-$34999 range", () => {
    const result = calculateFee(25000, false);
    expect(result.monthlyFee).toBe(3750);
    expect(result.percent).toBe("15%");
  });

  it("returns Custom for $35000+", () => {
    const result = calculateFee(50000, false);
    expect(result.percent).toBe("Custom");
    expect(result.monthlyFee).toBe(0);
  });

  it("non-ecommerce has 6 tiers", () => {
    expect(NON_ECOMMERCE_TIERS).toHaveLength(6);
  });

  it("ecommerce flat is $600, non-ecommerce flat is $400", () => {
    const ecom = calculateFee(500, true);
    const nonEcom = calculateFee(500, false);
    expect(ecom.monthlyFee).toBe(600);
    expect(nonEcom.monthlyFee).toBe(400);
  });
});

// ── Password Verification Tests ───────────────────────────────────────────────

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("proposal.verifyPassword", () => {
  it("returns valid: true for correct password", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.proposal.verifyPassword({ password: APP_PASSWORD });
    expect(result.valid).toBe(true);
  });

  it("returns valid: false for wrong password", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.proposal.verifyPassword({ password: "wrongpassword" });
    expect(result.valid).toBe(false);
  });

  it("returns valid: false for empty password", async () => {
    const caller = appRouter.createCaller(createMockContext());
    const result = await caller.proposal.verifyPassword({ password: "" });
    expect(result.valid).toBe(false);
  });

  it("password is exactly Techspace65", () => {
    expect(APP_PASSWORD).toBe("Techspace65");
  });
});

// ── Auth logout test ──────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: {
        id: 1, openId: "test", email: "test@test.com", name: "Test",
        loginMethod: "manus", role: "user",
        createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
      },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});
