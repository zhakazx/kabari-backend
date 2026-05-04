# Product Requirements Document (PRD)
## KABARI — Platform Undangan Digital & Manajemen Acara

**Versi:** 1.0  
**Status:** Draft  
**Tanggal:** 2025  
**Tujuan Dokumen:** Referensi implementasi untuk AI agent / developer

---

## 1. RINGKASAN PRODUK

**KABARI** adalah platform SaaS berbasis web untuk pembuatan undangan digital, manajemen tamu, konfirmasi kehadiran (RSVP), dan pencatatan kehadiran di hari acara. Platform ini menggabungkan ekosistem marketplace template desain yang dibuat oleh Kreator independen.

### Problem Statement
- Undangan fisik tidak efisien dan tidak bisa dilacak respons-nya secara real-time.
- Pengelolaan daftar tamu, RSVP, dan absensi di hari acara masih manual dan rentan error.
- Tidak ada platform terpadu yang menghubungkan Pelanggan, Kreator template, dan proses check-in.

### Solusi
Platform KABARI menyediakan:
1. Pembuatan undangan digital berbasis template dari marketplace.
2. Manajemen daftar tamu dengan QR Code unik per tamu.
3. RSVP digital (termasuk proxy RSVP untuk tamu lansia).
4. Check-in real-time di hari acara via QR scan.
5. Dashboard statistik dan laporan buku tamu digital.

---

## 2. AKTOR / PENGGUNA

| Aktor | Deskripsi | Akses Utama |
|---|---|---|
| **Pelanggan** | Penyelenggara acara yang membeli paket layanan KABARI | Buat acara, kelola tamu, lihat dashboard, unduh laporan |
| **Kreator** | Desainer template undangan yang menjual di marketplace | Upload template, lihat royalti |
| **Tamu** | Penerima undangan yang mengkonfirmasi kehadiran | Buka undangan via link/QR, isi RSVP |
| **Penerima Tamu** | Petugas check-in di lokasi acara | Scan QR tamu di pintu masuk |
| **Admin** | Pengelola platform KABARI | Validasi/tolak template Kreator, manajemen platform |

---

## 3. FITUR & USER STORIES

### 3.1 Autentikasi & Manajemen Pengguna
- Sebagai pengguna baru, saya bisa mendaftar akun dengan memilih role (Pelanggan / Kreator).
- Sebagai pengguna terdaftar, saya bisa login dan mendapatkan token JWT.
- Sebagai pengguna, saya bisa mengelola profil akun saya.

### 3.2 Marketplace Template
- Sebagai Pelanggan, saya bisa menelusuri dan mencari template undangan berdasarkan kategori dan keyword.
- Sebagai Kreator, saya bisa mengunggah template desain baru untuk dijual (status awal: `pending_review`).
- Sebagai Admin, saya bisa memvalidasi (publish/reject) template yang diunggah Kreator.
- Sebagai Kreator, saya mendapat royalti setiap kali template saya dibeli.

### 3.3 Pembuatan Acara & Undangan
- Sebagai Pelanggan, saya bisa membuat acara baru dengan memilih template dari marketplace.
- Sebagai Pelanggan, saya bisa mengisi detail acara (nama acara, tanggal, venue, alamat, link maps, galeri).
- Sebagai Pelanggan, saya bisa menambahkan daftar tamu secara batch (nama, nomor HP, email, kategori digital/fisik).
- Setiap tamu otomatis mendapat QR code token unik.

### 3.4 Pembayaran
- Sebagai Pelanggan, saya bisa membuat order untuk paket layanan KABARI.
- Sebagai Pelanggan, saya bisa membayar via QRIS, Virtual Account, atau Transfer Bank.
- Sistem otomatis menerima notifikasi callback dari payment gateway dan memperbarui status order.

