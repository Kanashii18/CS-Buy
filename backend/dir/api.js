import Fastify from 'fastify';
import '@fastify/cookie';
import next from "next";
// Server config
import { bodyLimit, dir, host } from "./config/server_config.js";
// Load environment variables
import 'dotenv/config';
// .env variables
import { PORT, Dev } from "./config/env.js";
// middleware...
import ensureDevice from "./middleware/ensure_device.js";
// modules...
import { Init_conection } from "./modules/connection/set_network.js";
import registers_api from "./modules/registers/registers.js";
// scripts...
import { db } from "./scripts/db.js";
// DEV indicate mode to testing or compile
// dir: indicamos la ruta de fronted a partir de la raiz,
// ej backend/api/api.ks | frontend/
const app = next({
    dev: Dev,
    dir: dir
});
const handle = app.getRequestHandler();
await app.prepare();
const fastify = Fastify({
    logger: { level: "warn" },
    bodyLimit: bodyLimit // 4mb
});
(async function () {
    // Initialize Fastify app
    fastify.addHook('preHandler', ensureDevice);
    // ========================================================== //
    const { io, users } = Init_conection(fastify, db);
    registers_api({ fastify, db, io, users }); // registers api and routes definition 
    // Catch-all route for SPA
    fastify.all("/*", async (req, reply) => {
        if (req.raw.url?.startsWith("/api"))
            return reply.callNotFound();
        await handle(req.raw, reply.raw);
        reply.hijack();
    });
    // =====================|| Set Server ||===================== //
    process.env.NODE_ENV !== "test" ?
        await fastify.listen({ port: PORT, host: host })
        : null;
}());
export default fastify;
