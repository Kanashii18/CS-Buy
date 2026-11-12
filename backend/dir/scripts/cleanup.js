import { pool } from "./db.js";
export default async function () {
    // Clear checkout session token every 
    await pool.execute(`
        DELETE FROM Checkout_id
        WHERE expires_at < NOW()
    `);
    await pool.end();
}
