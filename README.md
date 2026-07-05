# Multi-Hop Payment System

A distributed backend system that enables secure offline payment routing through a multi-hop mesh network. Encrypted payment packets are forwarded across intermediary devices until an internet-connected bridge node uploads them to the backend, where they are securely verified and settled exactly once.

---

## Tech Stack

* Java 17
* Spring Boot
* Spring Data JPA (Hibernate)
* REST APIs
* H2 Database
* Maven
* JUnit 5

---

# Features

### 🔹 Multi-Hop Payment Routing

Implemented a distributed payment routing system where encrypted payment packets travel across multiple intermediary devices before reaching an internet-connected bridge node for settlement.

### 🔹 Secure Hybrid Encryption

Protected payment data using **RSA-OAEP + AES-256-GCM** hybrid encryption so that only the backend can decrypt the packet while also detecting any tampering.

### 🔹 Exactly-Once Settlement

Guaranteed duplicate-safe transaction processing by generating a **SHA-256 hash** for every payment packet, ensuring that repeated uploads of the same packet are settled only once.

### 🔹 Replay Protection

Added encrypted timestamps and unique nonces to reject replayed or expired payment packets before settlement.

### 🔹 REST APIs

Developed REST APIs for payment creation, bridge ingestion, packet forwarding simulation, account management, and transaction settlement.

### 🔹 Unit Testing

Implemented JUnit test cases covering encryption/decryption, packet routing, duplicate handling, replay protection, tamper detection, and settlement workflows.

---

# System Architecture

```
        Sender Device (Offline)
                │
                │ Encrypt Payment
                ▼
        ┌──────────────────┐
        │ Encrypted Packet │
        └──────────────────┘
                │
                ▼
        Multi-Hop Routing
     (Nearby Devices Forward)
                │
                ▼
      Internet Bridge Device
                │
          REST API Upload
                ▼
        Spring Boot Backend
                │
        ┌────────────────────┐
        │ Duplicate Check    │
        │ Decryption         │
        │ Replay Validation  │
        │ Settlement         │
        └────────────────────┘
                │
                ▼
          Transaction Ledger
```

---

# Payment Flow

## Step 1 – Create Payment

The sender creates a payment request containing:

* Sender
* Receiver
* Amount
* Timestamp
* Unique Nonce

The payment is encrypted using hybrid encryption.

---

## Step 2 – Multi-Hop Routing

The encrypted packet is forwarded across nearby intermediary devices.

Intermediate devices:

* Cannot decrypt the packet
* Cannot modify the packet
* Only forward it

---

## Step 3 – Bridge Upload

When one device gets internet connectivity, it uploads the encrypted packet to the backend through a REST API.

---

## Step 4 – Packet Verification

Before settlement, the backend:

* Checks for duplicate packets using SHA-256 hashing
* Decrypts the packet
* Verifies timestamp freshness
* Validates the unique nonce
* Rejects tampered or replayed packets

---

## Step 5 – Transaction Settlement

If verification succeeds:

* Sender account is debited
* Receiver account is credited
* Transaction is stored in the database

The payment is settled **exactly once**, even if multiple bridge nodes upload the same packet.

---

# Project Structure

```
src
├── main
│   ├── controller
│   ├── service
│   ├── crypto
│   ├── model
│   ├── config
│   └── resources
│
└── test
    └── JUnit Test Cases
```

---

# How to Run

## Prerequisites

* Java 17+
* Git

---

## Clone Repository

```bash
git clone https://github.com/<your-username>/multi-hop-payment-system.git

cd multi-hop-payment-system
```

---

## Run Backend

### Windows

```bash
.\mvnw.cmd spring-boot:run
```

### Linux / Mac

```bash
./mvnw spring-boot:run
```

The first run downloads all Maven dependencies automatically.

---

## Open Application

After the backend starts successfully, open:

```
http://localhost:8080
```

The frontend will communicate directly with the backend APIs.

---

# 📡 REST APIs

| Method | Endpoint             | Description                       |
| ------ | -------------------- | --------------------------------- |
| GET    | `/api/accounts`      | Fetch account balances            |
| GET    | `/api/transactions`  | Fetch transaction history         |
| POST   | `/api/demo/send`     | Create and inject payment packet  |
| POST   | `/api/mesh/gossip`   | Simulate one routing round        |
| POST   | `/api/mesh/flush`    | Upload packets from bridge node   |
| POST   | `/api/mesh/reset`    | Reset mesh network                |
| POST   | `/api/bridge/ingest` | Production bridge upload endpoint |

---
