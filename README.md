# 💰 Financial Ledger Backend

A production-grade financial transaction system implementing **double-entry bookkeeping** with immutable audit trails, atomic transactions, and idempotency guarantees.

## 🚀 Features

- **Double-Entry Accounting**: Every transaction creates matching debit and credit ledger entries
- **Immutable Ledger**: Ledger entries cannot be modified or deleted after creation (enforced at schema level)
- **Atomic Transactions**: MongoDB sessions ensure ACID properties - transactions either complete fully or roll back entirely
- **Idempotency Keys**: Prevents duplicate transactions even if requests are retried
- **Balance Calculation via Aggregation**: Balances computed in real-time from ledger entries, never stored
- **Token Blacklisting**: Secure logout with automatic token cleanup (TTL index expires after 3 days)
- **Email Notifications**: Transaction confirmations sent via Nodemailer with OAuth2
- **System User Concept**: Special privileged accounts for seeding initial funds

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (Bearer tokens)
- **Email**: Nodemailer with Gmail OAuth2
- **Security**: bcrypt for password hashing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Gmail account with OAuth2 credentials (for email notifications)

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Atharvaa99/Bank-Ledger.git
   cd financial-ledger-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_gmail_address
   CLIENT_ID=your_google_oauth_client_id
   CLIENT_SECRET=your_google_oauth_client_secret
   REFRESH_TOKEN=your_google_oauth_refresh_token
   ```

4. **Start the server**
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

   Server runs on `http://localhost:3000`

## 🏗️ Architecture

### Database Schema

```
User (email, name, password, systemUser)
  ↓
Account (user, status, currency)
  ↓
Transaction (fromAccount, toAccount, amount, idempotencyKey, status)
  ↓
Ledger (account, transaction, amount, type: Debit/Credit)
```

### Transaction Flow (10 Steps)

1. Validate request body
2. Check idempotency key (prevent duplicates)
3. Verify both accounts exist and are Active
4. Calculate sender's balance via aggregation
5. Verify sufficient funds
6. Start MongoDB session + transaction
7. Create Transaction document (status: Pending)
8. Create Debit ledger entry (sender)
9. Create Credit ledger entry (receiver)
10. Update transaction status to Completed
11. Commit MongoDB session
12. Send email notification

If any step fails → entire transaction rolls back (ACID guarantee).

### Why Immutable Ledgers?

Ledger entries are the **source of truth** for all financial data. Making them immutable:
- Provides complete audit trail
- Prevents tampering or accidental deletion
- Allows historical balance reconstruction at any point in time
- Matches real-world accounting standards (GAAP)

Balances are **never stored** — they're always calculated on-demand from ledger entries using MongoDB aggregation.

## 📡 API Endpoints

### Authentication

#### `POST /api/auth/register`
Create a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "message": "User Created Successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "abc123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

