# Kabari Backend

Platform Undangan Digital & Manajemen Acara — backend API untuk mengelola acara, undangan digital, RSVP, check-in, pembayaran, dan laporan secara real-time.

## Tech Stack

- **Framework:** [NestJS](https://nestjs.com/) (Node.js / TypeScript)
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Cache & Queue:** Redis (Bull queues)
- **Real-time:** Socket.IO (WebSockets)
- **Auth:** Passport + JWT
- **Validation:** class-validator / class-transformer
- **API Docs:** Swagger (OpenAPI)
- **Testing:** Jest

## Features

- **Authentication & Authorization** — JWT-based auth dengan role-based access control.
- **User Management** — registrasi, login, dan manajemen pengguna.
- **Event Management** — CRUD acara dengan detail lengkap.
- **Digital Invitations** — buat dan kelola undangan digital.
- **RSVP** — respon undangan dari tamu (hadir/tidak hadir).
- **Check-in** — check-in tamu saat acara berlangsung.
- **Templates** — template undangan yang dapat dikustomisasi.
- **Orders & Payments** — pemesanan dan pembayaran tiket/acara.
- **Notifications** — notifikasi real-time dan background jobs via Bull/Redis.
- **Reports & Analytics** — laporan dan analitik acara (export Excel).
- **File Uploads** — upload file/gambar dengan static serving.
- **Real-time Dashboard** — WebSocket gateway untuk data real-time.

## Prerequisites

- Node.js (v20+ recommended)
- npm
- PostgreSQL (gunakan Podman/Docker jika di local)
- Redis (gunakan Podman/Docker jika di local)

## Installation

```bash
$ npm install
```

## Environment Variables

Buat file `.env` di root project dengan isi seperti berikut:

```env
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=kabari-dev-secret-key-do-not-use-in-production
JWT_EXPIRATION=7d

# Database (PostgreSQL)
DATABASE_URL=postgresql://kabari_user:kabari_pass@localhost:5433/kabari_db

# Redis
REDIS_URL=redis://localhost:6379

# File Upload
UPLOAD_DEST=./uploads
MAX_FILE_SIZE=10485760
```

> **Catatan:** Jika menjalankan PostgreSQL/Redis via Podman/Docker, sesuaikan `DATABASE_URL` dan `REDIS_URL` sesuai port mapping yang digunakan.

## Database Setup (Podman/Docker)

```bash
# PostgreSQL
podman run -d --name kabari-postgres \
  -e POSTGRES_USER=kabari_user \
  -e POSTGRES_PASSWORD=kabari_pass \
  -e POSTGRES_DB=kabari_db \
  -p 5433:5432 \
  postgres:16

# Redis
podman run -d --name kabari-redis \
  -p 6379:6379 \
  redis:7-alpine
```

TypeORM akan otomatis menyinkronkan entitas saat `NODE_ENV=development`.

## Running the App

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# debug mode
$ npm run start:debug

# production mode
$ npm run start:prod
```

Aplikasi akan berjalan di:
- API Base URL: `http://localhost:3000/api/v1`
- Swagger Docs: `http://localhost:3000/api/docs`

## API Documentation

Setelah aplikasi berjalan, buka Swagger UI di:

```
http://localhost:3000/api/docs
```

Semua endpoint yang memerlukan autentikasi menggunakan **Bearer Token** (JWT).

## Project Structure

```
src/
├── common/               # Guards, decorators, interceptors, filters, utils
├── config/               # Konfigurasi database, redis, dan env validation
├── gateways/             # WebSocket gateways (Socket.IO)
├── modules/              # Fitur utama aplikasi
│   ├── auth/
│   ├── users/
│   ├── events/
│   ├── invitations/
│   ├── rsvp/
│   ├── checkins/
│   ├── templates/
│   ├── orders/
│   ├── payments/
│   ├── notifications/
│   ├── reports/
│   └── analytics/
├── queues/               # Bull queue processors
├── app.module.ts
└── main.ts
```

## Run Tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Lint & Format

```bash
# lint and fix
$ npm run lint

# format code
$ npm run format
```

## Deployment

Untuk deployment production:

1. Pastikan environment variables diatur untuk production.
2. Jalankan build:
   ```bash
   $ npm run build
   ```
3. Jalankan aplikasi:
   ```bash
   $ npm run start:prod
   ```

## License

UNLICENSED
