const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const PORT = Number(process.env.PORT) || 3113;
const JWT_SECRET = process.env.JWT_SECRET || "dev_only_secret_change_me";
const OTP_EXPIRES_MINUTES = Number(process.env.OTP_EXPIRES_MINUTES) || 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =====================================================
// MySQL connection pool
// ระบบสมาชิก (login/register/forgot-password) ของ TATOE Optical ใช้ตาราง `group`
// ตามไฟล์ group.sql ที่มีอยู่แล้ว (เพิ่มคอลัมน์ password/role ให้ผ่าน migration,
// ดู database/tatoe_schema.sql) แทนที่จะสร้างตาราง users แยกใหม่
// =====================================================
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ip_std6730251514",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// =====================================================
// เตรียมตารางที่จำเป็นให้ครบตอน backend เริ่มทำงาน (ไม่ต้องรัน migration แยก)
// - `group`.password / `group`.role : เผื่อยังไม่ได้รัน database/tatoe_schema.sql
// - password_resets : เก็บ OTP สำหรับขั้นตอนลืมรหัสผ่าน
// =====================================================

async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`group_users\` (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      phone VARCHAR(50) NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(30) NOT NULL DEFAULT 'customer',
      avatar_url TEXT NULL,
      member_tier VARCHAR(100) NULL DEFAULT 'Member',
      member_points INT NOT NULL DEFAULT 0,
      shipping_address TEXT NULL,
      prescription_od_sphere VARCHAR(50) NULL,
      prescription_od_cylinder VARCHAR(50) NULL,
      prescription_os_sphere VARCHAR(50) NULL,
      prescription_os_cylinder VARCHAR(50) NULL,
      prescription_last_checked VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function ensurePasswordResetsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_resets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      expiresAt DATETIME NOT NULL,
      verified TINYINT(1) NOT NULL DEFAULT 0,
      used TINYINT(1) NOT NULL DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}


// =====================================================
// Product catalog (SQL source of truth)
// The admin UI writes here; the storefront/Virtual Try-On reads from here.
// We keep the table name `group_products` to match the project's SQL naming convention.
// If an older `group_products` table already exists, missing catalog columns are added
// without replacing existing rows.
// =====================================================
const PRODUCT_COLUMNS = {
  name: ['name', 'product_name'],
  subtitle: ['subtitle', 'sub_title'],
  colorName: ['color_name', 'colorName', 'color'],
  category: ['category'],
  shape: ['shape'],
  material: ['material'],
  price: ['price'],
  originalPrice: ['original_price', 'originalPrice'],
  discountPercentage: ['discount_percentage', 'discountPercentage'],
  rating: ['rating'],
  reviewCount: ['review_count', 'reviewCount'],
  salesCount: ['sales_count', 'salesCount'],
  tag: ['tag'],
  badge: ['badge'],
  stockStatus: ['stock_status', 'stockStatus'],
  stockCount: ['stock_count', 'stockCount'],
  images: ['images'],
  imageUrl: ['image_url', 'imageUrl'],
  overlayImage: ['overlay_image', 'overlayImage'],
  model3d: ['model_3d', 'model3d'],
  tryOnScale: ['try_on_scale', 'tryOnScale'],
  tryOnOffsetX: ['try_on_offset_x', 'tryOnOffsetX'],
  tryOnOffsetY: ['try_on_offset_y', 'tryOnOffsetY'],
  tryOnOffsetZ: ['try_on_offset_z', 'tryOnOffsetZ'],
  lensType: ['lens_type', 'lensType'],
  weight: ['weight'],
  warranty: ['warranty'],
  size: ['size'],
  description: ['description'],
};

const PRODUCT_ADD_COLUMNS = {
  subtitle: "VARCHAR(255) NULL",
  color_name: "VARCHAR(255) NOT NULL DEFAULT 'สีมาตรฐาน'",
  category: "VARCHAR(50) NOT NULL DEFAULT 'prescription'",
  shape: "VARCHAR(50) NOT NULL DEFAULT 'round'",
  material: "VARCHAR(50) NOT NULL DEFAULT 'titanium'",
  price: "DECIMAL(12,2) NOT NULL DEFAULT 0",
  original_price: "DECIMAL(12,2) NULL",
  discount_percentage: "DECIMAL(5,2) NULL",
  rating: "DECIMAL(3,2) NOT NULL DEFAULT 0",
  review_count: "INT NOT NULL DEFAULT 0",
  sales_count: "VARCHAR(100) NOT NULL DEFAULT '0'",
  tag: "VARCHAR(100) NULL",
  badge: "VARCHAR(50) NULL",
  stock_status: "VARCHAR(30) NOT NULL DEFAULT 'in_stock'",
  stock_count: "INT NOT NULL DEFAULT 0",
  images: "JSON NULL",
  overlay_image: "LONGTEXT NULL",
  model_3d: "LONGTEXT NULL",
  try_on_scale: "DECIMAL(8,4) NULL",
  try_on_offset_x: "DECIMAL(8,4) NULL",
  try_on_offset_y: "DECIMAL(8,4) NULL",
  try_on_offset_z: "DECIMAL(8,4) NULL",
  lens_type: "VARCHAR(255) NOT NULL DEFAULT ''",
  weight: "VARCHAR(100) NOT NULL DEFAULT ''",
  warranty: "VARCHAR(255) NOT NULL DEFAULT ''",
  size: "VARCHAR(100) NOT NULL DEFAULT ''",
  description: "TEXT NULL",
};

async function ensureProductsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`group_products\` (
      \`product_id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      \`name\` VARCHAR(255) NOT NULL,
      \`subtitle\` VARCHAR(255) NULL,
      \`color_name\` VARCHAR(255) NOT NULL DEFAULT 'สีมาตรฐาน',
      \`category\` VARCHAR(50) NOT NULL DEFAULT 'prescription',
      \`shape\` VARCHAR(50) NOT NULL DEFAULT 'round',
      \`material\` VARCHAR(50) NOT NULL DEFAULT 'titanium',
      \`price\` DECIMAL(12,2) NOT NULL DEFAULT 0,
      \`original_price\` DECIMAL(12,2) NULL,
      \`discount_percentage\` DECIMAL(5,2) NULL,
      \`rating\` DECIMAL(3,2) NOT NULL DEFAULT 0,
      \`review_count\` INT NOT NULL DEFAULT 0,
      \`sales_count\` VARCHAR(100) NOT NULL DEFAULT '0',
      \`tag\` VARCHAR(100) NULL,
      \`badge\` VARCHAR(50) NULL,
      \`stock_status\` VARCHAR(30) NOT NULL DEFAULT 'in_stock',
      \`stock_count\` INT NOT NULL DEFAULT 0,
      \`images\` JSON NULL,
      \`overlay_image\` LONGTEXT NULL,
      \`model_3d\` LONGTEXT NULL,
      \`try_on_scale\` DECIMAL(8,4) NULL,
      \`try_on_offset_x\` DECIMAL(8,4) NULL,
      \`try_on_offset_y\` DECIMAL(8,4) NULL,
      \`try_on_offset_z\` DECIMAL(8,4) NULL,
      \`lens_type\` VARCHAR(255) NOT NULL DEFAULT '',
      \`weight\` VARCHAR(100) NOT NULL DEFAULT '',
      \`warranty\` VARCHAR(255) NOT NULL DEFAULT '',
      \`size\` VARCHAR(100) NOT NULL DEFAULT '',
      \`description\` TEXT NULL,
      \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`product_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Add fields required by the current frontend to an older group_products table.
  const [rows] = await pool.query("SHOW COLUMNS FROM `group_products`");
  const existing = new Set(rows.map((row) => row.Field));

  for (const [column, definition] of Object.entries(PRODUCT_ADD_COLUMNS)) {
    if (!existing.has(column)) {
      await pool.query(`ALTER TABLE \`group_products\` ADD COLUMN \`${column}\` ${definition}`);
    }
  }
}

