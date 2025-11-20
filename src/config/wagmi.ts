import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Private IoT Data Platform',
  projectId: 'YOUR_PROJECT_ID',
  chains: [sepolia],
  ssr: false,
});

export const CONTRACT_ADDRESS = '0xYourContractAddress';

export const CONTRACT_ABI = [
  {
    "inputs": [{"internalType": "string", "name": "deviceId", "type": "string"}],
    "name": "registerDevice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "deviceIndex", "type": "uint256"},
      {"internalType": "uint32", "name": "value", "type": "uint32"},
      {"internalType": "uint8", "name": "dataType", "type": "uint8"}
    ],
    "name": "submitData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "deviceIndex", "type": "uint256"},
      {"internalType": "uint8", "name": "dataType", "type": "uint8"},
      {"internalType": "uint32", "name": "minValue", "type": "uint32"},
      {"internalType": "uint32", "name": "maxValue", "type": "uint32"}
    ],
    "name": "setThreshold",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deviceCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "dataRecordCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "deviceIndex", "type": "uint256"}],
    "name": "getDeviceInfo",
    "outputs": [
      {"internalType": "string", "name": "deviceId", "type": "string"},
      {"internalType": "address", "name": "deviceOwner", "type": "address"},
      {"internalType": "bool", "name": "isActive", "type": "bool"},
      {"internalType": "uint256", "name": "registrationTime", "type": "uint256"},
      {"internalType": "uint256", "name": "lastUpdateTime", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "recordId", "type": "uint256"}],
    "name": "getDataRecord",
    "outputs": [
      {"internalType": "uint256", "name": "deviceIndex", "type": "uint256"},
      {"internalType": "uint8", "name": "dataType", "type": "uint8"},
      {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
      {"internalType": "address", "name": "submitter", "type": "address"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "deviceIndex", "type": "uint256"}],
    "name": "getDeviceDataCount",
    "outputs": [{"internalType": "uint256", "name": "count", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "deviceId", "type": "string"}],
    "name": "getDeviceByString",
    "outputs": [
      {"internalType": "uint256", "name": "deviceIndex", "type": "uint256"},
      {"internalType": "bool", "name": "exists", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "deviceIndex", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "deviceId", "type": "string"},
      {"indexed": true, "internalType": "address", "name": "owner", "type": "address"}
    ],
    "name": "DeviceRegistered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "deviceIndex", "type": "uint256"},
      {"indexed": true, "internalType": "uint256", "name": "recordId", "type": "uint256"},
      {"indexed": false, "internalType": "uint8", "name": "dataType", "type": "uint8"}
    ],
    "name": "DataSubmitted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "deviceIndex", "type": "uint256"},
      {"indexed": false, "internalType": "uint8", "name": "dataType", "type": "uint8"}
    ],
    "name": "ThresholdSet",
    "type": "event"
  }
] as const;
