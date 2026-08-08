import { z } from "zod";
import { nanoid } from "nanoid";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createProposal, deleteProposal, getProposalBySlug, listProposals, updateProposalData } from "./db";
import { generateProposal } from "./proposalGenerator";
import { APP_PASSWORD } from "../shared/constants";
import { storagePut } from "./storage";
import { scrapeWebsiteImages } from "./scraper";

const channelSchema = z.object({
  name: z.string(),
  budget: z.number(),
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  proposal: router({
    verifyPassword: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input }) => {
        return { valid: input.password === APP_PASSWORD };
      }),

    previewImages: publicProcedure
      .input(z.object({ url: z.string().min(1) }))
      .mutation(async ({ input }) => {
        try {
          const result = await scrapeWebsiteImages(input.url);
          return { count: result.images.length };
        } catch {
          return { count: 0 };
        }
      }),

    uploadImage: publicProcedure
      .input(z.object({
        base64: z.string(), // data:image/...;base64,...
        filename: z.string(),
      }))
      .mutation(async ({ input }) => {
        const matches = input.base64.match(/^data:([^;]+);base64,(.+)$/);
        if (!matches) throw new Error("Invalid base64 image");
        const [, mimeType, b64data] = matches;
        const buffer = Buffer.from(b64data, "base64");
        const ext = input.filename.split(".").pop() ?? "jpg";
        const key = `proposal-uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { url } = await storagePut(key, buffer, mimeType);
        return { url };
      }),

    create: publicProcedure
      .input(z.object({
        clientName: z.string().min(1),
        clientWebsite: z.string().min(1),
        industry: z.string().min(1),
        isEcommerce: z.boolean(),
        goals: z.string().min(1),
        channels: z.array(channelSchema).min(1),
        setupFee: z.number().min(0),
        salesRep: z.string().min(1),
        salesRepEmail: z.string().optional(),
        salesRepPhone: z.string().optional(),
        uploadedImages: z.array(z.string()).optional(), // S3 URLs from uploadImage
      }))
      .mutation(async ({ input }) => {
        const slug = nanoid(10);
        const totalMonthlySpend = input.channels.reduce((s, c) => s + c.budget, 0);

        await createProposal({
          slug,
          clientName: input.clientName,
          clientWebsite: input.clientWebsite,
          industry: input.industry,
          isEcommerce: input.isEcommerce,
          goals: input.goals,
          salesRep: input.salesRep,
          salesRepEmail: input.salesRepEmail,
          salesRepPhone: input.salesRepPhone,
          setupFee: input.setupFee,
          channels: input.channels,
          totalMonthlySpend,
          managementFee: 0,
          managementFeePercent: "calculating",
          status: "generating",
        });

        generateProposal({ ...input, uploadedImages: input.uploadedImages ?? [] })
          .then(data => updateProposalData(slug, data, "ready"))
          .catch(err => {
            console.error("[Generator] Failed:", err);
            updateProposalData(slug, null, "error");
          });

        return { slug };
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const proposal = await getProposalBySlug(input.slug);
        if (!proposal) return null;
        return {
          slug: proposal.slug,
          clientName: proposal.clientName,
          salesRep: proposal.salesRep,
          status: proposal.status,
          createdAt: proposal.createdAt,
          proposalData: proposal.proposalData,
        };
      }),

    list: publicProcedure.query(async () => {
      const all = await listProposals();
      return all.map(p => ({
        slug: p.slug,
        clientName: p.clientName,
        clientWebsite: p.clientWebsite,
        salesRep: p.salesRep,
        status: p.status,
        createdAt: p.createdAt,
        totalMonthlySpend: p.totalMonthlySpend,
      }));
    }),

    delete: publicProcedure
      .input(z.object({ slug: z.string() }))
      .mutation(async ({ input }) => {
        await deleteProposal(input.slug);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
