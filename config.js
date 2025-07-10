const CONFIG = {
    CONTRACT_ADDRESS: '0x333bAec4BbC595049a6ec186Ddd6EE03fe349D44',

    NETWORKS: {
        SEPOLIA: {
            chainId: '0xaa36a7',
            chainName: 'Sepolia Test Network',
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io/']
        }
    },

    DATA_TYPES: {
        0: 'Temperature',
        1: 'Humidity',
        2: 'Pressure',
        3: 'Motion',
        4: 'Light',
        5: 'Sound'
    },

    CONTRACT_ABI: [
        {
            "inputs": [],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint8",
                    "name": "dataType",
                    "type": "uint8"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "timestamp",
                    "type": "uint256"
                }
            ],
            "name": "AlertTriggered",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                },
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "recordId",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint8",
                    "name": "dataType",
                    "type": "uint8"
                }
            ],
            "name": "DataSubmitted",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "deviceId",
                    "type": "string"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "owner",
                    "type": "address"
                }
            ],
            "name": "DeviceRegistered",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                }
            ],
            "name": "OperatorAdded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                }
            ],
            "name": "OperatorRemoved",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint8",
                    "name": "dataType",
                    "type": "uint8"
                }
            ],
            "name": "ThresholdSet",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                }
            ],
            "name": "addOperator",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "authorizedOperators",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "dataRecordCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "dataRecords",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                },
                {
                    "internalType": "uint8",
                    "name": "dataType",
                    "type": "uint8"
                },
                {
                    "internalType": "uint256",
                    "name": "timestamp",
                    "type": "uint256"
                },
                {
                    "internalType": "address",
                    "name": "submitter",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                }
            ],
            "name": "deactivateDevice",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "deviceCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "name": "deviceIdToIndex",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "devices",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "deviceId",
                    "type": "string"
                },
                {
                    "internalType": "address",
                    "name": "deviceOwner",
                    "type": "address"
                },
                {
                    "internalType": "bool",
                    "name": "isActive",
                    "type": "bool"
                },
                {
                    "internalType": "uint256",
                    "name": "registrationTime",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "lastUpdateTime",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "deviceId",
                    "type": "string"
                }
            ],
            "name": "getDeviceByString",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                },
                {
                    "internalType": "bool",
                    "name": "exists",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                }
            ],
            "name": "getDeviceDataCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "count",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                }
            ],
            "name": "getDeviceInfo",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "deviceId",
                    "type": "string"
                },
                {
                    "internalType": "address",
                    "name": "deviceOwner",
                    "type": "address"
                },
                {
                    "internalType": "bool",
                    "name": "isActive",
                    "type": "bool"
                },
                {
                    "internalType": "uint256",
                    "name": "registrationTime",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "lastUpdateTime",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "recordId",
                    "type": "uint256"
                }
            ],
            "name": "getDataRecord",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                },
                {
                    "internalType": "uint8",
                    "name": "dataType",
                    "type": "uint8"
                },
                {
                    "internalType": "uint256",
                    "name": "timestamp",
                    "type": "uint256"
                },
                {
                    "internalType": "address",
                    "name": "submitter",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getTotalDataRecords",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getTotalDevices",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                },
                {
                    "internalType": "uint8",
                    "name": "dataType",
                    "type": "uint8"
                }
            ],
            "name": "isThresholdSet",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "requestId",
                    "type": "uint256"
                },
                {
                    "internalType": "bool",
                    "name": "shouldAlert",
                    "type": "bool"
                },
                {
                    "internalType": "bytes[]",
                    "name": "signatures",
                    "type": "bytes[]"
                }
            ],
            "name": "processThresholdAlert",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "deviceId",
                    "type": "string"
                }
            ],
            "name": "registerDevice",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "operator",
                    "type": "address"
                }
            ],
            "name": "removeOperator",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                },
                {
                    "internalType": "uint8",
                    "name": "dataType",
                    "type": "uint8"
                },
                {
                    "internalType": "uint32",
                    "name": "minValue",
                    "type": "uint32"
                },
                {
                    "internalType": "uint32",
                    "name": "maxValue",
                    "type": "uint32"
                }
            ],
            "name": "setThreshold",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "deviceIndex",
                    "type": "uint256"
                },
                {
                    "internalType": "uint32",
                    "name": "value",
                    "type": "uint32"
                },
                {
                    "internalType": "uint8",
                    "name": "dataType",
                    "type": "uint8"
                }
            ],
            "name": "submitData",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]
};