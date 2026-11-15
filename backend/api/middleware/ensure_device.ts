import { createHmac, type UUID } from "crypto";
import type { FastifyRequest, FastifyReply } from "fastify";
import type { Req_Device } from "../types/middleware/ensure_device.type.ts";
import { DEVICE_SECRET } from "../config/env.ts";

export default async function ensureDevice(
     request: FastifyRequest & Req_Device,
     reply: FastifyReply,
) {
     // Fastify plugins...
     const sign = (v: string) =>
          createHmac("sha256", DEVICE_SECRET).update(v).digest("base64url");
     const COOKIE = "__did";

     const c = request.cookies?.[COOKIE];
     if (c) {
          const [id, sig] = c.split(".");
          if (id && sig && sig === sign(id)) {
               request.deviceId = id as UUID;
               return;
          }
     }
     const id = crypto.randomUUID() as UUID;
     reply.setCookie(COOKIE, `${id}.${sign(id)}`, {
          httpOnly: false,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 31536000000,
          path: "/",
     });
     request.deviceId = id;
}