### 3.5 RSVP
- Sebagai Tamu, saya bisa membuka halaman undangan melalui link unik atau QR Code.
- Sebagai Tamu, saya bisa mengisi RSVP (hadir / tidak hadir, jumlah tamu, pesan).
- Sebagai Pelanggan, saya bisa melakukan Proxy RSVP atas nama tamu lansia yang tidak bisa mengisi sendiri (`is_proxy = TRUE`).

### 3.6 Check-In di Hari Acara
- Sebagai Penerima Tamu, saya bisa memindai QR code tamu di pintu masuk.
- Sistem menampilkan nama tamu, status RSVP, dan status check-in (sukses / gagal / tidak_terdaftar).
- Data kehadiran tercatat secara real-time ke buku tamu digital.

### 3.7 Dashboard & Laporan
- Sebagai Pelanggan, saya bisa melihat statistik real-time (total tamu, hadir, tidak hadir, belum RSVP, sudah check-in).
- Sebagai Pelanggan, saya bisa mengunduh laporan buku tamu digital dalam format XLSX atau PDF setelah acara.

### 3.8 Notifikasi
- Sistem mengirim notifikasi konfirmasi pembayaran kepada Pelanggan.
- Sistem mengirim pengingat acara kepada tamu.
- Sistem mengirim notifikasi status RSVP kepada Pelanggan.
- Channel notifikasi: WhatsApp, Email, In-App alert.

---

## 4. ARSITEKTUR SISTEM

### 4.1 Daftar Service

| Service | Fungsi | Input | Output | Integrasi |
|---|---|---|---|---|
| **User Service** | Registrasi, login, manajemen profil | Data registrasi & login | Profil pengguna, token autentikasi | Invitation Service, Payment Service |
| **Invitation Service** | Pembuatan undangan, pemilihan template, distribusi tautan | Detail acara, template_id, daftar tamu | Undangan digital, tautan unik tamu | User Service, Payment Service, Template Service, Google Maps API |
| **RSVP Service** | Proses konfirmasi kehadiran (digital & proxy), update statistik real-time | Konfirmasi RSVP tamu | Status RSVP, statistik dashboard | Invitation Service, Notification Service |
| **Payment Service** | Transaksi pembayaran paket layanan via payment gateway | Data transaksi, paket layanan | Status transaksi, konfirmasi pembayaran | Payment Gateway (Bank/QRIS), User Service |
| **Notification Service** | Kirim notifikasi konfirmasi, pengingat acara, status RSVP | Event notifikasi dari service lain | Notifikasi ke pengguna (email/push/WA) | Payment Service, RSVP Service, QR & Checkin Service |
| **QR & Checkin Service** | Generate QR Code per tamu, proses scan, catat kehadiran | Data tamu, pemindaian QR Code | QR Code unik, data kehadiran | Invitation Service, Notification Service |
| **Template & Marketplace Service** | Kelola unggahan, validasi, dan penjualan template oleh Kreator | Template dari Kreator, permintaan validasi Admin | Template di marketplace, komisi Kreator | User Service, Invitation Service |
| **Analytic Module** | KPI platform, CLV, churn analysis | Data platform database | Laporan analitik | Platform Database |

### 4.2 External Integration
- **Payment Gateway**: QRIS / Virtual Account / Bank Transfer
- **Google Maps API**: Embed peta lokasi venue ke undangan

---

## 5. DOMAIN-DRIVEN DESIGN (DDD)

Platform KABARI dibagi menjadi 5 Bounded Context yang terpisah:

### Identity Context
- **Entitas:** `User (id, nama, email, password_hash, peran, status_akun)`
- **Tanggung jawab:** Autentikasi dan otorisasi semua pengguna platform.
- **Alasan dipisah:** Keamanan & manajemen identitas adalah domain independen, tidak boleh bergantung pada logika bisnis undangan.

### Catalog Context
- **Entitas:** `Template (id, nama_desain, kreator_id, harga, kategori, status_validasi, aset_desain)`
- **Tanggung jawab:** Siklus hidup template dari upload Kreator → validasi Admin → dipilih Pelanggan.
- **Alasan dipisah:** Proses kurasi & validasi Admin harus berjalan independen tanpa mengganggu operasional pembuatan undangan.

