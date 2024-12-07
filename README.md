# PolyDomains 

The **PolyDomains** is a decentralized domain name registration and rental system built on the Ethereum blockchain. It allows users to register, manage, transfer, and rent subdomains under a specific Top-Level Domain (TLD). This project leverages NFTs to represent ownership of the domains, ensuring secure and transparent operations.

## Table of Contents

- [Scholar Name Service (SNS)](#scholar-name-service-sns)
  - [Features](#features)
  - [Setup Instructions](#setup-instructions)
  - [Contract Deployment](#contract-deployment)
  - [Functions Overview](#functions-overview)
  - [Events](#events)
  - [Errors](#errors)
  - [Testing](#testing)
  - [License](#license)

---

## Features

- **Domain Registration**: Users can register unique subdomains under a predefined TLD.
- **NFT Representation**: Each registered domain is represented as an ERC-721 token.
- **Domain Records**: Store and retrieve custom records for registered domains.
- **Domain Transfer**: Transfer ownership of domains between users.
- **Domain Rental**: Rent out domains for specific durations.
- **Dynamic Pricing**: Domain prices are determined by the length of the domain name.
- **On-Chain Metadata**: SVG-based domain logos and metadata are stored on-chain.
- **Secure Ownership**: Includes authorization checks for secure domain management.
- **Withdraw Funds**: Contract owner can withdraw accumulated funds.

---

## Setup Instructions

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) and npm
- [Hardhat](https://hardhat.org/)
- [MetaMask](https://metamask.io/)
- Ethereum-compatible wallet

### Clone Repository

```bash
git clone https://github.com/Enigmage/polydomains.git
cd polydomains/contract
```

### Install Dependencies

```bash
pnpm install
```

### Compile the Contracts

```bash
npx hardhat compile
```

### Run tests

```bash
npx hardhat test
```

### Deploy Contracts

Deploy the `Domains` contract to a local or live Ethereum network.

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

Replace `<network-name>` with `localhost`, `goerli`, or your target network.

To deploy to local network, start hardhat local network using

```bash
npx hardhat node
```
---

## Contract Deployment

### Constructor Parameters

The `Domains` contract accepts a single parameter:

- **_tld**: The top-level domain string for the service (e.g., `sns`).

Example:

```solidity
constructor(string memory _tld) payable ERC721("Scholar Name Service", "SNS") { ... }
```

---

## Functions Overview

### Domain Registration

#### **registerDomain(string calldata name)**  
Registers a unique domain name under the specified TLD.  

**Input Parameters**:  
- `name` (*string*): The desired domain name.  

**Requirements**:  
- The domain name must be unique and not already registered.  
- Payment is required based on the domain name length:
  - Shorter names cost more due to higher desirability.  
```solidity
    function price(string calldata name) public pure returns (uint) {
        uint len = StringUtils.strlen(name);
        require(len > 0);
        if (len == 3) {
            return 5 * 10 ** 17; // 0.5 ETH
        } else if (len == 4) {
            return 3 * 10 ** 17;
        } else {
            return 1 * 10 ** 17;
        }
    }
```

**Payment Calculation**:  
```solidity
uint price = (10 - length(name)) * 0.01 ether;
```  

**Example**:  
```solidity
registerDomain("example");
```  

**Effect**:  
- Mints an NFT representing ownership of the domain.  
- Emits a `DomainRegistered` event.  

---

### Ownership Management

#### **getDomainOwner(string calldata name)**  
Retrieves the Ethereum address of the current domain owner.  

**Input Parameters**:  
- `name` (*string*): The domain name.  

**Output**:  
- Returns the owner’s address.  

**Example**:  
```solidity
getDomainOwner("example");
```  

---

#### **transferDomain(string calldata name, address to)**  
Transfers ownership of a domain to another Ethereum address.  

**Input Parameters**:  
- `name` (*string*): The domain name.  
- `to` (*address*): The recipient’s Ethereum address.  

**Requirements**:  
- The caller must be the domain owner.  

**Effect**:  
- Updates the domain ownership.  
- Emits a `DomainTransferred` event.  

**Example**:  
```solidity
transferDomain("example", 0xRecipientAddress);
```  

---

### Records Management

#### **setRecord(string calldata name, string calldata record)**  
Sets a custom record for a domain.  

**Input Parameters**:  
- `name` (*string*): The domain name.  
- `record` (*string*): The record to associate with the domain.  

**Requirements**:  
- The caller must be the domain owner.  

**Effect**:  
- Updates the domain’s record mapping.  

**Example**:  
```solidity
setRecord("example", "ipfs://hash");
```  

#### **getRecord(string calldata name)**  
Retrieves the record associated with a domain.  

**Input Parameters**:  
- `name` (*string*): The domain name.  

**Output**:  
- Returns the record (*string*).  

**Example**:  
```solidity
getRecord("example");
```  

---

### Domain Rentals

#### **rentDomain(string calldata name, uint256 rentalDays)**  
Rents a domain for a specified duration.  

**Input Parameters**:  
- `name` (*string*): The domain name.  
- `rentalDays` (*uint256*): The duration of the rental (in days).  

**Requirements**:  
- Domain must not already be rented.  
- Payment is required based on the rental duration.  

**Effect**:  
- Temporarily transfers usage rights to the renter.  
- Emits a `DomainRented` event.  

**Example**:  
```solidity
rentDomain("example", 30);
```  

---

#### **cancelRental(string calldata name)**  
Cancels the rental of a domain.  

**Input Parameters**:  
- `name` (*string*): The domain name.  

**Requirements**:  
- The caller must be the current renter.  

**Effect**:  
- Ends the rental period.  
- Emits a `RentalCanceled` event.  

**Example**:  
```solidity
cancelRental("example");
```  

---

### Utility Functions

#### **checkDomainAvailability(string calldata name)**  
Checks if a domain is available for registration.  

**Input Parameters**:  
- `name` (*string*): The domain name.  

**Output**:  
- Returns a boolean indicating availability.  

**Example**:  
```solidity
checkDomainAvailability("example");
```  

#### **price(string calldata name)**  
Calculates the registration price for a domain.  

**Input Parameters**:  
- `name` (*string*): The domain name.  

**Output**:  
- Returns the price in Wei (*uint256*).  

**Example**:  
```solidity
price("example");
```  

#### **valid(string calldata name)**  
Validates the format of a domain name.  

**Input Parameters**:  
- `name` (*string*): The domain name.  

**Output**:  
- Returns `true` if the name is valid, otherwise `false`.  

**Example**:  
```solidity
valid("example");
```  

---

## Events

- **DomainRegistered**: Emitted when a domain is registered.  
- **DomainTransferred**: Emitted when a domain is transferred.  
- **DomainRented**: Emitted when a domain is rented.  
- **RentalCanceled**: Emitted when a rental is canceled.  

---

## Errors

- **Unauthorized**: Thrown for unauthorized actions.  
- **AlreadyRegistered**: Domain already exists.  
- **InvalidName**: Invalid domain name format.  
- **InsufficientPayment**: Payment does not meet the required amount.  
- **InvalidRentalDuration**: Rental duration is invalid.  

---

## Testing

Run tests using Hardhat:  
```bash
npx hardhat test
```  

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.