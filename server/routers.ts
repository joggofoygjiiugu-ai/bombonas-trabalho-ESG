import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Credenciais simples: admin/admin
        if (input.username === "admin" && input.password === "admin") {
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, "authenticated", { ...cookieOptions, maxAge: 24 * 60 * 60 * 1000 });
          return { success: true, user: { name: "Admin" } };
        }
        throw new Error("Usuário ou senha inválidos");
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    me: publicProcedure.query(opts => {
      const cookies = opts.ctx.req.headers.cookie || "";
      const isAuthenticated = cookies.includes(COOKIE_NAME);
      return isAuthenticated ? { name: "Admin" } : null;
    }),
  }),

  bombonas: router({
    /**
     * Lista todas as bombonas
     */
    list: publicProcedure.query(async () => {
      const { listBombonas } = await import("./db");
      return listBombonas();
    }),

    /**
     * Obtém uma bombona por número (B001, B002, etc.)
     */
    getByNumero: publicProcedure
      .input(z.object({ numero: z.string() }))
      .query(async ({ input }) => {
        const { getBombonaByNumero } = await import("./db");
        return getBombonaByNumero(input.numero);
      }),

    /**
     * Obtém uma bombona por ID
     */
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getBombonaById } = await import("./db");
        return getBombonaById(input.id);
      }),

    /**
     * Cria uma nova bombona
     */
    create: protectedProcedure
      .input(z.object({ localizacao: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const { createBombona } = await import("./db");
        return createBombona(ctx.user.id, input.localizacao);
      }),

    /**
     * Atualiza o status de uma bombona
     */
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
    /**
     * Obtém o histórico de rastreamento de uma bombona
     */
    getHistorico: publicProcedure
      .input(z.object({ bombonaId: z.number() }))
      .query(async ({ input }) => {
        const { getRastreamentoHistorico } = await import("./db");
        return getRastreamentoHistorico(input.bombonaId);
      }),
  }),

  anotacoes: router({
    /**
     * Lista todas as anotações de uma bombona
     */
    list: publicProcedure
      .input(z.object({ bombonaId: z.number() }))
      .query(async ({ input }) => {
        const { getAnotacoes } = await import("./db");
        return getAnotacoes(input.bombonaId);
      }),

    /**
     * Adiciona uma anotação a uma bombona
     */
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

    /**
     * Atualiza uma anotação
     */
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

    /**
     * Deleta uma anotação
     */
    delete: protectedProcedure
      .input(z.object({ anotacaoId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { deleteAnotacao } = await import("./db");
        await deleteAnotacao(input.anotacaoId);
        return { success: true };
      }),
  }),
  qrcode: router({
    /**
     * Gera um QR Code para uma bombona
     */
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
