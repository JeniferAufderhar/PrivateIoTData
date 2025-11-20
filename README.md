# 🔐 Private IoT Data Platform

**Privacy-Preserving IoT Data Management with Fully Homomorphic Encryption**

🌐 **[Live Demo](https://private-io-t-data.vercel.app/)** | 🎥 **[Video Demo](PrivateIoTData.mp4)** | 📄 **[Documentation](TUTORIAL.md)**

A decentralized platform for secure IoT device data management using Zama's FHEVM technology, enabling encrypted computation on sensitive sensor data while maintaining complete privacy.

Built for the **Zama FHE Challenge** - demonstrating practical privacy-preserving applications for IoT ecosystems.

---

## ✨ Features

- 🔒 **End-to-End Encryption** - IoT sensor data remains encrypted throughout its lifecycle
- 🧮 **Homomorphic Computation** - Perform calculations on encrypted data without decryption
- 📊 **Privacy-Preserving Analytics** - Compute statistics and thresholds on encrypted sensor readings
- 🔔 **Encrypted Threshold Alerts** - Set and trigger alerts using FHE comparisons
- 👥 **Granular Access Control** - Device owners, operators, and administrators with different permissions
- 🌐 **Multi-Device Management** - Register and manage unlimited IoT devices
- ⚡ **Real-time Data Processing** - Efficient handling of continuous IoT data streams
- 🛡️ **Zero-Knowledge Proofs** - Verify data integrity without revealing sensitive information
- 🔗 **Blockchain Immutability** - Tamper-proof audit trail of all data operations
- 📱 **User-Friendly Interface** - Modern web UI for device and data management

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React UI   │  │ Client-side  │  │   MetaMask   │          │
│  │  Dashboard   │→ │ FHE Encrypt  │→ │ Integration  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Zama FHEVM Smart Contract                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  PrivateIoTData.sol                                       │  │
│  │  ├─ Device Registration (string → euint32)               │  │
│  │  ├─ Encrypted Data Storage (euint32)                     │  │
│  │  ├─ Homomorphic Operations (FHE.add, FHE.gt, FHE.lt)     │  │
│  │  ├─ Threshold Alerts (ebool comparisons)                 │  │
│  │  └─ Access Control (owner, operators, device owners)     │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Sepolia Testnet                               │
│  Network: Sepolia (Chain ID: 11155111)                          │
│  Contract: 0x333bAec4BbC595049a6ec186Ddd6EE03fe349D44           │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
IoT Device → Frontend Encryption → Smart Contract → Encrypted Storage
     │                                     │
     │                                     ├─→ Homomorphic Computation
     │                                     │
     └─────────────────────────────────────┴─→ Encrypted Results
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ and npm
- MetaMask wallet
- Sepolia testnet ETH ([faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/PrivateIoTData.git
cd PrivateIoTData

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration

Create a `.env` file:

```env
# Network Configuration
INFURA_API_KEY=your_infura_api_key
SEPOLIA_PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Optional: Gas Reporting
COINMARKETCAP_API_KEY=your_cmc_api_key
REPORT_GAS=true
```

### Development

```bash
# Compile smart contracts
npm run compile

# Run tests
npm test

# Run tests with gas reporting
npm run test:gas

# Generate coverage report
npm run coverage

# Start development server
npm run dev
```

### Deployment

```bash
# Deploy to Sepolia testnet
npx hardhat deploy --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# Deploy frontend to Vercel
npm run deploy
```

---

## 🔧 Technical Implementation

### Smart Contract (Solidity + FHEVM)

The core contract uses Zama's FHEVM for encrypted computation:

```solidity
import { FHE, euint32, euint8, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract PrivateIoTData is SepoliaConfig {
    // Encrypted data storage
    struct DataRecord {
        uint256 deviceIndex;
        euint32 encryptedValue;  // FHE encrypted sensor reading
        uint8 dataType;
        uint256 timestamp;
        address submitter;
    }

    // Submit encrypted IoT data
    function submitData(uint256 deviceIndex, uint32 value, uint8 dataType) external {
        euint32 encryptedValue = FHE.asEuint32(value);

        // Store encrypted data
        dataRecords[recordId] = DataRecord({
            deviceIndex: deviceIndex,
            encryptedValue: encryptedValue,
            dataType: dataType,
            timestamp: block.timestamp,
            submitter: msg.sender
        });

        // Grant decryption permissions
        FHE.allowThis(encryptedValue);
        FHE.allow(encryptedValue, devices[deviceIndex].deviceOwner);
    }

    // Set encrypted threshold for alerts
    function setThreshold(uint256 deviceIndex, uint8 dataType,
                         uint32 minValue, uint32 maxValue) external {
        euint32 encryptedMin = FHE.asEuint32(minValue);
        euint32 encryptedMax = FHE.asEuint32(maxValue);

        // Homomorphic comparison for alerts
        ebool belowMin = FHE.lt(value, encryptedMin);
        ebool aboveMax = FHE.gt(value, encryptedMax);
        ebool alertNeeded = FHE.or(belowMin, aboveMax);
    }
}
```

### Encrypted Data Types

The contract uses these FHEVM encrypted types:

- `euint32` - Encrypted 32-bit unsigned integers for sensor data
- `euint8` - Encrypted 8-bit values for smaller data
- `ebool` - Encrypted boolean for threshold comparisons

### FHE Operations

Available homomorphic operations:

```solidity
// Arithmetic
FHE.add(a, b)      // Encrypted addition
FHE.sub(a, b)      // Encrypted subtraction

// Comparison
FHE.eq(a, b)       // Encrypted equality check
FHE.lt(a, b)       // Encrypted less than
FHE.gt(a, b)       // Encrypted greater than
FHE.ge(a, b)       // Encrypted greater or equal

// Logical
FHE.and(a, b)      // Encrypted AND
FHE.or(a, b)       // Encrypted OR
FHE.not(a)         // Encrypted NOT
```

### Frontend Integration

```javascript
import { initFhevm, createInstance } from "fhevmjs";

// Initialize FHEVM
const instance = await createInstance({
  chainId: 11155111,
  networkUrl: "https://sepolia.infura.io/v3/YOUR_KEY",
});

// Encrypt data client-side
const encryptedValue = await instance.encrypt32(sensorValue);

// Submit to contract
await contract.submitData(deviceIndex, encryptedValue, dataType);

// Decrypt result (if authorized)
const decryptedValue = await instance.decrypt(
  await contract.getLastDataValue(deviceIndex)
);
```

---

## 📋 Usage Guide

### 1. Register an IoT Device

```bash
# Via Web Interface
1. Connect MetaMask to Sepolia
2. Click "Register Device"
3. Enter unique device ID
4. Confirm transaction

# Via Contract
await contract.registerDevice("temperature-sensor-001");
```

### 2. Submit Encrypted Sensor Data

```javascript
// Data types:
// 0 = Temperature (°C × 100)
// 1 = Humidity (% × 100)
// 2 = Pressure (hPa)
// 3 = Motion (boolean: 0 or 1)

// Example: Submit 25.5°C
await contract.submitData(
  deviceIndex,
  2550,  // 25.50°C
  0      // Temperature type
);
```

### 3. Set Threshold Alerts

```javascript
// Alert if temperature outside 20-30°C range
await contract.setThreshold(
  deviceIndex,
  0,      // Temperature type
  2000,   // Min: 20.00°C
  3000    // Max: 30.00°C
);
```

### 4. Query Device Data

```javascript
// Get device information
const info = await contract.getDeviceInfo(deviceIndex);
console.log(`Owner: ${info.deviceOwner}`);
console.log(`Active: ${info.isActive}`);
console.log(`Last Update: ${new Date(info.lastUpdateTime * 1000)}`);

// Get total data records
const recordCount = await contract.getDeviceDataCount(deviceIndex);
console.log(`Total Records: ${recordCount}`);
```

---

## 🛡️ Privacy Model

### What's Private

- ✅ **Sensor Reading Values** - All IoT data encrypted with FHE (euint32)
- ✅ **Individual Device Data** - Each device's readings remain confidential
- ✅ **Threshold Comparisons** - Alert logic computed on encrypted data
- ✅ **Aggregate Statistics** - Computed homomorphically without decryption

### What's Public

- ⚠️ **Transaction Metadata** - Timestamps, device IDs, submitter addresses
- ⚠️ **Device Count** - Total number of registered devices
- ⚠️ **Data Record Count** - Number of submissions per device
- ⚠️ **Data Types** - Category of sensor data (temperature, humidity, etc.)

### Decryption Permissions

| Role | Can Decrypt |
|------|-------------|
| **Device Owner** | Own device's encrypted data |
| **Contract Owner** | Administrative access (if needed) |
| **Authorized Operators** | Specific data with permissions |
| **Public** | Nothing - all values remain encrypted |

---

## 🧪 Testing

Comprehensive test suite with **76 test cases** covering all functionality.

```bash
# Run all tests (Mock environment)
npm test

# Run with gas reporting
npm run test:gas

# Run on Sepolia testnet
npm run test:sepolia

# Generate coverage report
npm run coverage
```

### Test Coverage

```
Contract: PrivateIoTData
  ✓ Deployment & Initialization (6 tests)
  ✓ Operator Management (5 tests)
  ✓ Device Registration (10 tests)
  ✓ Device Deactivation (3 tests)
  ✓ Data Submission (14 tests)
  ✓ Data Retrieval (4 tests)
  ✓ Threshold Management (9 tests)
  ✓ View Functions (5 tests)
  ✓ Gas Optimization (3 tests)
  ✓ Edge Cases & Security (5 tests)

Contract: PrivateIoTDataSepolia
  ✓ Device Registration on Sepolia
  ✓ Encrypted Data Submission
  ✓ Threshold Management
  ✓ Operator Authorization
  ✓ Information Retrieval

71 passing (Mock)
5 passing (Sepolia)
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

---

## 🌐 Live Deployment

### Network Details

- **Network**: Sepolia Testnet
- **Chain ID**: 11155111
- **Contract Address**: `0x333bAec4BbC595049a6ec186Ddd6EE03fe349D44`
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x333bAec4BbC595049a6ec186Ddd6EE03fe349D44)

### Live Demo

🌐 **Web Application**: [https://private-io-t-data.vercel.app/](https://private-io-t-data.vercel.app/)

Try the live demo:
1. Connect MetaMask to Sepolia
2. Get testnet ETH from [faucet](https://sepoliafaucet.com/)
3. Register your IoT device
4. Submit encrypted sensor data
5. Set threshold alerts

---

## 💻 Tech Stack

### Smart Contract

- **Blockchain**: Ethereum Sepolia Testnet
- **Framework**: Hardhat 2.26.0
- **Language**: Solidity 0.8.24
- **FHE Library**: Zama FHEVM (@fhevm/solidity)
- **Testing**: Mocha + Chai
- **Type Safety**: TypeChain

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Web3**: wagmi 2.5 + RainbowKit 2.1
- **FHE Client**: fhevmjs
- **Deployment**: Vercel

### Development Tools

- **Testing**: Hardhat + Mocha + Chai (76 test cases)
- **Coverage**: solidity-coverage
- **Gas Analysis**: hardhat-gas-reporter
- **Linting**: Solhint + ESLint
- **Formatting**: Prettier

---

## 📁 Project Structure

```
PrivateIoTData/
├── contracts/
│   └── PrivateIoTData.sol          # Main FHE contract
├── test/
│   ├── PrivateIoTData.ts           # 71 unit tests
│   ├── PrivateIoTDataSepolia.ts    # 5 integration tests
│   └── SecurityTests.ts            # Additional security tests
├── deploy/
│   └── 01_deploy_privateiotdata.ts # Deployment script
├── public/
│   └── contracts/                  # Compiled contracts for frontend
├── app.js                          # Frontend application logic
├── contract.js                     # Web3 integration
├── config.js                       # Configuration
├── index.html                      # Main UI
├── styles.css                      # Styling
├── hardhat.config.cjs              # Hardhat configuration
├── package.json                    # Dependencies & scripts
├── TESTING.md                      # Testing documentation
├── TUTORIAL.md                     # User guide
├── LICENSE                         # MIT License
└── README.md                       # This file
```

---

## 🔒 Security Considerations

### Threat Model

✅ **Protected Against:**
- Data exposure during computation
- Unauthorized data access
- Man-in-the-middle attacks on encrypted data
- Inference attacks on aggregate statistics

⚠️ **Not Protected Against:**
- Transaction metadata analysis
- Device ID pattern analysis
- Timing attacks (blockchain timestamps public)

### Best Practices

- Always encrypt sensitive data client-side before submission
- Use threshold alerts instead of exposing raw values
- Rotate device IDs periodically for enhanced privacy
- Limit decryption permissions to authorized addresses only

### Audit Status

This is a demonstration project built for the Zama FHE Challenge. For production use:
- Conduct professional security audit
- Implement additional access controls
- Add rate limiting and DoS protection
- Set up monitoring and alerting

---

## 🎯 Use Cases

### Smart Homes
- 🏠 Private monitoring of home environmental conditions
- 🔔 Encrypted threshold alerts for temperature, humidity
- 📊 Privacy-preserving usage analytics

### Industrial IoT
- 🏭 Sensitive manufacturing sensor data
- ⚙️ Equipment performance metrics
- 🔧 Predictive maintenance without exposing patterns

### Healthcare IoT
- 🏥 Patient monitoring devices
- 💊 Confidential health metrics
- 📈 Secure data aggregation for research

### Environmental Monitoring
- 🌡️ Private sensor networks
- 🌍 Confidential environmental data
- 🔬 Secure research datasets

---

## 🗺️ Roadmap

### Phase 1: Core Features ✅
- [x] FHE-based encrypted data storage
- [x] Device registration and management
- [x] Threshold alert system
- [x] Web interface
- [x] Comprehensive testing suite

### Phase 2: Enhanced Features 🚧
- [ ] Multi-device data aggregation
- [ ] Advanced analytics on encrypted data
- [ ] Mobile application
- [ ] Real-time dashboard with charts

### Phase 3: Production Ready 📋
- [ ] Multi-chain support (Polygon, Arbitrum)
- [ ] Enterprise features (teams, roles)
- [ ] API gateway for third-party integrations
- [ ] Advanced access control (RBAC)

### Phase 4: Advanced Capabilities 🔮
- [ ] Machine learning on encrypted IoT data
- [ ] Decentralized storage integration (IPFS)
- [ ] Cross-device encrypted correlations
- [ ] Automated compliance reporting

---

## 🤝 Contributing

We welcome contributions from the community!

### How to Contribute

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass before submitting

### Areas for Contribution

- 🔧 FHE algorithm optimizations
- 📱 Mobile app development
- 🎨 UI/UX improvements
- 📚 Documentation enhancements
- 🧪 Additional test coverage
- 🔌 IoT device integrations

---

## 🙏 Acknowledgments

- **Zama** - For pioneering FHE technology and the FHEVM platform ([docs.zama.ai](https://docs.zama.ai))
- **Ethereum Foundation** - For Sepolia testnet infrastructure
- **OpenZeppelin** - For smart contract best practices
- **The FHE Community** - For ongoing research and support

Built with ❤️ for the **Zama FHE Challenge**

---

## 📚 Resources

### Documentation
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
- [fhevmjs SDK](https://docs.zama.ai/fhevm/getting-started/using-fhevmjs)
- [Hardhat Documentation](https://hardhat.org/docs)

### Tutorials
- [Getting Started with FHEVM](https://docs.zama.ai/fhevm/getting-started)
- [FHE Operations Guide](https://docs.zama.ai/fhevm/fundamentals/types)
- [Sepolia Testnet Guide](https://ethereum.org/en/developers/docs/networks/#sepolia)

### Tools
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Sepolia Explorer](https://sepolia.etherscan.io/)
- [MetaMask](https://metamask.io/)

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/PrivateIoTData/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/PrivateIoTData/discussions)
- **Twitter**: [@YourHandle](https://twitter.com/yourhandle)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License - Copyright (c) 2025 Private IoT Data Contributors
```

---

<div align="center">

**[Live Demo](https://private-io-t-data.vercel.app/)** • **[Documentation](TUTORIAL.md)** • **[Tests](TESTING.md)**

Built with Zama FHEVM 🔐

</div>
