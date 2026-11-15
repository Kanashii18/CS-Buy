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

// ===========================================================================
// DROP ORDER: hijos primero, padres al final (respetar FK implícitas)
// ===========================================================================
const dropStatements = [
     // Pagos y checkout (referencian Orders, Wallets, Users)
     "DROP TABLE IF EXISTS StripePayments;",
     "DROP TABLE IF EXISTS CryptoPayments;",
     "DROP TABLE IF EXISTS Payments;",
     "DROP TABLE IF EXISTS Checkout_id;",
     "DROP TABLE IF EXISTS CheckoutSessions;",

     // Órdenes (referencian Products, Users)
     "DROP TABLE IF EXISTS OrderItems;",
     "DROP TABLE IF EXISTS Orders;",

     // Feedback
     "DROP TABLE IF EXISTS Feedback;",
     "DROP TABLE IF EXISTS Feedbacks;",

     // Chat / Notificaciones
     "DROP TABLE IF EXISTS Messages;",
     "DROP TABLE IF EXISTS chat_user_room_status;",
     "DROP TABLE IF EXISTS Chats;",
     "DROP TABLE IF EXISTS Notifications;",

     // Sub-tablas de productos
     "DROP TABLE IF EXISTS Product_Accounts;",
     "DROP TABLE IF EXISTS Product_Service;",
     "DROP TABLE IF EXISTS Product_Asset;",

     // Productos
     "DROP TABLE IF EXISTS Products;",

     // Wallet y transacciones
     "DROP TABLE IF EXISTS Transactions;",
     "DROP TABLE IF EXISTS Wallets;",

     // Bans / Devices
     "DROP TABLE IF EXISTS DeviceIPs;",
     "DROP TABLE IF EXISTS UserDevices;",
     "DROP TABLE IF EXISTS Devices;",
     "DROP TABLE IF EXISTS Bans;",

     // Sellers / catálogos auxiliares
     "DROP TABLE IF EXISTS Sellers;",
     "DROP TABLE IF EXISTS Services;",
     "DROP TABLE IF EXISTS Accounts;",
     "DROP TABLE IF EXISTS Assets;",

     // Raíz
     "DROP TABLE IF EXISTS Users;",
];

