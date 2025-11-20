# Deployment Guide

## PrivateIoTData Contract Deployment

### Prerequisites

1. **Environment Setup**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the project root:
   ```env
   INFURA_API_KEY=your_infura_api_key
   SEPOLIA_PRIVATE_KEY=your_private_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
# Local tests
npx hardhat test

# With gas reporting
npm run test:gas

# With coverage
npm run coverage
```

### Deploy Contract

#### Local Hardhat Network
```bash
npx hardhat run scripts/deploy.js
```

#### Sepolia Testnet
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Verify Contract

After deployment, verify the contract on Etherscan:

```bash
CONTRACT_ADDRESS=0xYourContractAddress npx hardhat run scripts/verify.js --network sepolia
```

### Interact with Contract

```bash
CONTRACT_ADDRESS=0xYourContractAddress npx hardhat run scripts/interact.js --network sepolia
```

### Run Simulation

Test the complete workflow locally:

```bash
npx hardhat run scripts/simulate.js
```

---

## Deployment Information

### Sepolia Testnet

**Network Details:**
- Network: Sepolia
- Chain ID: 11155111
- RPC URL: https://sepolia.infura.io/v3/YOUR_INFURA_KEY

**Contract Address:**
```
[To be filled after deployment]
```

**Deployment Transaction:**
```
Hash: [To be filled after deployment]
Block: [To be filled after deployment]
Timestamp: [To be filled after deployment]
```

**Etherscan Link:**
```
https://sepolia.etherscan.io/address/[CONTRACT_ADDRESS]
```

**Contract Verification:**
```
Status: [Pending/Verified]
Compiler: 0.8.24
Optimization: Enabled (800 runs)
EVM Version: Cancun
```

---

## Contract Information

### PrivateIoTData

**Description:** Secure IoT Data Management Platform with Privacy Protection using Fully Homomorphic Encryption (FHE)

**Key Features:**
- ✅ Encrypted IoT data storage (euint32)
- ✅ Multi-device management
- ✅ Threshold-based alerts with FHE comparisons
- ✅ Role-based access control (Owner, Device Owner, Operators)
- ✅ Gateway integration for decryption
- ✅ ZK Proof validation for inputs

**Contract Functions:**

| Function | Access | Description |
|----------|--------|-------------|
| `registerDevice` | Public | Register new IoT device |
| `submitData` | Owner/Operator | Submit encrypted sensor data |
| `setThreshold` | Device Owner | Set alert thresholds |
| `addOperator` | Owner | Add authorized operator |
| `removeOperator` | Owner | Remove operator |
| `deactivateDevice` | Device Owner | Deactivate device |
| `getDeviceInfo` | Public | Get device information |
| `getDataRecord` | Public | Get data record details |

**Events:**
- `DeviceRegistered(uint256 indexed deviceIndex, string deviceId, address indexed owner)`
- `DataSubmitted(uint256 indexed deviceIndex, uint256 indexed recordId, uint8 dataType)`
- `ThresholdSet(uint256 indexed deviceIndex, uint8 dataType)`
- `AlertTriggered(uint256 indexed deviceIndex, uint8 dataType, uint256 timestamp)`
- `OperatorAdded(address indexed operator)`
- `OperatorRemoved(address indexed operator)`

---

## Usage Examples

### Register IoT Device
```javascript
const tx = await contract.registerDevice("sensor-temp-001");
await tx.wait();
```

### Submit Encrypted Data
```javascript
const deviceIndex = 0;
const encryptedValue = 2500; // 25.00°C
const dataType = 0; // Temperature
const tx = await contract.submitData(deviceIndex, encryptedValue, dataType);
await tx.wait();
```

### Set Data Threshold
```javascript
const minValue = 1500; // 15.00°C
const maxValue = 3000; // 30.00°C
const tx = await contract.setThreshold(deviceIndex, dataType, minValue, maxValue);
await tx.wait();
```

---

## Security Considerations

1. **Private Key Management**: Never commit private keys to version control
2. **Access Control**: Only authorized operators can submit data
3. **Threshold Validation**: Encrypted comparisons ensure data privacy
4. **Gateway Integration**: Secure decryption through Zama Gateway
5. **Input Validation**: ZK proofs verify encrypted inputs

---

## Troubleshooting

### Common Issues

**Issue: "Insufficient funds"**
- Solution: Ensure your wallet has enough Sepolia ETH

**Issue: "Contract verification failed"**
- Solution: Check ETHERSCAN_API_KEY is set correctly
- Wait a few minutes after deployment before verifying

**Issue: "Transaction reverted"**
- Solution: Check function requirements and access control
- Ensure you're calling from the correct account

---

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [Zama FHE Documentation](https://docs.zama.ai/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Etherscan Sepolia](https://sepolia.etherscan.io/)

---

## License

MIT License
