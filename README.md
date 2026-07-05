# Multi-Hop Payment System

A distributed backend system that enables secure offline payment routing through a multi-hop mesh network. Encrypted payment packets are forwarded across intermediary devices until an internet-connected bridge node uploads them to the backend, where they are securely verified and settled exactly once.

---

## Deployment Link

- **Frontend:** https://frontend-fawn-delta-37.vercel.app
- **Backend:** https://upi-offline-mesh-backend-4zo4.onrender.com

---

## Demo Snippets

### Before running the simulation, the system is clean. All nodes are online, and the backend has seeded accounts for Alice, Bob, Carol, and Dave.

<img width="1119" height="614" alt="image" src="https://github.com/user-attachments/assets/8c615117-e853-427f-bc55-66356c35d244" />
<img width="1106" height="614" alt="image" src="https://github.com/user-attachments/assets/eb204186-332b-4e31-b2c3-09f3c789f256" />

### Step 1: Payment Creation and Injection
The sender (alice@demo) creates an offline payment request of ₹500 for the receiver (bob@demo), enters the UPI PIN, and clicks Inject Packet on phone-alice.
The payment data is encrypted locally using the server's public key (hybrid RSA-OAEP + AES-256-GCM).
The resulting encrypted packet is stored in the buffer of phone-alice, which displays 1 pkt in the network diagram.

<img width="1109" height="611" alt="image" src="https://github.com/user-attachments/assets/f554e829-d97a-411b-8b3e-d3319dddc362" />
<img width="1119" height="609" alt="image" src="https://github.com/user-attachments/assets/2063df7f-6f2d-4491-9787-2869eca03632" />


### Step 2: Mesh Gossip Routing
Clicking Run Gossip propagates the packet across nearby devices.
In this step, the packet travels across intermediary nodes (phone-stranger1 ➔ phone-stranger2 ➔ phone-stranger3) that do not have internet.
Finally, it lands in the buffer of the internet-connected phone-bridge node, which shows the packet holds.

<img width="1118" height="613" alt="image" src="https://github.com/user-attachments/assets/3183885e-ac2e-40f9-9152-037eb0b18171" />

### Step 3: Ingestion and Idempotent Settlement
The bridge node detects internet access and uploads all held packets to the backend via a POST request to /api/bridge/ingest.
The backend verifies the SHA-256 hash of the packet, decrypts it, validates the PIN and nonce, and settles the payment.
The transaction history updates immediately to show the status SETTLED, and Alice's balance is debited by ₹500 while Bob's balance is credited.

<img width="1119" height="613" alt="image" src="https://github.com/user-attachments/assets/ed5f224c-4614-46c2-8f68-808d966f5688" />
<img width="1118" height="610" alt="image" src="https://github.com/user-attachments/assets/31b88ccd-a1d4-4270-b53b-893414d0eb73" />
<img width="1119" height="616" alt="image" src="https://github.com/user-attachments/assets/7c2df6e0-28d7-472b-819b-def3a83df261" />


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

# Features

### Multi-Hop Payment Routing

Implemented a distributed payment routing system where encrypted payment packets travel across multiple intermediary devices before reaching an internet-connected bridge node for settlement.

### Secure Hybrid Encryption

Protected payment data using **RSA-OAEP + AES-256-GCM** hybrid encryption so that only the backend can decrypt the packet while also detecting any tampering.

### Exactly-Once Settlement

Guaranteed duplicate-safe transaction processing by generating a **SHA-256 hash** for every payment packet, ensuring that repeated uploads of the same packet are settled only once.

### Replay Protection

Added encrypted timestamps and unique nonces to reject replayed or expired payment packets before settlement.

---

## How to Run

**Prerequisites:** Java 17+, Git

```bash
git clone https://github.com/<your-username>/Multi-Hop-Payment-System.git
cd Multi-Hop-Payment-System
.\mvnw.cmd spring-boot:run
```

Open **http://localhost:8080** in your browser.

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