#### `POST /api/auth/login`
Login with existing credentials.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Response:**
```json
{
  "message": "User login Successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

#### `POST /api/auth/logout`
Logout and blacklist current token.

**Headers:**
```
Authorization: Bearer <your_token>
```

**Response:**
```json
{
  "message": "User logged out successfully"
}
```

---

### Accounts

#### `POST /api/accounts`
Create a new account for the logged-in user.

**Headers:**
```
Authorization: Bearer <your_token>
```

**Response:**
```json
{
  "account": {
    "_id": "acc123",
    "user": "user_id",
    "status": "Active",
    "currency": "INR"
  }
}
```

---

#### `GET /api/accounts`
Get all accounts for the logged-in user.

**Headers:**
```
Authorization: Bearer <your_token>
```

**Response:**
```json
{
  "accounts": [
    {
      "_id": "acc123",
      "user": "user_id",
      "status": "Active",
      "currency": "INR"
    }
  ]
}
```

---

#### `GET /api/accounts/balance/:accountId`
Get current balance for a specific account.

**Headers:**
```
Authorization: Bearer <your_token>
```

**Response:**
```json
{
  "accountId": "acc123",
  "balance": 5000
}
```

---

### Transactions

#### `POST /api/transactions`
Create a new transaction (transfer money).

**Headers:**
```
Authorization: Bearer <your_token>
```

**Request:**
```json
{
  "fromAccount": "acc123",
  "toAccount": "acc456",
  "amount": 1000,
  "idempotencyKey": "unique-key-12345"
}
```

**Response:**
```json
{
  "message": "Transaction completed successfully",
  "transaction": {
    "_id": "txn789",
    "fromAccount": "acc123",
    "toAccount": "acc456",
    "amount": 1000,
    "status": "Completed",
    "idempotencyKey": "unique-key-12345"
  }
}
```

---

#### `POST /api/transactions/system/initial-funds`
Seed initial funds into an account (system user only).

**Headers:**
```
Authorization: Bearer <system_user_token>
```

**Request:**
```json
{
  "toAccount": "acc123",
  "amount": 10000,
  "idempotencyKey": "seed-12345"
}
```

---

## 🔐 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Authentication**: Bearer token-based with 3-day expiry
- **Token Blacklisting**: Prevents reuse of logged-out tokens
- **TTL Index**: Blacklist auto-cleanup after 3 days
- **Immutable Ledgers**: Protected via Mongoose pre-hooks
- **MongoDB Transactions**: Ensures atomicity (all-or-nothing)

## 🧪 Testing Flow

```bash
# 1. Register a user
POST /api/auth/register
{ "name": "Alice", "email": "alice@test.com", "password": "pass123" }

# 2. Login
POST /api/auth/login
{ "email": "alice@test.com", "password": "pass123" }
# → Copy the token

# 3. Create an account
POST /api/accounts
Authorization: Bearer <token>

# 4. Seed initial funds (requires system user)
POST /api/transactions/system/initial-funds
Authorization: Bearer <system_token>
{ "toAccount": "acc_id", "amount": 10000, "idempotencyKey": "seed1" }

# 5. Check balance
GET /api/accounts/balance/acc_id
Authorization: Bearer <token>

# 6. Make a transaction
POST /api/transactions
Authorization: Bearer <token>
{ "fromAccount": "acc1", "toAccount": "acc2", "amount": 500, "idempotencyKey": "tx1" }
```

## 🚀 Deployment

### Render (Recommended)

1. Push code to GitHub
2. Connect repository on [render.com](https://render.com)
3. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add all environment variables
5. Deploy!

## 📁 Project Structure

```
financial-ledger-backend/
├── src/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js    # Register, login, logout
│   │   ├── account.controller.js # Account management
│   │   └── transaction.controller.js # Transaction logic
│   ├── middleware/
│   │   └── auth.middleware.js    # JWT + blacklist verification
│   ├── models/
│   │   ├── user.model.js         # User schema
│   │   ├── account.model.js      # Account schema + balance method
│   │   ├── transaction.model.js  # Transaction schema
│   │   ├── ledger.model.js       # Ledger schema (immutable)
│   │   └── blacklist.model.js    # Token blacklist with TTL
│   ├── routes/
│   │   ├── auth.routes.js        # Auth endpoints
│   │   ├── account.routes.js     # Account endpoints
│   │   └── transaction.routes.js # Transaction endpoints
│   ├── services/
│   │   └── email.service.js      # Nodemailer integration
│   └── app.js                    # Express app setup
├── server.js                     # Entry point
├── package.json
├── .env
└── README.md
```

## 🔮 Planned Features

- [ ] Transaction history endpoint with pagination
- [ ] Recurring transactions (scheduled payments)
- [ ] Multi-currency support with exchange rates
- [ ] Account freezing/unfreezing
- [ ] Transaction reversal API
- [ ] Fraud detection (rate limiting, amount thresholds)
- [ ] WebSocket for real-time balance updates
- [ ] Export statements (PDF/CSV)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