// ===========================================================================
// CREATE ORDER: padres primero, hijos al final
// ===========================================================================
const createStatements = [

     // ── 1. Users ──────────────────────────────────────────────────────────
     // Tabla raíz. Todos los actores (compradores / vendedores / admins).
     // role: 'user' | 'admin'
     // rate: puntuación 0-100 calculada desde Feedbacks (actualizada en postFeedback)
     // accounts_selled / services_selled / assets_selled: contadores incrementales por categoría
     // time: fecha de registro
     `CREATE TABLE IF NOT EXISTS Users (
          user_id         VARCHAR(36)   NOT NULL,
          username        VARCHAR(80)   NOT NULL,
          email           VARCHAR(255)  NOT NULL UNIQUE,
          password        VARCHAR(255)  NOT NULL,
          img             TEXT          NULL,
          time            DATETIME      NULL,
          description     TEXT          NULL,
          role            VARCHAR(50)   NOT NULL DEFAULT 'user',
          rate            DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
          accounts_selled INT           NOT NULL DEFAULT 0,
          assets_selled   INT           NOT NULL DEFAULT 0,
          services_selled INT           NOT NULL DEFAULT 0,
          PRIMARY KEY (user_id),
          KEY idx_users_email    (email),
          KEY idx_users_username (username),
          KEY idx_users_role     (role)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 2. Wallets ────────────────────────────────────────────────────────
     // Una wallet por usuario, creada automáticamente en el registro.
     // balance: saldo disponible (ya capturado por Stripe y liberado)
     // pending: fondos retenidos en escrow (capturados pero no liberados)
     `CREATE TABLE IF NOT EXISTS Wallets (
          wallet_id  VARCHAR(36)    NOT NULL,
          user_id    VARCHAR(36)    NOT NULL,
          balance    DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
          pending    DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
          created_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (wallet_id),
          UNIQUE KEY uniq_wallet_user (user_id),
          KEY idx_wallet_user (user_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 3. Transactions ───────────────────────────────────────────────────
     // Historial de movimientos internos de la wallet.
     // type: 'credit' | 'debit' | 'pending' | 'release' | 'withdraw'
     `CREATE TABLE IF NOT EXISTS Transactions (
          transaction_id VARCHAR(36)   NOT NULL,
          user_id        VARCHAR(36)   NOT NULL,
          wallet_id      VARCHAR(36)   NOT NULL,
          amount         DECIMAL(12,2) NOT NULL,
          type           VARCHAR(50)   NOT NULL,
          description    TEXT          NULL,
          created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (transaction_id),
          KEY idx_transactions_user   (user_id),
          KEY idx_transactions_wallet (wallet_id),
          KEY idx_transactions_type   (type)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 4. Devices ────────────────────────────────────────────────────────
     // Device IDs únicos (cookie __did firmada HMAC-SHA256).
     // Referenciada por UserDevices y DeviceIPs para sistema de bans.
     `CREATE TABLE IF NOT EXISTS Devices (
          device_id  VARCHAR(255) NOT NULL,
          created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (device_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 5. UserDevices ────────────────────────────────────────────────────
     // Relación N:N entre usuarios y dispositivos.
     // Se inserta/actualiza (ON DUPLICATE KEY) en cada login (ban_controller.linking).
     `CREATE TABLE IF NOT EXISTS UserDevices (
          user_id   VARCHAR(36)  NOT NULL,
          device_id VARCHAR(255) NOT NULL,
          last_seen DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, device_id),
          KEY idx_userdevices_device (device_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 6. DeviceIPs ──────────────────────────────────────────────────────
     // IP histórica por device. ON DUPLICATE KEY UPDATE last_seen.
     `CREATE TABLE IF NOT EXISTS DeviceIPs (
          device_id VARCHAR(255) NOT NULL,
          ip        VARCHAR(255) NOT NULL,
          last_seen DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (device_id, ip),
          KEY idx_deviceips_ip (ip)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 7. Bans ───────────────────────────────────────────────────────────
     // Ban multidimensional: puede banear por user_id, email, ip, deviceId (cualquier combo).
     // expires_at NULL = ban permanente.
     // Chequeado en login (isBanned) y potencialmente en register.
     `CREATE TABLE IF NOT EXISTS Bans (
          ban_id     VARCHAR(36)  NOT NULL,
          user_id    VARCHAR(36)  NULL,
          email      VARCHAR(255) NULL,
          ip         VARCHAR(255) NULL,
          deviceId   VARCHAR(255) NULL,
          reason     TEXT         NULL,
          expires_at DATETIME     NULL,
          created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (ban_id),
          KEY idx_bans_user    (user_id),
          KEY idx_bans_email   (email),
          KEY idx_bans_ip      (ip),
          KEY idx_bans_device  (deviceId),
          KEY idx_bans_expires (expires_at)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 8. Sellers ────────────────────────────────────────────────────────
     // Perfil de vendedor. Relación 1:1 con Users.
     // status: 'active' | 'suspended'
     `CREATE TABLE IF NOT EXISTS Sellers (
          seller_id  VARCHAR(36) NOT NULL,
          user_id    VARCHAR(36) NOT NULL,
          status     VARCHAR(50) NOT NULL DEFAULT 'active',
          created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (seller_id),
          UNIQUE KEY uniq_seller_user (user_id),
          KEY idx_sellers_user (user_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 9. Products ───────────────────────────────────────────────────────
     // Catálogo de productos del marketplace.
     // category: 'Account' | 'Service' | 'Others'  (addProduct usa estos valores exactos)
     // deliveryUnit: 'instant' | 'minutes' | 'hours'
     // delivery_value: número de unidades (NULL si instant)
     // active: 0 pausado por el vendedor (PUT /seller/pause); 1 activo (PUT /seller/resume)
     // deleted: 1 eliminado lógicamente (PUT /seller/delete) — nunca se borra físicamente
     // quantity: número de unidades disponibles; decrementado en cada venta de Account
     `CREATE TABLE IF NOT EXISTS Products (
          product_id    VARCHAR(36)   NOT NULL,
          user_id       VARCHAR(36)   NOT NULL,
          title         VARCHAR(120)  NOT NULL,
          price         DECIMAL(12,2) NOT NULL,
          deliveryUnit  VARCHAR(50)   NULL,
          delivery_value INT          NULL,
          quantity      INT           NOT NULL DEFAULT 1,
          image         TEXT          NULL,
          category      VARCHAR(50)   NOT NULL,
          description   TEXT          NULL,
          active        TINYINT(1)    NOT NULL DEFAULT 1,
          deleted       TINYINT(1)    NOT NULL DEFAULT 0,
          created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (product_id),
          KEY idx_products_user     (user_id),
          KEY idx_products_category (category),
          KEY idx_products_deleted  (deleted),
          KEY idx_products_active   (active),
          KEY idx_products_quantity (quantity)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 10. Product_Accounts ──────────────────────────────────────────────
     // Stock de cuentas para productos categoría 'Account'.
     // Cada fila es una unidad vendible. La fila se elimina al venderse.
     // quantity en Products se decrementa en 1 por venta.
     `CREATE TABLE IF NOT EXISTS Product_Accounts (
          account_id  VARCHAR(36) NOT NULL,
          product_id  VARCHAR(36) NOT NULL,
          seller_id   VARCHAR(36) NOT NULL,
          information TEXT        NOT NULL,
          created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (account_id),
          KEY idx_product_accounts_product (product_id),
          KEY idx_product_accounts_seller  (seller_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 11. Product_Service ───────────────────────────────────────────────
     // Descripción extendida de un producto tipo 'Service'.
     // 1:1 con Products. Se actualiza (UPDATE) al editar el producto.
     `CREATE TABLE IF NOT EXISTS Product_Service (
          service_id  VARCHAR(36) NOT NULL,
          product_id  VARCHAR(36) NOT NULL,
          seller_id   VARCHAR(36) NOT NULL,
          information TEXT        NOT NULL,
          created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (service_id),
          KEY idx_product_service_product (product_id),
          KEY idx_product_service_seller  (seller_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 12. Product_Asset ─────────────────────────────────────────────────
     // Archivo digital para productos categoría 'Others'.
     // asset_link: URL de Cloudinary (resource_type: raw — PDF, JS, Python).
     // active: se pone a 0 (FALSE) al venderse, bloqueando doble venta.
     `CREATE TABLE IF NOT EXISTS Product_Asset (
          asset_id   VARCHAR(36)  NOT NULL,
          asset_name VARCHAR(255) NOT NULL,
          product_id VARCHAR(36)  NOT NULL,
          seller_id  VARCHAR(36)  NOT NULL,
          asset_link TEXT         NOT NULL,
          active     TINYINT(1)   NOT NULL DEFAULT 1,
          created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (asset_id),
          KEY idx_product_asset_product (product_id),
          KEY idx_product_asset_seller  (seller_id),
          KEY idx_product_asset_active  (active)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 13. Checkout_id ───────────────────────────────────────────────────
     // Token de sesión de checkout de corta duración (2 minutos, DATE_ADD NOW() INTERVAL 2 MINUTE).
     // Creado en POST /api/verify/checkout/token.
     // Validado por checkout_verify middleware antes de cualquier pago.
     // Se eliminan sesiones previas del mismo user_id al crear una nueva.
     // cleanup.ts borra periódicamente las sesiones expiradas.
     `CREATE TABLE IF NOT EXISTS Checkout_id (
          id         VARCHAR(36) NOT NULL,
          user_id    VARCHAR(36) NOT NULL,
          product_id VARCHAR(36) NOT NULL,
          expires_at DATETIME    NOT NULL,
          created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_checkout_user    (user_id),
          KEY idx_checkout_product (product_id),
          KEY idx_checkout_expires (expires_at)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 14. CheckoutSessions ──────────────────────────────────────────────
     // Sesiones de checkout con estado (referencia histórica ampliada).
     // status: 'pending' | 'completed' | 'expired'
     `CREATE TABLE IF NOT EXISTS CheckoutSessions (
          session_id VARCHAR(36)   NOT NULL,
          user_id    VARCHAR(36)   NOT NULL,
          product_id VARCHAR(36)   NOT NULL,
          total      DECIMAL(12,2) NOT NULL,
          status     VARCHAR(50)   NOT NULL DEFAULT 'pending',
          created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (session_id),
          KEY idx_checkout_sessions_user    (user_id),
          KEY idx_checkout_sessions_product (product_id),
          KEY idx_checkout_sessions_status  (status)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 15. Orders ────────────────────────────────────────────────────────
     // Registro de cada compra completada.
     // status: 'pending' | 'confirmed' | 'cancelled' | 'disputed'
     //   pending  → pago recibido, escrow activo
     //   confirmed → comprador confirmó entrega (o 5 días transcurridos) → Stripe capture
     // product_type: 'Account' | 'Service' | 'Others'
     // information: credenciales (Account) | descripción servicio | URL asset (Others)
     // asset_name: nombre del archivo para productos tipo 'Others'
     // have_feedback: 0/1 — evita que el comprador deje más de 1 review por orden
     // confirmed_at: timestamp de confirmación de entrega
     `CREATE TABLE IF NOT EXISTS Orders (
          order_id          VARCHAR(36)   NOT NULL,
          product_id        VARCHAR(36)   NOT NULL,
          product_image     TEXT          NULL,
          product_title     VARCHAR(255)  NULL,
          product_type      VARCHAR(50)   NOT NULL,
          seller_id         VARCHAR(36)   NOT NULL,
          user_id           VARCHAR(36)   NOT NULL,
          quantity          INT           NOT NULL DEFAULT 1,
          price_at_purchase DECIMAL(12,2) NOT NULL,
          information       TEXT          NULL,
          status            VARCHAR(50)   NOT NULL DEFAULT 'pending',
          asset_name        VARCHAR(255)  NULL,
          have_feedback     TINYINT(1)    NOT NULL DEFAULT 0,
          created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          confirmed_at      DATETIME      NULL,
          PRIMARY KEY (order_id),
          KEY idx_orders_user    (user_id),
          KEY idx_orders_seller  (seller_id),
          KEY idx_orders_product (product_id),
          KEY idx_orders_status  (status)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 16. OrderItems ────────────────────────────────────────────────────
     // Líneas de detalle de un pedido (reservado para órdenes multi-item futuras).
     `CREATE TABLE IF NOT EXISTS OrderItems (
          id         VARCHAR(36)   NOT NULL,
          order_id   VARCHAR(36)   NOT NULL,
          product_id VARCHAR(36)   NOT NULL,
          quantity   INT           NOT NULL DEFAULT 1,
          price      DECIMAL(12,2) NOT NULL,
          created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_orderitems_order   (order_id),
          KEY idx_orderitems_product (product_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 17. Payments ──────────────────────────────────────────────────────
     // Registro de pagos procesados. Guardián anti-replay:
     //   payment_processed=1 → ya fue procesado → rechazar duplicado (stripe_status.controller.js).
     // payment_id: stripe payment_intent ID (u otro gateway ID externo).
     // payment_gateway: 'stripe' | 'paypal' | 'crypto'
     // payment_gateway_id: UUID interno generado al insertar (distinción lógica adicional)
     // status: 'pending' | 'requires_capture' | 'completed' | 'failed'
     // wallet_id: wallet del vendedor que recibe el pending en escrow
     `CREATE TABLE IF NOT EXISTS Payments (
          payment_id         VARCHAR(120)  NOT NULL,
          payment_processed  TINYINT(1)    NOT NULL DEFAULT 0,
          order_id           VARCHAR(36)   NULL,
          user_id            VARCHAR(36)   NOT NULL,
          wallet_id          VARCHAR(36)   NULL,
          payment_gateway    VARCHAR(50)   NOT NULL DEFAULT 'stripe',
          payment_gateway_id VARCHAR(120)  NULL,
          amount             DECIMAL(12,2) NOT NULL,
          status             VARCHAR(50)   NOT NULL DEFAULT 'pending',
          token              VARCHAR(255)  NULL,
          method             VARCHAR(50)   NULL,
          created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (payment_id),
          KEY idx_payments_order  (order_id),
          KEY idx_payments_user   (user_id),
          KEY idx_payments_wallet (wallet_id),
          KEY idx_payments_status (status)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 18. StripePayments ────────────────────────────────────────────────
     // Log detallado de operaciones de Stripe.
     // stripe_id: payment_intent ID de Stripe (UNIQUE — evita duplicados).
     `CREATE TABLE IF NOT EXISTS StripePayments (
          id         INT           NOT NULL AUTO_INCREMENT,
          stripe_id  VARCHAR(120)  NOT NULL,
          payment_id VARCHAR(120)  NOT NULL,
          status     VARCHAR(50)   NOT NULL,
          amount     DECIMAL(12,2) NOT NULL,
          created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uniq_stripe_payment_id (stripe_id),
          KEY idx_stripe_payment_link (payment_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 19. CryptoPayments ────────────────────────────────────────────────
     // Log de pagos en criptomoneda (actualmente Litecoin P2PKH).
     // currency: 'LTC' | 'BTC' (extensible)
     `CREATE TABLE IF NOT EXISTS CryptoPayments (
          id         INT           NOT NULL AUTO_INCREMENT,
          user_id    VARCHAR(36)   NOT NULL,
          amount     DECIMAL(12,2) NOT NULL,
          currency   VARCHAR(20)   NOT NULL,
          created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_crypto_user (user_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 20. Feedbacks ─────────────────────────────────────────────────────
     // Reviews de compradores hacia vendedores. Máximo 1 por orden (have_feedback).
     // user_id: el vendedor que recibe el feedback (destinatario).
     // client_id: el comprador que deja el feedback.
     // stars: 1–5 → fórmula en postFeedback convierte a porcentaje y actualiza Users.rate.
     `CREATE TABLE IF NOT EXISTS Feedbacks (
          feedback_id VARCHAR(36) NOT NULL,
          user_id     VARCHAR(36) NOT NULL,
          client_id   VARCHAR(36) NOT NULL,
          product_id  VARCHAR(36) NOT NULL,
          comment     TEXT        NULL,
          stars       INT         NOT NULL,
          created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (feedback_id),
          KEY idx_feedbacks_user    (user_id),
          KEY idx_feedbacks_product (product_id),
          KEY idx_feedbacks_client  (client_id),
          KEY idx_feedbacks_stars   (stars)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 21. Feedback (legacy) ─────────────────────────────────────────────
     // Tabla alternativa de feedback (mantener por compatibilidad con código existente).
     `CREATE TABLE IF NOT EXISTS Feedback (
          feedback_id VARCHAR(36) NOT NULL,
          product_id  VARCHAR(36) NOT NULL,
          user_id     VARCHAR(36) NOT NULL,
          rating      INT         NOT NULL,
          comment     TEXT        NULL,
          created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (feedback_id),
          KEY idx_feedback_product (product_id),
          KEY idx_feedback_user    (user_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 22. Notifications ─────────────────────────────────────────────────
     // Notificaciones al vendedor cuando alguien compra su producto.
     // user_id: destinatario (el vendedor).
     // buyer: username del comprador.
     // is_read: marcado por GET /api/user/notification
     // unread: alias booleano de is_read (SET unread = FALSE en la misma query)
     // timestamp: alias de created_at para compatibilidad con el socket de notificaciones
     `CREATE TABLE IF NOT EXISTS Notifications (
          id         VARCHAR(36)   NOT NULL,
          user_id    VARCHAR(36)   NOT NULL,
          product_id VARCHAR(36)   NULL,
          image      TEXT          NULL,
          title      VARCHAR(255)  NULL,
          price      DECIMAL(12,2) NULL,
          buyer      VARCHAR(255)  NULL,
          is_read    TINYINT(1)    NOT NULL DEFAULT 0,
          unread     TINYINT(1)    NOT NULL DEFAULT 1,
          created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          timestamp  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY idx_notifications_user   (user_id),
          KEY idx_notifications_read   (is_read),
          KEY idx_notifications_unread (unread)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 23. chat_user_room_status ─────────────────────────────────────────
     // Sala de chat entre dos usuarios ligada a un producto (listing_id).
     // Se crea automáticamente al completar una compra (post_order / stripe_status).
     // Solo se crea si no existe ya una sala entre los dos usuarios.
     // unread_count_user_1: mensajes no leídos por user_id (el comprador / iniciador).
     // unread_count_user_2: mensajes no leídos por other_id (el vendedor).
     // Lógica de contadores en chat.socket.ts (send_message / join_room).
     `CREATE TABLE IF NOT EXISTS chat_user_room_status (
          id                  VARCHAR(36) NOT NULL,
          user_id             VARCHAR(36) NOT NULL,
          other_id            VARCHAR(36) NOT NULL,
          listing_id          VARCHAR(36) NULL,
          timestamp           DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          unread_count_user_1 INT         NOT NULL DEFAULT 0,
          unread_count_user_2 INT         NOT NULL DEFAULT 0,
          PRIMARY KEY (id),
          KEY idx_chat_room_user1   (user_id),
          KEY idx_chat_room_user2   (other_id),
          KEY idx_chat_room_listing (listing_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 24. Messages ──────────────────────────────────────────────────────
     // Mensajes de chat. chat_id referencia chat_user_room_status.id.
     // sender_id: UUID del usuario que envía el mensaje.
     // text: contenido del mensaje.
     // Leídos vía GET (readRoom controller) → SELECT * FROM Messages WHERE chat_id = ? ORDER BY timestamp ASC
     `CREATE TABLE IF NOT EXISTS Messages (
          message_id VARCHAR(36) NOT NULL,
          chat_id    VARCHAR(36) NOT NULL,
          sender_id  VARCHAR(36) NOT NULL,
          text       TEXT        NOT NULL,
          timestamp  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (message_id),
          KEY idx_messages_chat      (chat_id),
          KEY idx_messages_sender    (sender_id),
          KEY idx_messages_timestamp (timestamp)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 25. Chats (legacy / auxiliar) ─────────────────────────────────────
     // Tabla auxiliar con last_message. La lógica principal usa chat_user_room_status.
     `CREATE TABLE IF NOT EXISTS Chats (
          chat_id       VARCHAR(36) NOT NULL,
          participant_1 VARCHAR(36) NOT NULL,
          participant_2 VARCHAR(36) NOT NULL,
          product_id    VARCHAR(36) NULL,
          last_message  TEXT        NULL,
          last_update   DATETIME    NULL,
          is_read       TINYINT(1)  NOT NULL DEFAULT 0,
          created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (chat_id),
          KEY idx_chats_participant_1 (participant_1),
          KEY idx_chats_participant_2 (participant_2),
          KEY idx_chats_product       (product_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 26. Services (catálogo auxiliar) ──────────────────────────────────
     `CREATE TABLE IF NOT EXISTS Services (
          service_id  VARCHAR(36)   NOT NULL,
          seller_id   VARCHAR(36)   NOT NULL,
          name        VARCHAR(255)  NOT NULL,
          description TEXT          NULL,
          price       DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (service_id),
          KEY idx_services_seller (seller_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 27. Accounts (catálogo auxiliar) ──────────────────────────────────
     `CREATE TABLE IF NOT EXISTS Accounts (
          account_id  VARCHAR(36)  NOT NULL,
          seller_id   VARCHAR(36)  NOT NULL,
          name        VARCHAR(255) NOT NULL,
          information TEXT         NOT NULL,
          created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (account_id),
          KEY idx_accounts_seller (seller_id)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

     // ── 28. Assets (catálogo auxiliar de assets digitales) ────────────────
     `CREATE TABLE IF NOT EXISTS Assets (
          asset_id   VARCHAR(36)  NOT NULL,
          seller_id  VARCHAR(36)  NOT NULL,
          name       VARCHAR(255) NOT NULL,
          url        TEXT         NOT NULL,
          active     TINYINT(1)   NOT NULL DEFAULT 1,
          created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (asset_id),
          KEY idx_assets_seller (seller_id),
          KEY idx_assets_active (active)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,
];

async function recreateAllTables(): Promise<void> {
     const pool = mysql.createPool(dbConfig);

     console.log("⏳ Dropping existing tables...");
     for (const sql of dropStatements) {
          await pool.execute(sql);
          const tableName = sql.match(/DROP TABLE IF EXISTS (\w+)/)?.[1];
          if (tableName) console.log(`   ✓ Dropped: ${tableName}`);
     }

     console.log("\n⏳ Creating tables...");
     for (const sql of createStatements) {
          await pool.execute(sql);
          const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
          if (tableName) console.log(`   ✓ Created: ${tableName}`);
     }

     const [tables] = await pool.query("SHOW TABLES;");
     console.log("\n✅ Database recreated successfully.");
     console.log(`   Total tables: ${(tables as any[]).length}`);
     console.table(tables);

     await pool.end();
}

void recreateAllTables().catch((error) => {
     console.error("❌ Error recreating tables:", error);
     process.exit(1);
});
