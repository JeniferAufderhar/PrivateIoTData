# Hello FHEVM: Your First Confidential dApp

## Building a Private IoT Data Application with Fully Homomorphic Encryption

Welcome to the most beginner-friendly guide for creating your first confidential smart contract application using FHEVM (Fully Homomorphic Encryption Virtual Machine). This tutorial will walk you through building a complete dApp that handles sensitive IoT device data while maintaining complete privacy.

## 🎯 What You'll Learn

By the end of this tutorial, you will:
- Understand the basics of Fully Homomorphic Encryption (FHE) in smart contracts
- Create your first FHEVM smart contract
- Build a frontend that interacts with encrypted data
- Deploy a complete confidential application
- Handle encrypted inputs and outputs in a real-world scenario

## 📋 Prerequisites

Before starting, ensure you have:
- Basic Solidity knowledge (able to write simple smart contracts)
- Familiarity with standard Ethereum tools (Hardhat, MetaMask, React)
- No prior FHE or cryptography knowledge required!

## 🚀 Tutorial Overview

We'll build **Private IoT Data**, a confidential application that allows IoT devices to submit sensitive sensor data to the blockchain while keeping all information completely private. Users can:
- Submit encrypted sensor readings (temperature, humidity, motion)
- Query encrypted data without revealing actual values
- Perform computations on encrypted data
- Maintain complete privacy throughout the process

## Part 1: Understanding FHEVM Basics

### What is Fully Homomorphic Encryption?

Imagine you have a locked box (encrypted data) and you want to perform calculations on what's inside without opening the box. FHE makes this possible! You can:
- Add, subtract, multiply encrypted numbers
- Compare encrypted values
- Store and retrieve encrypted data
- All without ever seeing the actual values

### Why FHEVM for IoT Data?

IoT devices often collect sensitive information:
- Home temperature and occupancy data
- Health monitoring readings
- Security system status
- Industrial sensor measurements

With FHEVM, this data stays encrypted on-chain, providing privacy while enabling useful computations.

## Part 2: Setting Up Your Development Environment

### Step 1: Install Required Tools

```bash
# Install Node.js dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install fhevmjs

# Install Zama FHEVM library
npm install @zama-ai/fhevm-contracts
```

### Step 2: Configure Hardhat

Create `hardhat.config.js`:

```javascript
require('@nomicfoundation/hardhat-toolbox');

module.exports = {
  solidity: "0.8.19",
  networks: {
    zama: {
      url: "https://devnet.zama.ai/",
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
```

### Step 3: Environment Setup

Create `.env` file:

```
PRIVATE_KEY=your_private_key_here
ZAMA_NETWORK_URL=https://devnet.zama.ai/
```

## Part 3: Writing Your First FHEVM Smart Contract

### Understanding FHEVM Data Types

FHEVM introduces special encrypted data types:
- `euint32`: Encrypted 32-bit unsigned integer
- `ebool`: Encrypted boolean
- `eaddress`: Encrypted address

### Step 1: Basic Contract Structure

Create `contracts/PrivateIoTData.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@zama-ai/fhevm-contracts/contracts/FHE.sol";

contract PrivateIoTData {
    // Encrypted sensor reading structure
    struct SensorReading {
        euint32 temperature;    // Encrypted temperature
        euint32 humidity;       // Encrypted humidity
        ebool motionDetected;   // Encrypted motion status
        uint256 timestamp;      // Public timestamp
        address deviceId;       // Public device identifier
    }

    // Mapping to store encrypted readings
    mapping(address => SensorReading[]) private deviceReadings;
    mapping(address => bool) public authorizedDevices;

    address public owner;

    constructor() {
        owner = msg.sender;
    }

    // Events for frontend integration
    event ReadingSubmitted(address indexed device, uint256 timestamp);
    event DeviceAuthorized(address indexed device);
}
```

### Step 2: Adding Core Functionality

```solidity
// Authorize IoT devices
function authorizeDevice(address device) external {
    require(msg.sender == owner, "Only owner can authorize devices");
    authorizedDevices[device] = true;
    emit DeviceAuthorized(device);
}

// Submit encrypted sensor reading
function submitReading(
    einput encryptedTemp,
    einput encryptedHumidity,
    einput encryptedMotion
) external {
    require(authorizedDevices[msg.sender], "Device not authorized");

    // Convert encrypted inputs to FHEVM types
    euint32 temperature = FHE.asEuint32(encryptedTemp);
    euint32 humidity = FHE.asEuint32(encryptedHumidity);
    ebool motionDetected = FHE.asEbool(encryptedMotion);

    // Store the encrypted reading
    deviceReadings[msg.sender].push(SensorReading({
        temperature: temperature,
        humidity: humidity,
        motionDetected: motionDetected,
        timestamp: block.timestamp,
        deviceId: msg.sender
    }));

    emit ReadingSubmitted(msg.sender, block.timestamp);
}
```

