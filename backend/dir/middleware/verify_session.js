import jwt from 'jsonwebtoken';
import { SECRET_KEY } from "../config/env.js";
/**
 * @returns user information, EJ: { id:UUID, img:string, username:string }
 */
export default async function (request, reply) {
    // verify token validation from user...
    const token = request.cookies?.session_token;
    if (!token || typeof token !== "string") {
        await reply.code(401).send({ error: "Unauthorized" });
        return;
    }
    // create userinfo with { id, img, username }
    let userInfo;
    try {
        userInfo = jwt.verify(token, SECRET_KEY);
    }
    catch {
        await reply.code(401).send({ error: "Unauthorized" });
        return;
    }
    if (!userInfo.id || !userInfo.username || !userInfo.role) {
        await reply.code(401).send({ error: "Miss payload values" });
        return;
    }
    // return object { id, img, username, role } with user info
    request.userInfo = userInfo;
}