### Invitation Context
- **Entitas:** `Undangan (id, pelanggan_id, template_id, detail_acara, tautan_unik, status_aktif, daftar_tamu)`, `Tamu (id, undangan_id, nama, tipe, QR_code, status_RSVP, status_kehadiran)`
- **Tanggung jawab:** Pembuatan undangan, manajemen daftar tamu, distribusi tautan.
- **Alasan dipisah:** Memiliki siklus kerja dan aturan bisnis berbeda dari proses pembayaran dan kehadiran.

### Payment Context
- **Entitas:** `Transaksi (id, pelanggan_id, paket_layanan, jumlah_bayar, metode_pembayaran, status, timestamp)`
- **Tanggung jawab:** Transaksi pembelian paket layanan dan distribusi komisi ke Kreator.
- **Alasan dipisah:** Transaksi keuangan memiliki aturan keamanan dan audit tersendiri; harus terisolasi dari logika bisnis undangan.

### Attendance Context
- **Entitas:** `Tamu (status_RSVP, status_kehadiran_aktual, QR_code_unik)`
- **Tanggung jawab:** Konfirmasi kehadiran, scan QR Code, pencatatan buku tamu digital di hari acara.
- **Alasan dipisah:** Kehadiran terjadi secara real-time di lokasi dengan beban tinggi dalam waktu singkat; infrastruktur dan aktor berbeda dari pengelolaan undangan.

---

## 6. DATA MODEL (DATABASE SCHEMA)

### Tabel: `users`
| Atribut | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR (PK) | Unique identifier |
| `full_name` | VARCHAR | Nama lengkap |
| `email` | VARCHAR | Email (unique) |
| `password_hash` | VARCHAR | Password terenkripsi |
| `role` | ENUM | `pelanggan` / `kreator` / `penerima_tamu` / `admin` |
| `created_at` | TIMESTAMP | Waktu registrasi |

### Tabel: `templates`
| Atribut | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR (PK) | Unique identifier |
| `creator_id` | VARCHAR (FK → users) | Kreator pemilik template |
| `name` | VARCHAR | Nama template |
| `thumbnail_url` | VARCHAR | URL preview thumbnail |
| `price` | DECIMAL | Harga template |
| `status` | ENUM | `draft` / `pending_review` / `published` |
| `created_at` | TIMESTAMP | Waktu upload |

### Tabel: `events`
| Atribut | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR (PK) | Unique identifier |
| `pelanggan_id` | VARCHAR (FK → users) | Pemilik acara |
| `template_id` | VARCHAR (FK → templates) | Template yang digunakan |
| `event_name` | VARCHAR | Nama acara |
| `event_date` | DATETIME | Tanggal & waktu acara |
| `venue_name` | VARCHAR | Nama venue |
| `venue_address` | TEXT | Alamat venue |
| `maps_url` | VARCHAR | Link Google Maps |
| `galeri_url` | VARCHAR | URL galeri foto |
| `status` | ENUM | `draft` / `active` / `completed` |

### Tabel: `invitations`
| Atribut | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR (PK) | Unique identifier |
| `event_id` | VARCHAR (FK → events) | Acara terkait |
| `tamu_name` | VARCHAR | Nama tamu |
| `tamu_phone` | VARCHAR | Nomor HP tamu |
| `tamu_email` | VARCHAR | Email tamu |
| `category` | ENUM | `digital` / `fisik` |
| `qr_code_token` | VARCHAR | Token QR unik per tamu |
| `rsvp_status` | ENUM | `pending` / `hadir` / `tidak_hadir` |
| `created_at` | TIMESTAMP | Waktu dibuat |