### Step 3: Privacy-Preserving Queries

```solidity
// Get encrypted reading count (public)
function getReadingCount(address device) external view returns (uint256) {
    return deviceReadings[device].length;
}

// Check if temperature exceeds threshold (encrypted comparison)
function isTemperatureHigh(
    address device,
    uint256 readingIndex,
    einput encryptedThreshold
) external view returns (ebool) {
    require(readingIndex < deviceReadings[device].length, "Invalid reading index");

    euint32 threshold = FHE.asEuint32(encryptedThreshold);
    SensorReading storage reading = deviceReadings[device][readingIndex];

    // Encrypted comparison - result stays encrypted!
    return FHE.gt(reading.temperature, threshold);
}

// Get decrypted reading (only for authorized users)
function getDecryptedReading(
    address device,
    uint256 index
) external view returns (uint32, uint32, bool) {
    require(
        msg.sender == device || msg.sender == owner,
        "Not authorized to decrypt"
    );
    require(index < deviceReadings[device].length, "Invalid index");

    SensorReading storage reading = deviceReadings[device][index];

    // Decrypt values for authorized viewer
    return (
        FHE.decrypt(reading.temperature),
        FHE.decrypt(reading.humidity),
        FHE.decrypt(reading.motionDetected)
    );
}
```

## Part 4: Building the Frontend

### Step 1: Setting Up FHE Client

Create `src/fhevm.js`:

```javascript
import { createFhevmInstance } from 'fhevmjs';

let fhevmInstance = null;

export const initFhevm = async () => {
    if (fhevmInstance) return fhevmInstance;

    // Initialize FHEVM instance
    fhevmInstance = await createFhevmInstance({
        network: window.ethereum,
        gatewayUrl: 'https://gateway.devnet.zama.ai/'
    });

    return fhevmInstance;
};

export const getFhevmInstance = () => {
    if (!fhevmInstance) {
        throw new Error('FHEVM not initialized. Call initFhevm() first.');
    }
    return fhevmInstance;
};
```

### Step 2: Contract Integration

Create `src/contract.js`:

```javascript
import { ethers } from 'ethers';
import { getFhevmInstance } from './fhevm.js';

const CONTRACT_ADDRESS = '0x742d35Cc6634C0532925a3b8D1a8C1b0CbFde17A';
const CONTRACT_ABI = [
    // Add your contract ABI here
    "function submitReading(bytes32,bytes32,bytes32) external",
    "function getReadingCount(address) external view returns (uint256)",
    "function authorizeDevice(address) external",
    "event ReadingSubmitted(address indexed device, uint256 timestamp)"
];

export class ContractInterface {
    constructor(signer) {
        this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        this.fhevm = getFhevmInstance();
    }

    async submitSensorReading(temperature, humidity, motionDetected) {
        try {
            // Encrypt the data client-side
            const encryptedTemp = await this.fhevm.encrypt32(temperature);
            const encryptedHumidity = await this.fhevm.encrypt32(humidity);
            const encryptedMotion = await this.fhevm.encryptBool(motionDetected);

            // Submit to contract
            const tx = await this.contract.submitReading(
                encryptedTemp,
                encryptedHumidity,
                encryptedMotion
            );

            await tx.wait();
            return tx.hash;
        } catch (error) {
            console.error('Error submitting reading:', error);
            throw error;
        }
    }

    async getDeviceReadingCount(deviceAddress) {
        return await this.contract.getReadingCount(deviceAddress);
    }

    async authorizeDevice(deviceAddress) {
        const tx = await this.contract.authorizeDevice(deviceAddress);
        await tx.wait();
        return tx.hash;
    }
}
```

### Step 3: User Interface Components

Create `src/App.js`:

