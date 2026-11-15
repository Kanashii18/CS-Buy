import type { FastifyReply, FastifyRequest } from "fastify";
import type { DB } from "../db.type.ts";

export namespace Order {
     export type Params<Body = unknown, Querystring = unknown> = {
          db: DB;
          request: FastifyRequest<{ Body?: Body; Querystring?: Querystring }>;
          reply: FastifyReply;
     };
     export type Query = {
          o: string;
     };
}