### Tabel: `rsvp_confirmations`
| Atribut | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR (PK) | Unique identifier |
| `invitation_id` | VARCHAR (FK → invitations) | Undangan terkait |
| `rsvp_status` | ENUM | `hadir` / `tidak_hadir` |
| `jumlah_hadir` | INTEGER | Jumlah orang yang hadir |
| `message` | TEXT | Pesan dari tamu |
| `is_proxy` | BOOLEAN | `TRUE` jika diisi Pelanggan atas nama tamu lansia |
| `confirmed_at` | TIMESTAMP | Waktu konfirmasi |

### Tabel: `check_ins`
| Atribut | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR (PK) | Unique identifier |
| `invitation_id` | VARCHAR (FK → invitations) | Undangan terkait |
| `checked_in_at` | TIMESTAMP | Waktu check-in |
| `checked_in_by` | VARCHAR (FK → users) | Petugas yang scan |
| `method` | ENUM | `qr_scan` / `manual` |

### Tabel: `orders`
| Atribut | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR (PK) | Unique identifier |
| `pelanggan_id` | VARCHAR (FK → users) | Pembeli |
| `event_id` | VARCHAR (FK → events) | Acara terkait |
| `package_type` | VARCHAR | Tipe paket layanan |
| `total_amount` | DECIMAL | Total harga |
| `status` | ENUM | `pending` / `paid` / `failed` / `cancelled` |
| `created_at` | TIMESTAMP | Waktu order dibuat |

### Tabel: `payments`
| Atribut | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR (PK) | Unique identifier |
| `order_id` | VARCHAR (FK → orders) | Order terkait |
| `invoice_number` | VARCHAR | Nomor invoice |
| `payment_method` | ENUM | `va` / `qris` / `transfer` |
| `amount` | DECIMAL | Jumlah dibayar |
| `provider` | VARCHAR | Nama payment gateway |
| `external_ref` | VARCHAR | Referensi dari gateway |
| `status` | ENUM | `pending` / `paid` / `failed` / `expired` |
| `paid_at` | TIMESTAMP | Waktu pembayaran berhasil |

### Tabel: `template_sales`
| Atribut | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR (PK) | Unique identifier |
| `template_id` | VARCHAR (FK → templates) | Template yang terjual |
| `order_id` | VARCHAR (FK → orders) | Order terkait |
| `royalty_amount` | DECIMAL | Nominal royalti |
| `royalty_percent` | DECIMAL | Persentase royalti |
| `paid_to_creator_at` | TIMESTAMP | Waktu royalti dibayarkan ke Kreator |

### Tabel: `notifications`
| Atribut | Tipe | Keterangan |
|---|---|---|
| `id` | VARCHAR (PK) | Unique identifier |
| `user_id` | VARCHAR (FK → users) | Penerima notifikasi |
| `invitation_id` | VARCHAR (FK → invitations, nullable) | Undangan terkait (opsional) |
| `channel` | ENUM | `whatsapp` / `email` / `in_app` |
| `subject` | VARCHAR | Judul notifikasi |
| `message` | TEXT | Isi notifikasi |
| `status` | ENUM | `queued` / `sent` / `failed` |
| `created_at` | TIMESTAMP | Waktu dibuat |
| `sent_at` | TIMESTAMP | Waktu dikirim |

---

## 7. API DESIGN

Base URL: `/api/v1`  
Autentikasi: Bearer JWT Token (kecuali endpoint publik)

### 7.1 Auth

#### `POST /api/v1/auth/register`
Registrasi akun baru.
- **Akses:** Publik
- **Request:** `full_name`, `email`, `password`, `role`
- **Response:** `user_id`, `name`, `role`, `access_token`

#### `POST /api/v1/auth/login`
Login dan mendapatkan JWT.
- **Akses:** Semua role
- **Request:** `email`, `password`
- **Response:** `user_id`, `name`, `role`, `access_token`

---

### 7.2 Templates