```javascript
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { initFhevm } from './fhevm.js';
import { ContractInterface } from './contract.js';
import './styles.css';

function App() {
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState('');
    const [sensorData, setSensorData] = useState({
        temperature: '',
        humidity: '',
        motionDetected: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [txHash, setTxHash] = useState('');

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            // Initialize FHEVM
            await initFhevm();

            // Connect to MetaMask
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                const signer = await provider.getSigner();

                setAccount(accounts[0]);
                setContract(new ContractInterface(signer));
            }
        } catch (error) {
            console.error('Initialization error:', error);
        }
    };

    const handleSubmitReading = async (e) => {
        e.preventDefault();
        if (!contract) return;

        setIsLoading(true);
        try {
            const hash = await contract.submitSensorReading(
                parseInt(sensorData.temperature),
                parseInt(sensorData.humidity),
                sensorData.motionDetected
            );

            setTxHash(hash);
            setSensorData({ temperature: '', humidity: '', motionDetected: false });
        } catch (error) {
            console.error('Submit error:', error);
            alert('Error submitting data: ' + error.message);
        }
        setIsLoading(false);
    };

    return (
        <div className="app">
            <header className="header">
                <h1>🔒 Private IoT Data</h1>
                <p>Submit confidential sensor data using FHEVM</p>
                {account && <div className="account">Connected: {account}</div>}
            </header>

            <main className="main-content">
                <div className="sensor-form-container">
                    <h2>Submit Sensor Reading</h2>
                    <form onSubmit={handleSubmitReading} className="sensor-form">
                        <div className="form-group">
                            <label>Temperature (°C):</label>
                            <input
                                type="number"
                                value={sensorData.temperature}
                                onChange={(e) => setSensorData({
                                    ...sensorData,
                                    temperature: e.target.value
                                })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Humidity (%):</label>
                            <input
                                type="number"
                                value={sensorData.humidity}
                                onChange={(e) => setSensorData({
                                    ...sensorData,
                                    humidity: e.target.value
                                })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={sensorData.motionDetected}
                                    onChange={(e) => setSensorData({
                                        ...sensorData,
                                        motionDetected: e.target.checked
                                    })}
                                />
                                Motion Detected
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !contract}
                            className="submit-button"
                        >
                            {isLoading ? 'Encrypting & Submitting...' : 'Submit Encrypted Data'}
                        </button>
                    </form>

                    {txHash && (
                        <div className="success-message">
                            ✅ Data submitted successfully!
                            <br />
                            Transaction: <code>{txHash}</code>
                        </div>
                    )}
                </div>

                <div className="info-panel">
                    <h3>🛡️ Privacy Guaranteed</h3>
                    <ul>
                        <li>Your data is encrypted before leaving your browser</li>
                        <li>Smart contract processes encrypted values only</li>
                        <li>Raw sensor data never visible on blockchain</li>
                        <li>Computations performed on encrypted data</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}

export default App;
```

## Part 5: Deployment and Testing

### Step 1: Deploy Smart Contract

Create `scripts/deploy.js`:

```javascript
const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying Private IoT Data contract...");

    const PrivateIoTData = await ethers.getContractFactory("PrivateIoTData");
    const contract = await PrivateIoTData.deploy();

    await contract.waitForDeployment();

    console.log("Contract deployed to:", await contract.getAddress());
    console.log("Deploy transaction:", contract.deploymentTransaction().hash);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
```

Run deployment:
```bash
npx hardhat run scripts/deploy.js --network zama
```

### Step 2: Test Your Contract

Create `test/PrivateIoTData.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PrivateIoTData", function () {
    let contract;
    let owner;
    let device;

    beforeEach(async function () {
        [owner, device] = await ethers.getSigners();

        const PrivateIoTData = await ethers.getContractFactory("PrivateIoTData");
        contract = await PrivateIoTData.deploy();
        await contract.waitForDeployment();
    });

    it("Should authorize devices", async function () {
        await contract.authorizeDevice(device.address);
        expect(await contract.authorizedDevices(device.address)).to.be.true;
    });

    it("Should accept encrypted sensor readings", async function () {
        await contract.authorizeDevice(device.address);

        // In actual test, you'd use real encrypted values
        const mockEncryptedData = ethers.ZeroHash;

        await contract.connect(device).submitReading(
            mockEncryptedData,
            mockEncryptedData,
            mockEncryptedData
        );

        expect(await contract.getReadingCount(device.address)).to.equal(1);
    });
});
```

## Part 6: Key Concepts Explained

### Understanding Encrypted Inputs

