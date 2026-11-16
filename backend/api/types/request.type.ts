import type { FastifyRequest } from "fastify";
import type { UUID } from "node:crypto";

export interface IdQuery {
     id: UUID;
}
export interface IdBody {
     id: UUID;
}
export interface UserIdBody {
     user_id: UUID;
}

export type UploadRequest = FastifyRequest & {
     file?: Express.Multer.File;
};