#### `GET /api/v1/templates`
Ambil daftar template yang sudah dipublikasikan.
- **Akses:** Publik / Pelanggan
- **Query Params:** `category`, `keyword`, `page`, `limit`
- **Response:** List `{ id, name, thumbnail_url, price, creator }`

#### `POST /api/v1/templates`
Kreator upload template baru.
- **Akses:** Kreator
- **Request:** `name`, `category`, `price`, `file_url`, `thumbnail_url`
- **Response:** `{ template_id, name, status: "pending_review" }`

#### `PATCH /api/v1/templates/{id}/validate`
Admin validasi atau tolak template.
- **Akses:** Admin
- **Request:** `status` (`published` / `rejected`), `notes`
- **Response:** `{ template_id, status_baru, updated_at }`

---

### 7.3 Events

#### `POST /api/v1/events`
Pelanggan buat acara baru.
- **Akses:** Pelanggan
- **Request:** `template_id`, `event_name`, `event_date`, `venue_name`, `venue_address`, `maps_url`
- **Response:** `{ event_id, event_name, status: "draft" }`

#### `POST /api/v1/events/{event_id}/invitations`
Tambah daftar tamu secara batch ke acara.
- **Akses:** Pelanggan
- **Request:** `list_tamu: [{ tamu_name, tamu_phone, tamu_email, category }]`
- **Response:** List `{ invitation_id, tamu_name, qr_code_token }`

#### `GET /api/v1/events/{event_id}/dashboard`
Statistik RSVP & kehadiran real-time.
- **Akses:** Pelanggan
- **Response:** `{ total_tamu, hadir, tidak_hadir, belum_rsvp, sudah_check_in }`

#### `GET /api/v1/events/{event_id}/report`
Unduh laporan buku tamu digital.
- **Akses:** Pelanggan
- **Query Params:** `format` (`xlsx` / `pdf`)
- **Response:** `{ file_url }`

---

### 7.4 Orders & Payments

#### `POST /api/v1/orders`
Buat order pembayaran paket layanan.
- **Akses:** Pelanggan
- **Request:** `event_id`, `package_type`
- **Response:** `{ order_id, invoice_number, total_amount, status: "pending" }`

#### `POST /api/v1/payments`
Inisiasi transaksi pembayaran ke gateway.
- **Akses:** Pelanggan
- **Request:** `order_id`, `payment_method` (`va` / `qris` / `transfer`)
- **Response:** `{ payment_id, virtual_account / qr_string, amount, expired_at }`

#### `POST /api/v1/payments/callback`
Terima notifikasi dari payment gateway (webhook).
- **Akses:** Payment Gateway (eksternal)
- **Request:** `invoice_id`, `status`, `paid_at`, `reference_no`, `signature`
- **Response:** `{ message: "Callback processed" }`
- **Catatan:** Endpoint ini harus divalidasi signature-nya sebelum memproses update status.

---

### 7.5 Invitations (Akses Tamu)

#### `GET /api/v1/invitations/{token}`
Tamu buka halaman undangan.
- **Akses:** Publik (via link/QR)
- **Path Param:** `qr_code_token`
- **Response:** `{ event_name, event_date, venue, maps_url, galeri, form_rsvp }`

#### `POST /api/v1/invitations/{token}/rsvp`
Tamu isi konfirmasi kehadiran.
- **Akses:** Tamu Undangan
- **Request:** `rsvp_status` (`hadir` / `tidak_hadir`), `jumlah_hadir`, `message`
- **Response:** `{ invitation_id, rsvp_status, confirmed_at }`

---

### 7.6 Check-In

#### `POST /api/v1/check-ins`
Penerima Tamu scan QR di pintu masuk acara.
- **Akses:** Penerima Tamu
- **Request:** `qr_code_token`
- **Response:** `{ tamu_name, rsvp_status, check_in_status }` — status: `sukses` / `gagal` / `tidak_terdaftar`

---

## 8. NON-FUNCTIONAL REQUIREMENTS

