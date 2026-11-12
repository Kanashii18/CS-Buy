import "dotenv/config";
import set_error from "./error.env.js";
const BCRYPT_COST = 12;
const SECRET_PEPPER = process.env.SECRET_PEPPER;
if (typeof SECRET_PEPPER !== "string")
    set_error("SECRET_PEPPER", "Invalid type value");
export { BCRYPT_COST, SECRET_PEPPER };
