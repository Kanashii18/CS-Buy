import mysql from "mysql2/promise";
import "dotenv/config";
import { CA_PEM, SQL_PASSWORD } from "../config/env.ts";

const dbConfig = {
     port: 15874,
     host: "mysql-35fc5689-danielalexander177125-03c9.a.aivencloud.com",
     user: "avnadmin",
     password: SQL_PASSWORD,
     database: "defaultdb",
     ssl: { ca: CA_PEM },
};

async function deleteEverything(): Promise<void> {
     const pool = mysql.createPool(dbConfig);

     const tables = [
          "Payments",
          "Orders",
          "OrderItems",
          "Product_Asset",
          "Product_Service",
          "Product_Accounts",
          "Products",
          "Wallets",
          "Transactions",
          "Feedbacks",
          "Feedback",
          "Bans",
          "UserDevices",
          "DeviceIPs",
          "Checkout_id",
          "CheckoutSessions",
          "Notifications",
          "Messages",
          "Chats",
          "chat_user_room_status",
          "StripePayments",
          "CryptoPayments",
          "Sellers",
          "Services",
          "Accounts",
          "Assets",
          "Users",
     ];

     for (const table of tables) {
          try {
               await pool.execute(`DROP TABLE IF EXISTS \`${table}\`;`);
               console.log(`Dropped table: ${table}`);
          } catch (error) {
               console.error(`Failed to drop table: ${table}`, error);
          }
     }

     const [rows] = await pool.query("SHOW TABLES;");
     console.log("Remaining tables:", rows);
     await pool.end();
}

void deleteEverything().catch((error) => {
     console.error("Error deleting everything:", error);
     process.exit(1);
});