```javascript
// Client-side encryption
const temperature = 25; // Actual value
const encryptedTemp = await fhevm.encrypt32(temperature); // Encrypted value

// This encrypted value goes to the blockchain
// The actual number "25" never leaves your browser!
```

### Homomorphic Operations

```solidity
// Smart contract can perform operations on encrypted data
euint32 encryptedResult = FHE.add(encryptedTemp1, encryptedTemp2);
ebool isHot = FHE.gt(encryptedTemp, encryptedThreshold);

// Results are also encrypted!
// You can decrypt them client-side if authorized
```

### Privacy Model

1. **Client encrypts** data before sending
2. **Blockchain stores** encrypted data
3. **Smart contract** computes on encrypted values
4. **Authorized users** can decrypt results
5. **Raw data** never exposed publicly

## Part 7: Advanced Features

### Batch Processing

```solidity
function submitMultipleReadings(
    einput[] memory temperatures,
    einput[] memory humidities
) external {
    for(uint i = 0; i < temperatures.length; i++) {
        // Process each encrypted reading
        euint32 temp = FHE.asEuint32(temperatures[i]);
        euint32 humidity = FHE.asEuint32(humidities[i]);

        // Store encrypted values
        deviceReadings[msg.sender].push(SensorReading({
            temperature: temp,
            humidity: humidity,
            motionDetected: FHE.asEbool(false), // default
            timestamp: block.timestamp,
            deviceId: msg.sender
        }));
    }
}
```

### Encrypted Aggregations

```solidity
function getAverageTemperature(address device) external view returns (euint32) {
    require(deviceReadings[device].length > 0, "No readings available");

    euint32 sum = deviceReadings[device][0].temperature;

    for(uint i = 1; i < deviceReadings[device].length; i++) {
        sum = FHE.add(sum, deviceReadings[device][i].temperature);
    }

    // Return encrypted average (division on encrypted data)
    return FHE.div(sum, FHE.asEuint32(uint32(deviceReadings[device].length)));
}
```

## Part 8: Best Practices

### Security Considerations

1. **Always validate inputs** before encryption
2. **Use proper access controls** for decryption
3. **Implement rate limiting** for submissions
4. **Validate device authorization** before processing
5. **Handle encryption errors** gracefully

### Performance Optimization

1. **Batch operations** when possible
2. **Minimize encrypted computations** in loops
3. **Use appropriate data types** (euint8 vs euint32)
4. **Cache FHEVM instances** in frontend
5. **Optimize gas usage** for encrypted operations

### Error Handling

```javascript
const handleEncryptionError = async (operation) => {
    try {
        return await operation();
    } catch (error) {
        if (error.message.includes('encryption')) {
            throw new Error('Failed to encrypt data. Please check your input.');
        } else if (error.message.includes('network')) {
            throw new Error('Network error. Please try again.');
        } else {
            throw new Error('Unexpected error: ' + error.message);
        }
    }
};
```

## 🎉 Congratulations!

You've successfully built your first confidential dApp using FHEVM! Your application can now:

✅ Accept encrypted IoT sensor data
✅ Store encrypted values on-chain
✅ Perform computations on encrypted data
✅ Maintain complete privacy throughout
✅ Provide a user-friendly interface

## Next Steps

Now that you understand FHEVM basics, consider exploring:

1. **Advanced Cryptographic Operations**: More complex FHE computations
2. **Multi-Party Protocols**: Collaborative encrypted computations
3. **Privacy-Preserving Analytics**: Statistical analysis on encrypted datasets
4. **Cross-Chain Privacy**: Extending confidential data across networks
5. **Enterprise Applications**: Large-scale confidential data management

## Resources

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama Developer Resources](https://github.com/zama-ai)
- [FHE Learning Materials](https://github.com/zama-ai/awesome-zama)
- [Community Discord](https://discord.gg/zama)

## Troubleshooting

### Common Issues

**Issue**: "FHEVM not initialized"
**Solution**: Ensure `initFhevm()` is called before using encryption functions

**Issue**: "Device not authorized"
**Solution**: Call `authorizeDevice()` function before submitting readings

**Issue**: "Encryption failed"
**Solution**: Check that input values are within valid ranges for encrypted types

**Issue**: "Transaction reverted"
**Solution**: Verify contract is deployed and you're connected to the correct network

Remember: Building with FHEVM opens up entirely new possibilities for privacy-preserving applications. This is just the beginning of your journey into confidential computing!

---

*Happy building with FHEVM! 🚀*