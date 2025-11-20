# Private IoT Data Platform - Architecture Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Gateway Callback Pattern](#gateway-callback-pattern)
3. [Refund Mechanism](#refund-mechanism)
4. [Security Features](#security-features)
5. [Privacy Protection](#privacy-protection)
6. [Gas Optimization](#gas-optimization)
7. [API Documentation](#api-documentation)

---

## System Architecture

### Overview
The Private IoT Data Platform implements a **Gateway Callback Pattern** for asynchronous processing of encrypted IoT sensor data with built-in refund mechanisms and timeout protection.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (React + RainbowKit)                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Smart Contract Layer                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Device     │  │    Data      │  │  Threshold   │        │
│  │  Registry    │  │  Submission  │  │  Management  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐         │
│  │         Gateway Request Manager                   │         │
│  │  - Request Queue                                  │         │
│  │  - Timeout Protection                            │         │
│  │  - Refund Logic                                  │         │
│  └──────────────────────────────────────────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Decryption Gateway                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Request    │  │  FHE Decrypt │  │   Callback   │        │
│  │   Listener   │  │    Engine    │  │   Executor   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Blockchain Network                           │
│                     (Sepolia Testnet)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Gateway Callback Pattern

### Workflow

#### 1. User Submits Encrypted Data
```solidity
function submitDataWithCallback(
    uint256 deviceIndex,
    uint32 value,
    uint8 dataType
) external payable returns (uint256 requestId)
```

**Process:**
1. User sends encrypted sensor data + deposit (0.001 ETH minimum)
2. Contract creates a `GatewayRequest` with:
   - Unique request ID
   - Encrypted data
   - Timeout timestamp (24 hours)
   - Deposit amount
3. Contract emits `GatewayRequestCreated` event
4. Contract requests decryption from Gateway

#### 2. Gateway Processes Request
- Gateway monitors blockchain for `GatewayRequestCreated` events
- Decrypts the FHE-encrypted data
- Validates the decrypted value
- Generates cryptographic proof

#### 3. Gateway Callback
```solidity
function gatewayCallback(
    uint256 requestId,
    uint32 decryptedValue,
    bytes[] memory signatures
) external onlyGateway
```

**Process:**
1. Gateway calls back with decrypted value + signatures
2. Contract validates:
   - Request not already completed
   - Not timed out
   - Signatures valid
   - Value in acceptable range
3. Creates permanent data record
4. Returns deposit to user
5. Emits `GatewayCallbackCompleted` event

### Benefits
- **Asynchronous Processing**: No blocking operations
- **Gas Efficient**: Decryption happens off-chain
- **Secure**: Cryptographic proofs verify results
- **User Protection**: Timeout mechanism ensures funds aren't locked forever

---

## Refund Mechanism

### Three Types of Refunds

#### 1. Automatic Timeout Refund
```solidity
function claimTimeoutRefund(uint256 requestId) external
```

**Scenario**: Gateway fails to respond within 24 hours

**Process:**
1. User calls `claimTimeoutRefund` after timeout
2. Contract validates:
   - Request not completed
   - Timeout period exceeded
   - Not already refunded
3. Returns full deposit to user
4. Marks request as refunded

**Example:**
```javascript
// User submits data at 12:00 PM
await contract.submitDataWithCallback(deviceIndex, value, dataType, {
  value: ethers.parseEther("0.001")
});

// Gateway fails to respond
// User can claim refund after 12:00 PM next day
await contract.claimTimeoutRefund(requestId);
```

#### 2. Admin Emergency Refund
```solidity
function adminRefund(uint256 requestId) external onlyOwner
```

**Scenario**: Decryption fails or system error

**Process:**
1. Admin identifies failed request
2. Calls `adminRefund` with request ID
3. Uses refund pool if contract balance insufficient
4. Transfers funds to original requester

#### 3. Refund Pool
```solidity
function depositRefundPool() external payable onlyOwner
```

**Purpose**: Reserve funds for emergency refunds

**Features:**
- Accepts ETH deposits
- Tracks pool balance separately
- Used when contract balance insufficient for refunds

---

## Security Features

### 1. Input Validation

**Device Registration:**
```solidity
require(bytes(deviceId).length > 0, "Device ID cannot be empty");
require(bytes(deviceId).length <= 64, "Device ID too long");
```

**Data Submission:**
```solidity
require(devices[deviceIndex].isActive, "Device is not active");
require(dataType <= 5, "Invalid data type");
require(msg.value >= 0.001 ether, "Insufficient deposit");
```

**Threshold Setting:**
```solidity
require(minValue < maxValue, "Invalid threshold range");
require(minValue < type(uint32).max, "Min value overflow");
require(maxValue < type(uint32).max, "Max value overflow");
```

### 2. Access Control

**Role-Based Permissions:**
```solidity
modifier onlyOwner() { ... }
modifier onlyGateway() { ... }
modifier onlyPauser() { ... }
modifier onlyDeviceOwner(uint256 deviceIndex) { ... }
modifier onlyAuthorized() { ... }
```

**Pauser System:**
```solidity
function setPauser(address _pauser) external onlyOwner
function pause() external onlyPauser whenNotPaused
function unpause() external onlyPauser whenPaused
```

### 3. Overflow Protection

**Safe Arithmetic:**
- Solidity 0.8.24+ has built-in overflow checks
- Explicit validation for critical operations:
```solidity
require(minValue < type(uint32).max, "Overflow protection");
```

### 4. Reentrancy Protection

**Checks-Effects-Interactions Pattern:**
```solidity
// ✅ Correct order
request.refunded = true;  // Update state first
uint256 refundAmount = request.depositAmount;
(bool success, ) = msg.sender.call{value: refundAmount}("");  // External call last
require(success, "Transfer failed");
```

### 5. Audit Hints

**Critical Functions Marked:**
```solidity
/**
 * @audit-ok Access control verified
 * @audit-ok Overflow protection implemented
 * @audit-ok Reentrancy safe
 */
function criticalFunction() external { ... }
```

---

## Privacy Protection

### 1. Division Problem Solution

**Challenge**: Division on encrypted data reveals information

**Solution**: Random Multiplier Protection
```solidity
function _obfuscatePrice(uint256 requestId, euint32 value) private {
    // Generate random multiplier (1-1000)
    uint32 randomSeed = uint32(uint256(keccak256(abi.encodePacked(
        block.timestamp,
        block.prevrandao,
        requestId,
        msg.sender
    ))));

    euint32 randomMultiplier = FHE.asEuint32(randomSeed % 1000 + 1);

    // Multiply encrypted value
    euint32 obfuscatedPrice = FHE.mul(value, randomMultiplier);

    // Store for later unblinding
    priceObfuscations[requestId] = PriceObfuscation({
        randomMultiplier: randomMultiplier,
        obfuscatedPrice: obfuscatedPrice,
        timestamp: block.timestamp
    });
}
```

**How it works:**
1. Generate random multiplier (e.g., 523)
2. Multiply encrypted value: `encrypted_value * 523`
3. Perform division: `(encrypted_value * 523) / denominator`
4. Result still encrypted, but relationship obscured
5. Later divide by 523 to get actual result

### 2. Price Leakage Prevention

**Obfuscation Techniques:**

**Time-based Fuzzing:**
```solidity
timestamp: block.timestamp  // Changes every block
```

**Random Multipliers:**
```solidity
randomSeed % 1000 + 1  // Different for each request
```

**Multi-layer Encryption:**
```solidity
euint32 layer1 = FHE.asEuint32(value);
euint32 layer2 = FHE.mul(layer1, randomMultiplier);
```

### 3. Threshold Checking Privacy

**Private Comparisons:**
```solidity
ebool belowMin = FHE.lt(value, threshold.minValue);  // Encrypted comparison
ebool aboveMax = FHE.gt(value, threshold.maxValue);
ebool alertNeeded = FHE.or(belowMin, aboveMax);      // Encrypted OR
```

**Result**: Alert triggered without revealing actual values

---

## Gas Optimization

### 1. HCU (Homomorphic Computation Unit) Management

**HCU Costs:**
- `FHE.asEuint32()`: ~50,000 HCU
- `FHE.mul()`: ~100,000 HCU
- `FHE.add()`: ~80,000 HCU
- `FHE.lt()` / `FHE.gt()`: ~60,000 HCU

**Optimization Strategies:**

**Batch Operations:**
```solidity
// ❌ Bad: Multiple separate operations
euint32 val1 = FHE.asEuint32(input1);
euint32 val2 = FHE.asEuint32(input2);
euint32 val3 = FHE.asEuint32(input3);

// ✅ Good: Batch encryption
bytes32[] memory inputs = new bytes32[](3);
inputs[0] = bytes32(uint256(input1));
inputs[1] = bytes32(uint256(input2));
inputs[2] = bytes32(uint256(input3));
// Process in batch
```

**Minimize FHE Operations:**
```solidity
// ❌ Bad: Unnecessary FHE operations
euint32 zero = FHE.asEuint32(0);
euint32 result = FHE.add(value, zero);

// ✅ Good: Skip unnecessary operations
euint32 result = value;  // No need to add zero
```

**Storage Optimization:**
```solidity
// Pack related data
struct DataRecord {
    uint256 deviceIndex;      // 32 bytes
    euint32 encryptedValue;   // Encrypted type
    uint8 dataType;           // 1 byte
    uint256 timestamp;        // 32 bytes
    address submitter;        // 20 bytes
    bool validated;           // 1 byte
}
```

### 2. Calldata vs Memory

**Prefer Calldata:**
```solidity
// ✅ Good: Use calldata for read-only arrays
function processData(bytes[] calldata signatures) external

// ❌ Bad: Unnecessary memory copy
function processData(bytes[] memory signatures) external
```

### 3. Event Indexing

**Index Important Fields:**
```solidity
event GatewayRequestCreated(
    uint256 indexed requestId,     // Indexed for filtering
    address indexed requester,      // Indexed for filtering
    uint256 deviceIndex             // Not indexed (save gas)
);
```

---

## API Documentation

### Core Functions

#### Device Management

**Register Device**
```solidity
function registerDevice(string memory deviceId)
    external
    returns (uint256 deviceIndex)
```
- **Purpose**: Register new IoT device
- **Parameters**:
  - `deviceId`: Unique identifier (max 64 chars)
- **Returns**: Device index
- **Events**: `DeviceRegistered`
- **Gas**: ~150,000

**Deactivate Device**
```solidity
function deactivateDevice(uint256 deviceIndex)
    external
```
- **Purpose**: Deactivate device
- **Access**: Device owner only
- **Events**: None
- **Gas**: ~30,000

#### Data Submission

**Submit with Callback**
```solidity
function submitDataWithCallback(
    uint256 deviceIndex,
    uint32 value,
    uint8 dataType
) external payable returns (uint256 requestId)
```
- **Purpose**: Submit encrypted data via Gateway
- **Parameters**:
  - `deviceIndex`: Device to submit for
  - `value`: Encrypted sensor value
  - `dataType`: 0-5 (temperature, humidity, etc.)
- **Payable**: Min 0.001 ETH deposit
- **Returns**: Request ID
- **Events**: `GatewayRequestCreated`
- **Gas**: ~250,000 + HCU

#### Threshold Management

**Set Threshold**
```solidity
function setThreshold(
    uint256 deviceIndex,
    uint8 dataType,
    uint32 minValue,
    uint32 maxValue
) external
```
- **Purpose**: Set alert thresholds
- **Access**: Device owner only
- **Events**: `ThresholdSet`
- **Gas**: ~200,000 + HCU

#### Refund Functions

**Claim Timeout Refund**
```solidity
function claimTimeoutRefund(uint256 requestId) external
```
- **Purpose**: Claim refund after timeout
- **Access**: Request owner
- **Conditions**: After 24-hour timeout
- **Events**: `TimeoutRefundClaimed`
- **Gas**: ~50,000

**Admin Refund**
```solidity
function adminRefund(uint256 requestId) external onlyOwner
```
- **Purpose**: Emergency refund
- **Access**: Owner only
- **Events**: `RequestRefunded`
- **Gas**: ~60,000

#### View Functions

**Get Device Info**
```solidity
function getDeviceInfo(uint256 deviceIndex)
    external view
    returns (
        string memory deviceId,
        address deviceOwner,
        bool isActive,
        uint256 registrationTime,
        uint256 lastUpdateTime,
        uint256 dataSubmissionCount
    )
```

**Get Gateway Request**
```solidity
function getGatewayRequest(uint256 requestId)
    external view
    returns (
        address requester,
        uint256 deviceIndex,
        uint8 dataType,
        uint256 timestamp,
        uint256 timeout,
        bool completed,
        bool refunded,
        uint256 depositAmount
    )
```

### Integration Examples

#### Frontend Integration

**Submit Data with React:**
```typescript
import { useContractWrite } from 'wagmi';

const { writeAsync } = useContractWrite({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  functionName: 'submitDataWithCallback',
});

async function submitData() {
  try {
    const tx = await writeAsync({
      args: [deviceIndex, value, dataType],
      value: parseEther('0.001'),
    });

    const receipt = await tx.wait();
    const requestId = receipt.events[0].args.requestId;

    // Monitor for callback
    watchForCallback(requestId);
  } catch (error) {
    handleError(error);
  }
}
```

**Monitor Callback:**
```typescript
const { data } = useContractEvent({
  address: CONTRACT_ADDRESS,
  abi: CONTRACT_ABI,
  eventName: 'GatewayCallbackCompleted',
  listener: (requestId, success) => {
    if (success) {
      showSuccess('Data submitted successfully!');
    }
  },
});
```

---

## Best Practices

### 1. For Developers

**Always Validate Input:**
```solidity
require(input != 0, "Input cannot be zero");
require(input < MAX_VALUE, "Input exceeds maximum");
```

**Use Events for Monitoring:**
```solidity
emit DataSubmitted(deviceIndex, recordId, dataType);
```

**Handle Errors Gracefully:**
```solidity
try this.externalFunction() {
    // Success
} catch Error(string memory reason) {
    emit ErrorOccurred(reason);
}
```

### 2. For Users

**Check Deposit Requirements:**
```javascript
const minDeposit = ethers.parseEther('0.001');
```

**Monitor Transaction Status:**
```javascript
const receipt = await tx.wait();
console.log('Transaction confirmed:', receipt.transactionHash);
```

**Claim Refunds Promptly:**
```javascript
if (block.timestamp > timeout && !completed) {
  await contract.claimTimeoutRefund(requestId);
}
```

### 3. For Auditors

**Review Critical Functions:**
- `gatewayCallback`: Gateway interaction point
- `claimTimeoutRefund`: Financial operation
- `adminRefund`: Admin privilege

**Check for:**
- Reentrancy vulnerabilities
- Integer overflows
- Access control bypasses
- Time manipulation attacks

---

## Security Audit Checklist

- [x] Input validation on all public functions
- [x] Access control modifiers properly applied
- [x] Overflow protection implemented
- [x] Reentrancy protection via CEI pattern
- [x] Event logging for critical operations
- [x] Timeout mechanisms prevent fund locking
- [x] Refund logic tested and verified
- [x] Gateway signature validation
- [x] Price obfuscation prevents data leakage
- [x] Gas optimization applied
- [x] Emergency pause functionality
- [x] Proper error messages

---

## Deployment Guide

### 1. Prepare Environment
```bash
npm install
cp .env.example .env
# Edit .env with your values
```

### 2. Compile Contracts
```bash
npm run compile
```

### 3. Deploy to Sepolia
```bash
npm run deploy:sepolia
```

### 4. Verify Contract
```bash
npm run verify:sepolia
```

### 5. Configure Gateway
```bash
# Update .env with:
VITE_GATEWAY_ADDRESS=<deployed_gateway>
VITE_CONTRACT_ADDRESS=<deployed_contract>
```

### 6. Deploy Frontend
```bash
npm run build
npm run deploy:vercel
```

---

## Support & Resources

- **Documentation**: [GitHub Repository](https://github.com/yourproject)
- **API Reference**: [API Docs](https://docs.yourproject.com)
- **Security**: [Audit Reports](https://audits.yourproject.com)
- **Community**: [Discord](https://discord.gg/yourproject)

---

*Last Updated: 2025*
*Version: 1.0.0*
