# S2B C- Documentation

S2B is a 100% Peer-to-Peer (P2P) marketplace application built on **Pear Runtime**. Unlike a traditional e-commerce store, there is no central server; buyers connect directly to sellers through a distributed network.

##  Key Technologies

- **Pear Runtime**: Execution environment for desktop P2P applications.
- **Hyperswarm**: Network for P2P discovery and connection.
- **Corestore**: Local storage management based on append-only logs (Hypercore).
- **Hyperbee**: Key-value database built on top of Hypercore. It is used to store the sellers' product catalogs.
- **hypercore-crypto**: Utility for hashing and public/private keys.

c## Architecture and Workflow

### 1. The Base Node (`src/p2p/node.js`)
Every instance of the application (whether buyer or seller) initializes a base node. This node spins up a `Corestore` (Pear's disk storage) and a `Hyperswarm` "antenna" to join topics on the DHT (Distributed Hash Table) network.

### 2. The Seller (`src/p2p/seller.js`)
- Creates a catalog using `Hyperbee`.
- Exposes a **public key** (`publicKey`), which acts as its identity on the network.
- Hashes its public key and joins the DHT network using that topic to listen for incoming connections.
- Provides methods to add (`addProduct`), list (`listProducts`), and remove (`deleteProduct`) items from its catalog.
- Converts images to Base64 to store them alongside the product metadata.

### 3. The Buyer (`src/p2p/buyer.js`)
- Uses the `discoverSeller` function, passing a known seller's public key.
- Hashes the key and joins that specific topic on the DHT.
- Synchronizes the seller's catalog (`Hyperbee`) in read-only mode.
- Downloads and displays the available products and images.

### 4. Global Marketplace (`src/p2p/marketplace.js`)
To avoid requiring buyers to manually type in keys, there is a **Global Discovery Room**:
- Both buyers and sellers join a common topic (e.g., `vinted-global-v1`).
- When a seller detects a new peer joining the room (`peer-joined`), it broadcasts its public key (`SELLER_HERE`).
- The buyer listens for these announcements (`announcement`) and automatically downloads the catalogs of discovered sellers to build a global feed.

### 5. Chat (`src/p2p/chat.js`)
Once a buyer decides to purchase a product, they can initiate a direct chat with the seller. This is done using the direct socket provided by `Hyperswarm` after connecting to the topic derived from the seller's public key.

## 🚀 How to Run the Project

1. Make sure you have [Pear Runtime](https://docs.pears.com/) installed.
2. Install dependencies (if applicable, though Pear manages module imports):
   ```bash
   npm install
   ```
3. Run the application. The UI allows you to select your role (Buyer or Seller) at startup:
   ```bash
   pear run --dev .
   ```
