# Product Validation App

Aplikasi untuk melakukan validasi kemiripan antara **product title** dan **product description** menggunakan AdonisJS, TypeScript, dan PostgreSQL.

## Requirements

* Node.js
* PostgreSQL
* npm

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd <project-folder>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment

Copy `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Sesuaikan konfigurasi PostgreSQL di `.env`.

### 4. Run Migration

```bash
node ace migration:run
```

### 5. Run Application

```bash
npm run dev
```

Buka:

```text
http://localhost:3333
```

## Features

* Product CRUD
* Product similarity validation
* Case-sensitive & case-insensitive checking
* Validation history
* Validation summary report