| Aspek | Requirement |
|---|---|
| **Performa** | Dashboard & check-in harus merespons dalam < 1 detik saat beban tinggi di hari acara |
| **Skalabilitas** | Attendance Context harus bisa di-scale out secara independen |
| **Keamanan** | Semua endpoint (kecuali publik) wajib validasi JWT; payment callback wajib validasi signature |
| **Ketersediaan** | Uptime minimal 99.5% terutama saat mendekati hari acara |
| **Audit Trail** | Semua transaksi keuangan harus tercatat lengkap dengan timestamp |
| **Notifikasi** | Notifikasi RSVP dan pembayaran harus terkirim dalam < 5 menit setelah event |

---

## 9. BUSINESS RULES

1. **Status Template:** Template Kreator hanya bisa digunakan oleh Pelanggan jika statusnya `published`.
2. **Proxy RSVP:** Field `is_proxy` pada tabel `rsvp_confirmations` wajib `TRUE` jika RSVP diisi oleh Pelanggan atas nama tamu, bukan oleh tamu sendiri.
3. **QR Code Unik:** Setiap tamu dalam satu acara harus memiliki `qr_code_token` yang unik dan tidak bisa digunakan ulang.
4. **Akses Dashboard:** Hanya Pelanggan pemilik acara (`pelanggan_id`) yang boleh mengakses dashboard dan laporan acara tersebut.
5. **Royalti Kreator:** Setiap kali template terjual (order berstatus `paid`), sistem otomatis mencatat entri di `template_sales` dengan nominal dan persentase royalti.
6. **Callback Payment:** Sistem harus memverifikasi `signature` pada setiap callback sebelum mengubah status order/payment.
7. **Status Undangan Token:** Endpoint `GET /api/v1/invitations/{token}` bersifat publik, namun hanya mengembalikan data jika `event.status = active`.

---

## 10. ALUR UTAMA (HAPPY PATH)

### Alur Pelanggan Membuat Undangan & Menerima Tamu

```
1. Pelanggan registrasi/login
2. Pelanggan browse marketplace → pilih template
3. Pelanggan buat event (POST /events) → status: draft
4. Pelanggan tambah daftar tamu (POST /events/{id}/invitations) → sistem generate QR per tamu
5. Pelanggan buat order (POST /orders) → status: pending
6. Pelanggan bayar (POST /payments) → dapatkan VA/QRIS
7. Pelanggan bayar via bank/QRIS
8. Payment Gateway kirim callback (POST /payments/callback) → order status: paid, event status: active
9. Sistem kirim notifikasi konfirmasi pembayaran ke Pelanggan
10. Tamu menerima undangan (link/QR) → buka halaman undangan (GET /invitations/{token})
11. Tamu isi RSVP (POST /invitations/{token}/rsvp)
12. Sistem update statistik dashboard real-time
13. Di hari acara: Penerima Tamu scan QR (POST /check-ins) → catat kehadiran
14. Setelah acara: Pelanggan unduh laporan (GET /events/{id}/report)
```

---

## 11. CATATAN IMPLEMENTASI UNTUK AI

- **Gunakan VARCHAR untuk semua Primary Key** — tidak menggunakan auto-increment integer.
- **Semua timestamp menggunakan UTC.**
- **JWT** harus menyertakan `user_id` dan `role` dalam payload untuk keperluan otorisasi di setiap service.
- **Endpoint callback payment** (`/api/v1/payments/callback`) harus di-whitelist IP dari payment gateway dan memvalidasi HMAC signature.
- **Tabel `invitations`** menyimpan data tamu per undangan; berbeda dengan entitas `Tamu` di Attendance Context yang fokus pada status kehadiran aktual.
- **Real-time dashboard** direkomendasikan menggunakan WebSocket atau Server-Sent Events (SSE) agar statistik update tanpa polling.
- **Pada Attendance Context**, siapkan infrastruktur untuk menangani burst traffic (banyak scan QR dalam waktu singkat di hari acara).