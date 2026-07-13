import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------------------
// Load .env
// ---------------------------------------------------------------------------
const envPath = resolve(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const DB = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function randomDate(daysAgoStart: number, daysAgoEnd: number): string {
  const now = Date.now();
  const msStart = now - daysAgoStart * 86400000;
  const msEnd = now - daysAgoEnd * 86400000;
  return new Date(msEnd + Math.random() * (msStart - msEnd))
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);
}

function pgLiteral(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function batchInsert(
  table: string,
  columns: string[],
  rows: any[][],
  batchSize = 500,
): Promise<void> {
  if (rows.length === 0) return;
  const colNames = columns.join(', ');
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const tuples = batch.map(
      (row) => `(${row.map((v) => pgLiteral(v)).join(', ')})`,
    );
    await DB.query(
      `INSERT INTO ${table} (${colNames}) VALUES ${tuples.join(', ')}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Data pools
// ---------------------------------------------------------------------------
const FIRST_NAMES = [
  'Ahmad', 'Budi', 'Candra', 'Dewi', 'Eko', 'Fitri', 'Gunawan', 'Hadi',
  'Indah', 'Joko', 'Kartika', 'Lestari', 'Mulyono', 'Nurul', 'Putri',
  'Rini', 'Sari', 'Tono', 'Umar', 'Wahyu', 'Yanti', 'Zainal', 'Adi',
  'Bintang', 'Citra', 'Dian', 'Erwin', 'Fajar', 'Gita', 'Haris', 'Irfan',
  'Kevin', 'Lia', 'Mega', 'Nanda', 'Oki', 'Prasetyo', 'Rina', 'Susi',
  'Taufik', 'Umi', 'Vina', 'Wawan', 'Yuli', 'Zaki', 'Agus', 'Bayu',
  'Cici', 'Dodi', 'Esti', 'Fani',
];

const LAST_NAMES = [
  'Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Hidayat', 'Nugroho',
  'Saputra', 'Hartono', 'Setiawan', 'Susanto', 'Gunawan', 'Permana',
  'Hermawan', 'Kurniawan', 'Rahmawati', 'Wulandari', 'Lestari', 'Puspita',
  'Sari', 'Anggraini', 'Mahendra', 'Pramono', 'Sudrajat', 'Haryanto',
  'Yulianto', 'Firmansyah', 'Iskandar', 'Marpaung', 'Nasution', 'Lubis',
  'Siregar', 'Simatupang', 'Sinaga', 'Pasaribu', 'Purba', 'Situmorang',
  'Lumbangaol', 'Nainggolan', 'Panjaitan', 'Manurung', 'Hutapea',
  'Handayani', 'Wahyuni', 'Palupi', 'Kusumawati', 'Halim', 'Tanuwijaya',
  'Gunardi', 'Soewito', 'Atmaja',
];

function randomName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}

const TEMPLATE_CATEGORIES: { cat: string; names: string[] }[] = [
  {
    cat: 'pernikahan',
    names: [
      'Pernikahan Elegan Modern', 'Undangan Akad Nikah Adat Jawa',
      'Wedding Garden Party', 'Pernikahan Minimalis Putih',
      'Undangan Nikah Rustic', 'Pernikahan Elegan Gold',
      'Akad Nikah Syar i', 'Resepsi Pernikahan Mewah',
      'Wedding Outdoor Romantic', 'Pernikahan Adat Sunda',
    ],
  },
  {
    cat: 'ulang_tahun',
    names: [
      'Ulang Tahun Anak Ceria', 'Sweet Seventeen Glamour',
      'Birthday Party Colorful', 'Ulang Tahun Emas',
      'Pesta Ulang Tahun Balon', 'Milad Elegan Modern',
      'Sweet Seventeen Garden Party', 'Ulang Tahun Anak Superhero',
      'Birthday Milestone 50th', 'Party Youngster Fun',
    ],
  },
  {
    cat: 'khitanan',
    names: [
      'Khitanan Islami Modern', 'Walimatul Khitan Elegan',
      'Sunatan Anak Ceria', 'Khitanan Adat Nusantara',
      'Undangan Khitan Simpel', 'Khitan Ceria Anak Sholeh',
      'Walimatul Khitan Klasik', 'Khitanan Putra Daerah',
    ],
  },
  {
    cat: 'wisuda',
    names: [
      'Wisuda Elegan Modern', 'Graduation Party Gold',
      'Wisuda Minimalis', 'Graduation Celebration Blue',
      'Undangan Wisuda Simpel', 'Graduation Ceremony Classic',
      'Wisuda Sarjana Muda', 'Graduation Cap n Gown',
    ],
  },
  {
    cat: 'syukuran',
    names: [
      'Syukuran Rumah Baru', 'Tasyakuran Aqiqah',
      'Syukuran 4 Bulanan', 'Selamatan Modern',
      'Syukuran Panen Raya', 'Tasyakuran Khitan',
      'Syukuran Pernikahan Sederhana', 'Selamatan Kelulusan',
    ],
  },
  {
    cat: 'pengajian',
    names: [
      'Pengajian Akbar', 'Majelis Taklim Modern',
      'Undangan Pengajian Rutin', 'Pengajian Bulan Ramadhan',
      'Majelis Dzikir Bersama', 'Undangan Isra Mi raj',
      'Maulid Nabi Muhammad SAW', 'Pengajian Akhirussanah',
    ],
  },
  {
    cat: 'reuni',
    names: [
      'Reuni SMA Modern', 'Reuni Keluarga Besar',
      'Gathering Alumni', 'Reuni Akbar Nostalgia',
      'Temu Kangen Kampus', 'Reuni Angkatan 2000an',
      'Gathering Alumni SMP', 'Reuni Keluarga Tahunan',
    ],
  },
  {
    cat: 'sunatan',
    names: [
      'Walimatul Khitan', 'Sunatan Massal',
      'Khitanan Ceria', 'Sunatan Anak Sholeh',
      'Undangan Khitan Modern', 'Khitanan Bareng',
      'Sunatan Ceria Islami', 'Walimatul Khitan Sederhana',
    ],
  },
];

const ALL_CATEGORIES = TEMPLATE_CATEGORIES.map((c) => c.cat);
const ALL_TEMPLATE_NAMES = TEMPLATE_CATEGORIES.flatMap((c) => c.names);

const VENUES = [
  'Gedung Serbaguna Graha Mandiri', 'Hotel Santika Premiere',
  'Aula Masjid Agung', 'Restoran Bale Gendang',
  'Gedung Pertemuan Balai Kota', 'Hotel Grand Mercure',
  'Aula Gedung Perkantoran', 'Rumah Makan Saung Kuring',
  'Balai Desa Sukamaju', 'Gedung Serbaguna Graha Mulia',
  'Hotel Aston Bogor', 'Restoran Kampung Daun',
  'Aula Perguruan Tinggi', 'Gedung Pernikahan Indah',
  'Ballroom Hotel Crown', 'Restoran De Paris',
  'Balai RW 05', 'Aula Kecamatan',
  'Gedung Serbaguna Istana Bunga', 'Hotel Novotel',
];

const VENUE_ADDRESSES = [
  'Jl. Merdeka No. 123, Jakarta Pusat',
  'Jl. Sudirman Kav. 45, Jakarta Selatan',
  'Jl. Thamrin No. 10, Jakarta Pusat',
  'Jl. Gatot Subroto Blok A, Semarang',
  'Jl. Diponegoro No. 56, Surabaya',
  'Jl. Ahmad Yani Km 5, Bandung',
  'Jl. Raya Bogor No. 78, Bogor',
  'Jl. Malioboro No. 3, Yogyakarta',
  'Jl. Pahlawan No. 22, Medan',
  'Jl. Urip Sumoharjo No. 15, Makassar',
  'Jl. Pemuda No. 88, Depok',
  'Jl. Margonda Raya No. 234, Depok',
  'Jl. Cibubur Raya No. 45, Jakarta Timur',
  'Jl. Kalimalang No. 77, Bekasi',
  'Jl. Tunjungan No. 33, Surabaya',
  'Jl. MT Haryono No. 12, Balikpapan',
  'Jl. Veteran No. 67, Palembang',
  'Jl. Teuku Umar No. 89, Denpasar',
  'Jl. Sam Ratulangi No. 41, Manado',
  'Jl. Jend Sudirman No. 5, Tangerang',
];

const NOTIFICATION_SUBJECTS = [
  'Pesanan Anda telah dikonfirmasi',
  'Pembayaran berhasil diverifikasi',
  'Undangan Anda telah diterbitkan',
  'Template baru telah disetujui',
  'Pengingat acara besok',
  'RSVP tamu baru diterima',
  'Pembaruan status pesanan',
  'Undangan digital siap dibagikan',
];

const NOTIFICATION_MESSAGES = [
  'Terima kasih telah melakukan pemesanan. Pesanan Anda sedang diproses.',
  'Pembayaran Anda telah kami terima. Acara Anda siap untuk dipublikasikan.',
  'Undangan digital untuk acara Anda telah siap. Silakan bagikan ke tamu.',
  'Selamat! Template yang Anda ajukan telah disetujui oleh admin.',
  'Acara Anda akan berlangsung besok. Pastikan semua persiapan sudah selesai.',
  'Seorang tamu telah mengkonfirmasi kehadiran untuk acara Anda.',
  'Status pesanan Anda telah diperbarui. Silakan cek dashboard Anda.',
  'Undangan digital Anda sudah bisa diakses oleh para tamu.',
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('🔌 Connecting to database...');
  await DB.query('SELECT 1');
  console.log('✅ Connected.\n');

  // ---- CLEAR ALL DATA ----
  console.log('🧹 Clearing all existing data...');
  await DB.query(
    'TRUNCATE TABLE template_sales, payments, orders, rsvp_confirmations, check_ins, invitations, events, templates, notifications, users CASCADE',
  );
  console.log('✅ All tables truncated.\n');

  // ---- Pre-compute bcrypt hash ----
  console.log('🔐 Hashing password...');
  const PASSWORD_HASH = await bcrypt.hash('password123', 10);
  console.log('✅ Password hash ready.\n');

  // ======================================================================
  // 1. USERS
  // ======================================================================
  console.log('👤 Generating users...');
  const adminIds: string[] = [];
  const adminRows: any[][] = [];
  for (let i = 1; i <= 5; i++) {
    const id = randomUUID();
    adminIds.push(id);
    adminRows.push([
      id,
      `Admin ${pick(FIRST_NAMES)}`,
      `admin${i}@kabari.com`,
      PASSWORD_HASH,
      'admin',
      randomDate(365, 0),
      randomDate(365, 0),
    ]);
  }
  await batchInsert('users', ['id', 'full_name', 'email', 'password_hash', 'role', 'created_at', 'updated_at'], adminRows);
  console.log(`  ✅ 5 admins inserted.`);

  const creatorIds: string[] = [];
  const creatorRows: any[][] = [];
  for (let i = 1; i <= 1000; i++) {
    const id = randomUUID();
    creatorIds.push(id);
    creatorRows.push([
      id,
      randomName(),
      `kreator${i}@kabari.com`,
      PASSWORD_HASH,
      'kreator',
      randomDate(365, 0),
      randomDate(365, 0),
    ]);
  }
  await batchInsert('users', ['id', 'full_name', 'email', 'password_hash', 'role', 'created_at', 'updated_at'], creatorRows);
  console.log('  ✅ 1,000 creators inserted.');

  const pelangganIds: string[] = [];
  const pelangganRows: any[][] = [];
  for (let i = 1; i <= 1000; i++) {
    const id = randomUUID();
    pelangganIds.push(id);
    pelangganRows.push([
      id,
      randomName(),
      `pelanggan${i}@kabari.com`,
      PASSWORD_HASH,
      'pelanggan',
      randomDate(365, 0),
      randomDate(365, 0),
    ]);
  }
  await batchInsert('users', ['id', 'full_name', 'email', 'password_hash', 'role', 'created_at', 'updated_at'], pelangganRows);
  console.log('  ✅ 1,000 pelanggan (subscribers) inserted.');

  const allUserIds = [...adminIds, ...creatorIds, ...pelangganIds];
  console.log(`  📊 Total users: ${allUserIds.length}\n`);

  // ======================================================================
  // 2. TEMPLATES
  // ======================================================================
  console.log('📄 Generating templates...');
  const templateIds: string[] = [];
  const templateRows: any[][] = [];
  const templateCreatorMap: Record<string, string> = {}; // templateId -> creatorId

  // Each creator gets 0-3 templates, ensure >=1000 total
  const templateNameIdx: { [cat: string]: number } = {};
  for (const c of TEMPLATE_CATEGORIES) templateNameIdx[c.cat] = 0;

  for (let ci = 0; ci < creatorIds.length; ci++) {
    const nTemplates = ci < 700 ? 2 : ci < 950 ? 1 : 0; // 700*2 + 250*1 = 1650 max, but some get 0
    // Actually 700*2=1400, 250*1=250, total=1650. Let me adjust.
    // Let me do: 600*2 + 100*1 = 1300. 300 creators get 0 templates. That's fine.
    // Wait, I need at least 1000. Let me do 500*2 + 200*1 = 1200. 300 get 0.
    // Better: 800*2 = 1600, 200 get 0. But that might be too many.
    // Let me target exactly 1200 templates.

    let tCount = 0;
    if (ci < 500) tCount = 2;
    else if (ci < 700) tCount = 1;
    // else 0 -> 300 creators have no templates

    for (let t = 0; t < tCount; t++) {
      const catInfo = pick(TEMPLATE_CATEGORIES);
      const nameIdx = templateNameIdx[catInfo.cat];
      const baseName = catInfo.names[nameIdx % catInfo.names.length];
      templateNameIdx[catInfo.cat] = nameIdx + 1;
      const variation = t === 0 ? '' : ` ${['Series', 'Edisi', 'Koleksi', 'Varian'][t % 4]} ${t + 1}`;
      const templateName = `${baseName}${variation}`;

      // Pick a status
      const statusRoll = Math.random();
      let status: string;
      if (statusRoll < 0.7) status = 'published';
      else if (statusRoll < 0.85) status = 'pending_review';
      else if (statusRoll < 0.95) status = 'draft';
      else status = 'rejected';

      const price = status === 'published' ? rand(50000, 500000) : 0;
      const id = randomUUID();
      templateIds.push(id);
      templateCreatorMap[id] = creatorIds[ci];
      const now = randomDate(365, 0);
      templateRows.push([
        id,
        templateName,
        catInfo.cat,
        `${templateName} - template undangan digital untuk acara ${catInfo.cat}.`,
        null,
        null,
        price,
        status,
        status === 'rejected' ? 'Template perlu direvisi' : null,
        creatorIds[ci],
        now,
        now,
      ]);
    }
  }

  await batchInsert(
    'templates',
    ['id', 'name', 'category', 'description', 'thumbnail_url', 'file_url', 'price', 'status', 'admin_notes', 'creator_id', 'created_at', 'updated_at'],
    templateRows,
  );
  console.log(`  ✅ ${templateIds.length} templates inserted.\n`);

  // ======================================================================
  // 3. EVENTS
  // ======================================================================
  console.log('🎉 Generating events...');
  const eventIds: string[] = [];
  const eventRows: any[][] = [];
  const eventPelangganMap: Record<string, string> = {}; // eventId -> pelangganId
  const eventTemplateMap: Record<string, string> = {}; // eventId -> templateId

  for (let pi = 0; pi < pelangganIds.length; pi++) {
    const nEvents = pi < 500 ? 2 : 1; // 500*2 + 500*1 = 1500
    for (let e = 0; e < nEvents; e++) {
      const id = randomUUID();
      eventIds.push(id);
      const pelangganId = pelangganIds[pi];
      eventPelangganMap[id] = pelangganId;
      const templateId = pick(templateIds);
      eventTemplateMap[id] = templateId;

      const statusRoll = Math.random();
      let status: string;
      if (statusRoll < 0.35) status = 'active';
      else if (statusRoll < 0.65) status = 'completed';
      else if (statusRoll < 0.85) status = 'draft';
      else status = 'cancelled';

      const now = randomDate(365, 30);
      const eventDate = new Date(
        new Date(now).getTime() + rand(7, 180) * 86400000,
      )
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);

      eventRows.push([
        id,
        `Acara ${pick(FIRST_NAMES)} & ${pick(FIRST_NAMES)}`,
        eventDate,
        pick(VENUES),
        pick(VENUE_ADDRESSES),
        null,
        '[]' as any,
        status,
        pelangganId,
        templateId,
        now,
        now,
      ]);
    }
  }
  await batchInsert(
    'events',
    ['id', 'event_name', 'event_date', 'venue_name', 'venue_address', 'maps_url', 'gallery_urls', 'status', 'pelanggan_id', 'template_id', 'created_at', 'updated_at'],
    eventRows,
  );
  console.log(`  ✅ ${eventIds.length} events inserted.\n`);

  // ======================================================================
  // 4. INVITATIONS (guests)
  // ======================================================================
  console.log('✉️ Generating invitations...');
  const invitationIds: string[] = [];
  const invitationRows: any[][] = [];
  const invitationEventMap: Record<string, string> = {};

  for (const eventId of eventIds) {
    // Skip cancelled events — no guests
    const evt = eventRows.find((r) => r[0] === eventId);
    if (evt && evt[7] === 'cancelled') continue;
    if (evt && evt[7] === 'draft') continue;

    const nGuests = rand(5, 30);
    for (let g = 0; g < nGuests; g++) {
      const id = randomUUID();
      invitationIds.push(id);
      invitationEventMap[id] = eventId;
      const cat = pick(['digital', 'fisik']);
      const rsvp = pick(['pending', 'hadir', 'tidak_hadir']);
      const now = randomDate(365, 0);
      invitationRows.push([
        id,
        randomName(),
        `08${rand(100000000, 999999999)}`,
        `${pick(FIRST_NAMES).toLowerCase()}.${pick(LAST_NAMES).toLowerCase()}@email.com`,
        cat,
        randomUUID(),
        rsvp,
        rsvp === 'hadir' ? rand(1, 5) : 0,
        rsvp === 'hadir' && Math.random() > 0.3 ? 'sudah_check_in' : 'belum_check_in',
        eventId,
        now,
        now,
      ]);
    }
  }
  await batchInsert(
    'invitations',
    ['id', 'tamu_name', 'tamu_phone', 'tamu_email', 'category', 'qr_code_token', 'rsvp_status', 'jumlah_hadir', 'check_in_status', 'event_id', 'created_at', 'updated_at'],
    invitationRows,
  );
  console.log(`  ✅ ${invitationIds.length} invitations inserted.\n`);

  // ======================================================================
  // 5. ORDERS
  // ======================================================================
  console.log('🛒 Generating orders...');
  const orderIds: string[] = [];
  const orderRows: any[][] = [];
  const orderPelangganMap: Record<string, string> = {};
  const orderEventMap: Record<string, string> = {};

  const packages = [
    { type: 'basic', price: 99000 },
    { type: 'premium', price: 249000 },
    { type: 'exclusive', price: 499000 },
  ];

  // Target 1000+ orders, distributed among pelanggan
  const orderCount = 1200;

  for (let i = 0; i < orderCount; i++) {
    const id = randomUUID();
    orderIds.push(id);

    const pelangganId = pelangganIds[rand(0, pelangganIds.length - 1)];
    orderPelangganMap[id] = pelangganId;

    // Find an event for this pelanggan
    const pelangganEvents = eventIds.filter((eid) => eventPelangganMap[eid] === pelangganId);
    const eventId = pelangganEvents.length > 0 ? pick(pelangganEvents) : pick(eventIds);
    orderEventMap[id] = eventId;

    const pkg = pick(packages);
    const statusRoll = Math.random();
    let status: string;
    if (statusRoll < 0.8) status = 'paid';
    else if (statusRoll < 0.9) status = 'pending';
    else if (statusRoll < 0.95) status = 'failed';
    else status = 'cancelled';

    const paymentMethod = pick(['va', 'qris', 'transfer']);
    const now = randomDate(365, 0);
    orderRows.push([
      id,
      pkg.type,
      pkg.price,
      paymentMethod,
      status,
      pelangganId,
      eventId,
      now,
      now,
    ]);
  }
  await batchInsert(
    'orders',
    ['id', 'package_type', 'total_amount', 'preferred_payment_method', 'status', 'pelanggan_id', 'event_id', 'created_at', 'updated_at'],
    orderRows,
  );
  console.log(`  ✅ ${orderIds.length} orders inserted.\n`);

  // ======================================================================
  // 6. PAYMENTS
  // ======================================================================
  console.log('💳 Generating payments...');
  const paymentIds: string[] = [];
  const paymentRows: any[][] = [];

  const paidOrderIds = orderRows.filter((r) => r[4] === 'paid').map((r) => r[0]);
  // Also add payments for some pending orders
  const pendingOrderIdsExtra = orderRows
    .filter((r) => r[4] === 'pending')
    .slice(0, 100)
    .map((r) => r[0]);
  const ordersWithPayment = [...paidOrderIds, ...pendingOrderIdsExtra];

  for (let i = 0; i < ordersWithPayment.length; i++) {
    const orderId = ordersWithPayment[i];
    const order = orderRows.find((r) => r[0] === orderId);
    if (!order) continue;

    const id = randomUUID();
    paymentIds.push(id);

    const method = pick(['va', 'qris', 'transfer']);
    const provider = method === 'va' ? 'BCA' : method === 'qris' ? 'QRIS' : 'Mandiri';
    const isPaid = order[4] === 'paid';

    const now = randomDate(365, 0);
    const paidAt = isPaid
      ? new Date(new Date(now).getTime() + rand(1, 48) * 3600000)
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19)
      : null;

    const dateStr = now.slice(0, 10).replace(/-/g, '');
    const seq = String(i + 1).padStart(5, '0');
    const invoiceNumber = `INV-${dateStr}-${seq}`;

    paymentRows.push([
      id,
      invoiceNumber,
      method,
      order[2], // total_amount
      provider,
      `ext-ref-${randomUUID().slice(0, 12)}`,
      isPaid ? 'paid' : 'pending',
      paidAt,
      orderId,
      now,
    ]);
  }
  await batchInsert(
    'payments',
    ['id', 'invoice_number', 'payment_method', 'amount', 'provider', 'external_ref', 'status', 'paid_at', 'order_id', 'created_at'],
    paymentRows,
  );
  console.log(`  ✅ ${paymentIds.length} payments inserted.\n`);

  // ======================================================================
  // 7. TEMPLATE SALES
  // ======================================================================
  console.log('💰 Generating template sales (royalties)...');
  const templateSaleIds: string[] = [];
  const templateSaleRows: any[][] = [];

  for (const orderId of paidOrderIds) {
    const order = orderRows.find((r) => r[0] === orderId);
    if (!order) continue;

    const eventId = orderEventMap[orderId];
    const templateId = eventTemplateMap[eventId];
    if (!templateId) continue;

    const id = randomUUID();
    templateSaleIds.push(id);

    const royaltyPercent = rand(10, 30);
    const royaltyAmount = Math.round((Number(order[2]) * royaltyPercent) / 100);

    const now = randomDate(365, 0);
    const paidToCreator = Math.random() > 0.3
      ? new Date(new Date(now).getTime() + rand(1, 30) * 86400000)
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19)
      : null;

    templateSaleRows.push([
      id,
      royaltyAmount,
      royaltyPercent,
      paidToCreator,
      templateId,
      orderId,
      now,
    ]);
  }
  await batchInsert(
    'template_sales',
    ['id', 'royalty_amount', 'royalty_percent', 'paid_to_creator_at', 'template_id', 'order_id', 'created_at'],
    templateSaleRows,
  );
  console.log(`  ✅ ${templateSaleIds.length} template sales inserted.\n`);

  // ======================================================================
  // 8. RSVP CONFIRMATIONS
  // ======================================================================
  console.log('📋 Generating RSVP confirmations...');
  const rsvpIds: string[] = [];
  const rsvpRows: any[][] = [];

  for (const invId of invitationIds) {
    const inv = invitationRows.find((r) => r[0] === invId);
    if (!inv) continue;

    const shouldRsvp = inv[6] !== 'pending' || Math.random() > 0.4;
    if (!shouldRsvp) continue;

    const rsvpStatus = inv[6] === 'pending' ? pick(['hadir', 'tidak_hadir']) : inv[6];

    const id = randomUUID();
    rsvpIds.push(id);

    const isProxy = Math.random() > 0.85;
    const proxyBy = isProxy ? pick(pelangganIds) : null;
    const now = randomDate(365, 0);

    rsvpRows.push([
      id,
      invId,
      rsvpStatus,
      rsvpStatus === 'hadir' ? rand(1, 4) : 0,
      rsvpStatus === 'tidak_hadir' ? 'Maaf tidak bisa hadir' : 'Insya Allah hadir',
      isProxy,
      proxyBy,
      now,
    ]);
  }
  await batchInsert(
    'rsvp_confirmations',
    ['id', 'invitation_id', 'rsvp_status', 'jumlah_hadir', 'message', 'is_proxy', 'proxy_by_user_id', 'confirmed_at'],
    rsvpRows,
  );
  console.log(`  ✅ ${rsvpIds.length} RSVP confirmations inserted.\n`);

  // ======================================================================
  // 9. CHECK-INS
  // ======================================================================
  console.log('📍 Generating check-ins...');
  const checkInIds: string[] = [];
  const checkInRows: any[][] = [];

  for (const invId of invitationIds) {
    const inv = invitationRows.find((r) => r[0] === invId);
    if (!inv) continue;
    if (inv[8] !== 'sudah_check_in') continue;

    const id = randomUUID();
    checkInIds.push(id);

    const method = pick(['qr_scan', 'manual']);
    const checkedInBy = pick(adminIds);
    const now = randomDate(365, 0);

    checkInRows.push([id, invId, now, checkedInBy, method]);
  }
  await batchInsert(
    'check_ins',
    ['id', 'invitation_id', 'checked_in_at', 'checked_in_by', 'method'],
    checkInRows,
  );
  console.log(`  ✅ ${checkInIds.length} check-ins inserted.\n`);

  // ======================================================================
  // 10. NOTIFICATIONS
  // ======================================================================
  console.log('🔔 Generating notifications...');
  const notifIds: string[] = [];
  const notifRows: any[][] = [];

  const notifCount = 3000;
  for (let i = 0; i < notifCount; i++) {
    const id = randomUUID();
    notifIds.push(id);

    const channel = pick(['whatsapp', 'email', 'in_app']);
    const status = pick(['queued', 'sent', 'sent', 'sent', 'failed']); // mostly sent
    const subject = pick(NOTIFICATION_SUBJECTS);
    const message = pick(NOTIFICATION_MESSAGES);

    const now = randomDate(365, 0);
    const sentAt = status === 'sent' ? now : null;

    notifRows.push([
      id,
      subject,
      message,
      channel,
      status,
      pick(allUserIds),
      Math.random() > 0.7 ? pick(invitationIds) : null,
      sentAt,
      now,
    ]);
  }
  await batchInsert(
    'notifications',
    ['id', 'subject', 'message', 'channel', 'status', 'user_id', 'invitation_id', 'sent_at', 'created_at'],
    notifRows,
  );
  console.log(`  ✅ ${notifIds.length} notifications inserted.\n`);

  // ======================================================================
  // SUMMARY
  // ======================================================================
  console.log('═══════════════════════════════════════');
  console.log('  🎉 SEEDING COMPLETE 🎉');
  console.log('═══════════════════════════════════════');
  console.log(`  👤 Users:            ${allUserIds.length}`);
  console.log(`     - Admins:         ${adminIds.length}`);
  console.log(`     - Creators:       ${creatorIds.length}`);
  console.log(`     - Subscribers:    ${pelangganIds.length}`);
  console.log(`  📄 Templates:        ${templateIds.length}`);
  console.log(`  🎉 Events:           ${eventIds.length}`);
  console.log(`  ✉️ Invitations:      ${invitationIds.length}`);
  console.log(`  🛒 Orders:           ${orderIds.length}`);
  console.log(`  💳 Payments:         ${paymentIds.length}`);
  console.log(`  💰 Template Sales:   ${templateSaleIds.length}`);
  console.log(`  📋 RSVPs:            ${rsvpIds.length}`);
  console.log(`  📍 Check-ins:        ${checkInIds.length}`);
  console.log(`  🔔 Notifications:    ${notifIds.length}`);
  console.log('═══════════════════════════════════════\n');

  await DB.end();
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