async function getProductSchema() {
  const [rows] = await pool.query("SHOW COLUMNS FROM `group_products`");
  const columns = rows.map((row) => row.Field);
  const findColumn = (aliases) => aliases.find((name) => columns.includes(name)) || null;

  // Support both the new product_id key and common legacy id column names.
  const idColumn = ['product_id', 'id', 'group_product_id'].find((name) => columns.includes(name));
  if (!idColumn) throw new Error('group_products ไม่มีคอลัมน์รหัสสินค้า (product_id/id/group_product_id)');

  const map = {};
  for (const [key, aliases] of Object.entries(PRODUCT_COLUMNS)) {
    map[key] = findColumn(aliases);
  }

  if (!map.name) throw new Error('group_products ไม่มีคอลัมน์ name/product_name');
  if (!map.price) throw new Error('group_products ไม่มีคอลัมน์ price');

  return { idColumn, columns, map };
}

function parseProductImages(row, schema) {
  const jsonValue = schema.map.images ? row[schema.map.images] : null;
  const imageUrl = schema.map.imageUrl ? row[schema.map.imageUrl] : null;

  if (Array.isArray(jsonValue)) return jsonValue.filter(Boolean).map(String);
  if (typeof jsonValue === 'string' && jsonValue.trim()) {
    try {
      const parsed = JSON.parse(jsonValue);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {}
    return [jsonValue];
  }
  if (imageUrl) return [String(imageUrl)];
  return [];
}

function numberOr(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function rowToProduct(row, schema) {
  const v = (key) => {
    const column = schema.map[key];
    return column ? row[column] : null;
  };
  const images = parseProductImages(row, schema);
  const productId = row[schema.idColumn];

  return {
    id: String(productId),
    name: String(v('name') || ''),
    subtitle: v('subtitle') || undefined,
    colorName: String(v('colorName') || 'สีมาตรฐาน'),
    category: String(v('category') || 'prescription'),
    shape: String(v('shape') || 'round'),
    material: String(v('material') || 'titanium'),
    price: numberOr(v('price')),
    originalPrice: v('originalPrice') == null ? undefined : numberOr(v('originalPrice')),
    discountPercentage: v('discountPercentage') == null ? undefined : numberOr(v('discountPercentage')),
    rating: numberOr(v('rating')),
    reviewCount: numberOr(v('reviewCount')),
    salesCount: String(v('salesCount') || '0'),
    tag: v('tag') || undefined,
    badge: v('badge') === 'Best Seller' || v('badge') === 'New' ? v('badge') : undefined,
    stockStatus: String(v('stockStatus') || 'in_stock'),
    stockCount: v('stockCount') == null ? undefined : numberOr(v('stockCount')),
    images,
    overlayImage: v('overlayImage') || undefined,
    model3d: v('model3d') || undefined,
    tryOnScale: v('tryOnScale') == null ? undefined : numberOr(v('tryOnScale')),
    tryOnOffsetX: v('tryOnOffsetX') == null ? undefined : numberOr(v('tryOnOffsetX')),
    tryOnOffsetY: v('tryOnOffsetY') == null ? undefined : numberOr(v('tryOnOffsetY')),
    tryOnOffsetZ: v('tryOnOffsetZ') == null ? undefined : numberOr(v('tryOnOffsetZ')),
    lensType: String(v('lensType') || ''),
    weight: String(v('weight') || ''),
    warranty: String(v('warranty') || ''),
    size: String(v('size') || ''),
    description: String(v('description') || ''),
  };
}

function authFromRequest(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAdmin(req, res, next) {
  const user = authFromRequest(req);
  if (!user) return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' });
  if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'เฉพาะผู้ดูแลระบบเท่านั้น' });
  req.authUser = user;
  next();
}

function buildProductDbValues(input = {}) {
  return {
    name: String(input.name || '').trim(),
    subtitle: input.subtitle == null ? null : String(input.subtitle).trim(),
    colorName: String(input.colorName || 'สีมาตรฐาน').trim(),
    category: String(input.category || 'prescription'),
    shape: String(input.shape || 'round'),
    material: String(input.material || 'titanium'),
    price: numberOr(input.price),
    originalPrice: input.originalPrice == null ? null : numberOr(input.originalPrice),
    discountPercentage: input.discountPercentage == null ? null : numberOr(input.discountPercentage),
    rating: numberOr(input.rating),
    reviewCount: numberOr(input.reviewCount),
    salesCount: String(input.salesCount || '0'),
    tag: input.tag == null ? null : String(input.tag),
    badge: input.badge === 'Best Seller' || input.badge === 'New' ? input.badge : null,
    stockStatus: String(input.stockStatus || 'in_stock'),
    stockCount: input.stockCount == null ? 0 : numberOr(input.stockCount),
    images: Array.isArray(input.images) ? input.images.filter(Boolean).map(String) : [],
    overlayImage: input.overlayImage == null ? null : String(input.overlayImage),
    model3d: input.model3d == null ? null : String(input.model3d),
    tryOnScale: input.tryOnScale == null ? null : numberOr(input.tryOnScale),
    tryOnOffsetX: input.tryOnOffsetX == null ? null : numberOr(input.tryOnOffsetX),
    tryOnOffsetY: input.tryOnOffsetY == null ? null : numberOr(input.tryOnOffsetY),
    tryOnOffsetZ: input.tryOnOffsetZ == null ? null : numberOr(input.tryOnOffsetZ),
    lensType: String(input.lensType || ''),
    weight: String(input.weight || ''),
    warranty: String(input.warranty || ''),
    size: String(input.size || ''),
    description: String(input.description || ''),
  };
}

async function insertProduct(input) {
  const schema = await getProductSchema();
  const values = buildProductDbValues(input);
  if (!values.name) throw new Error('กรุณากรอกชื่อสินค้า');

  const fieldValues = [];
  const placeholders = [];
  const params = [];

  for (const [key, value] of Object.entries(values)) {
    const column = schema.map[key];
    if (!column) continue;
    // If an old schema has a dedicated image_url field but no JSON images field,
    // store the first image there.
    let dbValue = value;
    if (key === 'images' && column !== schema.map.images && schema.map.imageUrl) continue;
    if (key === 'images') dbValue = JSON.stringify(value);
    fieldValues.push(`\`${column}\``);
    placeholders.push('?');
    params.push(dbValue);
  }

  if (schema.map.imageUrl && !schema.map.images) {
    fieldValues.push(`\`${schema.map.imageUrl}\``);
    placeholders.push('?');
    params.push(values.images[0] || null);
  }

  const [result] = await pool.query(
    `INSERT INTO \`group_products\` (${fieldValues.join(', ')}) VALUES (${placeholders.join(', ')})`,
    params
  );

  const id = result.insertId;
  const [rows] = await pool.query(
    `SELECT * FROM \`group_products\` WHERE \`${schema.idColumn}\` = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) throw new Error('บันทึกสินค้าแล้วแต่ไม่พบข้อมูลที่เพิ่มใน SQL');
  return rowToProduct(rows[0], schema);
}

async function updateProductById(id, input) {
  const schema = await getProductSchema();
  const currentRows = await pool.query(
    `SELECT * FROM \`group_products\` WHERE \`${schema.idColumn}\` = ? LIMIT 1`,
    [id]
  );
  if (!currentRows[0].length) return null;

  const current = rowToProduct(currentRows[0][0], schema);
  const merged = buildProductDbValues({ ...current, ...input, id });

  const assignments = [];
  const params = [];
  for (const [key, value] of Object.entries(merged)) {
    const column = schema.map[key];
    if (!column) continue;
    if (key === 'images' && schema.map.images) {
      assignments.push(`\`${column}\` = ?`);
      params.push(JSON.stringify(value));
    } else if (key !== 'images') {
      assignments.push(`\`${column}\` = ?`);
      params.push(value);
    }
  }
  if (schema.map.imageUrl && !schema.map.images && Object.prototype.hasOwnProperty.call(input, 'images')) {
    assignments.push(`\`${schema.map.imageUrl}\` = ?`);
    params.push(merged.images[0] || null);
  }

  if (!assignments.length) return current;
  params.push(id);
  await pool.query(
    `UPDATE \`group_products\` SET ${assignments.join(', ')} WHERE \`${schema.idColumn}\` = ?`,
    params
  );

  const [rows] = await pool.query(
    `SELECT * FROM \`group_products\` WHERE \`${schema.idColumn}\` = ? LIMIT 1`,
    [id]
  );
  return rows.length ? rowToProduct(rows[0], schema) : null;
}

async function bootstrap() {
  try {
    await ensureUsersTable();
    await ensurePasswordResetsTable();
    await ensureProductsTable();
    console.log("Database ready: `group_users` + `password_resets` + `group_products`");
  } catch (err) {
    console.error("DB BOOTSTRAP ERROR:", err);
  }
}
bootstrap();

// =====================================================
// ตัวส่งอีเมล OTP — ใช้ Resend ถ้ามี RESEND_API_KEY ตั้งค่าไว้ (ดู backend/.env.example)
// ถ้ายังไม่ได้ตั้งค่า ระบบจะพิมพ์ OTP ออกทาง console แทน เพื่อให้ทดสอบตอน dev ได้ทันที
// =====================================================
let resend = null;
if (process.env.RESEND_API_KEY) {
  const { Resend } = require("resend");
  resend = new Resend(process.env.RESEND_API_KEY);
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(toEmail, otp) {
  if (!resend) {
    console.log(`[DEV] OTP สำหรับ ${toEmail}: ${otp} (หมดอายุใน ${OTP_EXPIRES_MINUTES} นาที)`);
    return;
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM || "TATOE Optical <onboarding@resend.dev>",
    to: toEmail,
    subject: "รหัส OTP สำหรับตั้งรหัสผ่านใหม่ - TATOE Optical",
    text: `รหัส OTP ของคุณคือ ${otp} (หมดอายุใน ${OTP_EXPIRES_MINUTES} นาที) หากคุณไม่ได้ร้องขอ กรุณาเพิกเฉยต่ออีเมลนี้`,
    html: `
      <div style="font-family: sans-serif; padding: 24px;">
        <h2 style="color:#3b82f6; margin: 0 0 12px;">TATOE Optical</h2>
        <p style="margin: 0 0 16px;">รหัส OTP สำหรับตั้งรหัสผ่านใหม่ของคุณคือ</p>
        <p style="font-size: 32px; font-weight: 800; letter-spacing: 6px; margin: 0 0 16px;">${otp}</p>
        <p style="margin: 0 0 16px;">รหัสนี้จะหมดอายุใน ${OTP_EXPIRES_MINUTES} นาที</p>
        <p style="color:#888; font-size: 12px; margin: 0;">หากคุณไม่ได้ร้องขอเปลี่ยนรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
      </div>
    `,
  });

  if (error) throw error;
}

// =====================================================
// Product catalog API
// GET is public so storefront + Virtual Try-On always read from SQL.
// POST/PUT/DELETE are admin-only and persist directly to `group_products`.
// =====================================================
app.get("/api/products", async (_req, res) => {
  try {
    const schema = await getProductSchema();
    const [rows] = await pool.query(
      `SELECT * FROM \`group_products\` ORDER BY \`${schema.idColumn}\` DESC`
    );
    return res.json({
      success: true,
      products: rows.map((row) => rowToProduct(row, schema)),
    });
  } catch (err) {
    console.error("GET PRODUCTS ERROR:", err);
    return res.status(500).json({ success: false, message: "อ่านรายการสินค้าจาก SQL ไม่สำเร็จ" });
  }
});

app.post("/api/products", requireAdmin, async (req, res) => {
  try {
    const product = await insertProduct(req.body || {});
    return res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("CREATE PRODUCT ERROR:", err);
    return res.status(500).json({ success: false, message: err.message || "เพิ่มสินค้าใน SQL ไม่สำเร็จ" });
  }
});

app.put("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const product = await updateProductById(req.params.id, req.body || {});
    if (!product) return res.status(404).json({ success: false, message: "ไม่พบสินค้าที่ต้องการแก้ไข" });
    return res.json({ success: true, product });
  } catch (err) {
    console.error("UPDATE PRODUCT ERROR:", err);
    return res.status(500).json({ success: false, message: err.message || "แก้ไขสินค้าใน SQL ไม่สำเร็จ" });
  }
});

