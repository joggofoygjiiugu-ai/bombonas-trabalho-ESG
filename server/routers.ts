import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  bombonas: router({
    list: publicProcedure.query(async () => {
      const { listBombonas } = await import("./db");
      return listBombonas();
    }),

    getByNumero: publicProcedure
      .input(z.object({ numero: z.string() }))
      .query(async ({ input }) => {
        const { getBombonaByNumero } = await import("./db");
        return getBombonaByNumero(input.numero);
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getBombonaById } = await import("./db");
        return getBombonaById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({ localizacao: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { createBombona } = await import("./db");
        return createBombona(ctx.user.id, input.localizacao);
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          bombonaId: z.number(),
          novoStatus: z.enum(["galpao", "a_caminho", "no_local", "recolhida", "entregue_galpao"]),
          localizacao: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateBombonaStatus } = await import("./db");
        return updateBombonaStatus(
          input.bombonaId,
          input.novoStatus,
          ctx.user.id,
          input.localizacao
        );
      }),
  }),

  rastreamentos: router({
    getHistorico: publicProcedure
      .input(z.object({ bombonaId: z.number() }))
      .query(async ({ input }) => {
        const { getRastreamentoHistorico } = await import("./db");
        return getRastreamentoHistorico(input.bombonaId);
      }),
  }),

  anotacoes: router({
    list: publicProcedure
      .input(z.object({ bombonaId: z.number() }))
      .query(async ({ input }) => {
        const { getAnotacoes } = await import("./db");
        return getAnotacoes(input.bombonaId);
      }),

    add: protectedProcedure
      .input(
        z.object({
          bombonaId: z.number(),
          conteudo: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { addAnotacao } = await import("./db");
        return addAnotacao(input.bombonaId, input.conteudo, ctx.user.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          anotacaoId: z.number(),
          conteudo: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { updateAnotacao } = await import("./db");
        return updateAnotacao(input.anotacaoId, input.conteudo);
      }),

    delete: protectedProcedure
      .input(z.object({ anotacaoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteAnotacao } = await import("./db");
        await deleteAnotacao(input.anotacaoId);
        return { success: true };
      }),
  }),
  qrcode: router({
    generate: publicProcedure
      .input(z.object({ numero: z.string() }))
      .query(async ({ input }) => {
        const { generateQRCode } = await import("./db");
        const qrCodeDataUrl = await generateQRCode(input.numero);
        return { qrCodeDataUrl };
      }),
  }),
});

export type AppRouter = typeof appRouter;