app.delete("/api/products/:id", requireAdmin, async (req, res) => {
  try {
    const schema = await getProductSchema();
    const [result] = await pool.query(
      `DELETE FROM \`group_products\` WHERE \`${schema.idColumn}\` = ?`,
      [req.params.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: "ไม่พบสินค้าที่ต้องการลบ" });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("DELETE PRODUCT ERROR:", err);
    return res.status(500).json({ success: false, message: "ลบสินค้าใน SQL ไม่สำเร็จ" });
  }
});

app.get("/", (req, res) => {
  res.json({ success: true, message: "TATOE Optical auth API is running" });
});

// =====================================================
// GET /api/health
app.get("/api/health", (_req, res) => {
  res.json({ success: true, service: "TATOE Optical API", port: PORT });
});

// POST /api/register
// สร้างสมาชิกใหม่ -> เพิ่มแถวใหม่ในตาราง `group` (group_id = user id)
// รหัสผ่านถูก hash ด้วย bcrypt ก่อนเก็บลงคอลัมน์ password เสมอ
// =====================================================
app.post("/api/register", async (req, res) => {
  try {
    const { user_name, email, phone, password } = req.body || {};

    if (!user_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกชื่อผู้ใช้ อีเมล และรหัสผ่าน",
      });
    }

    const cleanUserName = String(user_name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : null;

    if (cleanUserName.length < 2) {
      return res.status(400).json({ success: false, message: "ชื่อผู้ใช้ต้องมีอย่างน้อย 2 ตัวอักษร" });
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    const [existing] = await pool.query(
      "SELECT user_id FROM `group_users` WHERE email = ? LIMIT 1",
      [cleanEmail]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "อีเมลนี้ถูกใช้สมัครสมาชิกไปแล้ว" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);

    await pool.query(
      `INSERT INTO \`group_users\`
        (user_name, email, phone, password, role, member_tier, member_points)
      VALUES (?, ?, ?, ?, 'customer', 'Member', 0)`,
      [cleanUserName, cleanEmail, cleanPhone, passwordHash]
    );

    return res.status(201).json({ success: true, message: "สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================================================
// POST /api/login
// ตรวจสอบด้วยอีเมลหรือเบอร์โทร + รหัสผ่าน (เทียบกับ bcrypt hash ในคอลัมน์ password)
// ถ้าถูกต้อง จะออก JWT อายุ 7 วัน
// =====================================================
app.post("/api/login", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body || {};

    if (!emailOrPhone || !password) {
      return res.status(400).json({ success: false, message: "กรุณากรอกอีเมล/เบอร์โทร และรหัสผ่าน" });
    }

    const identifier = String(emailOrPhone).trim();

    const [rows] = await pool.query(
      "SELECT * FROM `group_users` WHERE email = ? OR phone = ? ORDER BY user_id DESC LIMIT 1",
      [identifier.toLowerCase(), identifier]
    );

    if (rows.length === 0 || !rows[0].password) {
      return res.status(401).json({ success: false, message: "อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const account = rows[0];
    const passwordMatches = await bcrypt.compare(String(password), account.password);

    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "อีเมล/เบอร์โทร หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      {
        id: account.user_id,
        email: account.email,
        role: account.role || "customer"
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: account.user_id,
        user_name: account.user_name,
        email: account.email,
        phone: account.phone,
        role: account.role || "customer",
        avatar_url: account.avatar_url,
        member_tier: account.member_tier,
        member_points: account.member_points,
        shipping_address: account.shipping_address
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================================================
// POST /api/forgot-password
// รับ email -> ถ้ามีสมาชิกอยู่จริงจะสร้าง OTP 6 หลักและส่งอีเมล
// ตอบข้อความเดียวกันเสมอไม่ว่าจะเจออีเมลในระบบหรือไม่ (กันการไล่เดาอีเมล)
// =====================================================
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!EMAIL_RE.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "รูปแบบอีเมลไม่ถูกต้อง" });
    }

    const genericMessage = `ถ้าอีเมลนี้มีอยู่ในระบบ เราได้ส่งรหัส OTP ไปให้ทางอีเมลแล้ว (หมดอายุใน ${OTP_EXPIRES_MINUTES} นาที) กรุณาตรวจสอบกล่องจดหมาย รวมถึง Junk/Spam ด้วย`;

    const [users] = await pool.query(
      "SELECT user_id FROM `group_users` WHERE email = ? LIMIT 1",
      [cleanEmail]
    );

    if (users.length === 0) {
      return res.json({ success: true, message: genericMessage });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    await pool.query(
      `INSERT INTO password_resets (email, otp, expiresAt, verified, used)
       VALUES (?, ?, ?, 0, 0)`,
      [cleanEmail, otp, expiresAt]
    );

    try {
      await sendOtpEmail(cleanEmail, otp);
    } catch (mailErr) {
      console.error("SEND OTP EMAIL ERROR:", mailErr);
      return res.status(500).json({
        success: false,
        message: "ส่งอีเมลไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า RESEND_API_KEY ใน backend/.env",
      });
    }

    return res.json({ success: true, message: genericMessage });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================================================
// POST /api/verify-otp
// ตรวจ OTP -> ถ้าถูกต้อง ยังไม่หมดอายุ ยังไม่เคยถูกใช้ จะออก resetToken (JWT อายุ 10 นาที)
// =====================================================
app.post("/api/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanOtp = String(otp || "").trim();

    if (!cleanEmail || !cleanOtp) {
      return res.status(400).json({ success: false, message: "กรุณากรอกอีเมลและรหัส OTP" });
    }

    const [rows] = await pool.query(
      `SELECT * FROM password_resets
       WHERE email = ? AND otp = ? AND used = 0
       ORDER BY id DESC LIMIT 1`,
      [cleanEmail, cleanOtp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: "รหัส OTP ไม่ถูกต้อง" });
    }

    const resetRow = rows[0];

    if (new Date(resetRow.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: "รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่" });
    }

    await pool.query("UPDATE password_resets SET verified = 1 WHERE id = ?", [resetRow.id]);

    const resetToken = jwt.sign(
      { email: cleanEmail, resetId: resetRow.id, purpose: "password_reset" },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    return res.json({ success: true, resetToken });
  } catch (err) {
    console.error("VERIFY OTP ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// =====================================================
// POST /api/reset-password
// ใช้ resetToken จาก /api/verify-otp ยืนยันตัวตน แล้วอัปเดตรหัสผ่านใหม่ (hash ด้วย bcrypt)
// =====================================================
app.post("/api/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body || {};

    if (!resetToken || !newPassword) {
      return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วน" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" });
    }

    let payload;
    try {
      payload = jwt.verify(resetToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({
        success: false,
        message: "เซสชันสำหรับตั้งรหัสผ่านใหม่หมดอายุแล้ว กรุณาขอ OTP ใหม่",
      });
    }

    if (payload.purpose !== "password_reset") {
      return res.status(401).json({ success: false, message: "Token ไม่ถูกต้อง" });
    }

    const [resetRows] = await pool.query(
      "SELECT * FROM password_resets WHERE id = ? AND email = ? LIMIT 1",
      [payload.resetId, payload.email]
    );

    if (resetRows.length === 0 || !resetRows[0].verified || resetRows[0].used) {
      return res.status(401).json({
        success: false,
        message: "คำขอนี้ถูกใช้ไปแล้วหรือไม่ถูกต้อง กรุณาขอ OTP ใหม่",
      });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);

    await pool.query(
      "UPDATE `group_users` SET password = ?, updated_at = NOW() WHERE email = ?",
      [passwordHash, payload.email]
    );

    await pool.query("UPDATE password_resets SET used = 1 WHERE id = ?", [payload.resetId]);

    return res.json({
      success: true,
      message: "ตั้งรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่",
    });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`TATOE Optical auth backend running at http://localhost:${PORT}`);
});
