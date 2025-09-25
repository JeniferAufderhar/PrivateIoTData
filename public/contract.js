class ContractInterface {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
    }

    async init() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed');
        }

        this.provider = new ethers.providers.Web3Provider(window.ethereum);
        await this.provider.send("eth_requestAccounts", []);
        this.signer = this.provider.getSigner();
        this.userAddress = await this.signer.getAddress();

        this.contract = new ethers.Contract(
            CONFIG.CONTRACT_ADDRESS,
            CONFIG.CONTRACT_ABI,
            this.signer
        );

        await this.checkNetwork();
        return this.userAddress;
    }

    async checkNetwork() {
        const network = await this.provider.getNetwork();
        if (network.chainId !== 11155111) { // Sepolia chainId
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: CONFIG.NETWORKS.SEPOLIA.chainId }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [CONFIG.NETWORKS.SEPOLIA],
                    });
                }
                throw switchError;
            }
        }
    }

    async registerDevice(deviceId) {
        if (!this.contract) throw new Error('Contract not initialized');

        const tx = await this.contract.registerDevice(deviceId);
        await tx.wait();

        return tx.hash;
    }

    async submitData(deviceIndex, value, dataType) {
        if (!this.contract) throw new Error('Contract not initialized');

        const tx = await this.contract.submitData(deviceIndex, value, dataType);
        await tx.wait();

        return tx.hash;
    }

    async setThreshold(deviceIndex, dataType, minValue, maxValue) {
        if (!this.contract) throw new Error('Contract not initialized');

        const tx = await this.contract.setThreshold(deviceIndex, dataType, minValue, maxValue);
        await tx.wait();

        return tx.hash;
    }

    async deactivateDevice(deviceIndex) {
        if (!this.contract) throw new Error('Contract not initialized');

        const tx = await this.contract.deactivateDevice(deviceIndex);
        await tx.wait();

        return tx.hash;
    }

    async getTotalDevices() {
        if (!this.contract) throw new Error('Contract not initialized');
        return await this.contract.getTotalDevices();
    }

    async getTotalDataRecords() {
        if (!this.contract) throw new Error('Contract not initialized');
        return await this.contract.getTotalDataRecords();
    }

    async getDeviceInfo(deviceIndex) {
        if (!this.contract) throw new Error('Contract not initialized');
        return await this.contract.getDeviceInfo(deviceIndex);
    }

    async getDeviceByString(deviceId) {
        if (!this.contract) throw new Error('Contract not initialized');
        return await this.contract.getDeviceByString(deviceId);
    }

    async getDataRecord(recordId) {
        if (!this.contract) throw new Error('Contract not initialized');
        return await this.contract.getDataRecord(recordId);
    }

    async getDeviceDataCount(deviceIndex) {
        if (!this.contract) throw new Error('Contract not initialized');
        return await this.contract.getDeviceDataCount(deviceIndex);
    }

    async isThresholdSet(deviceIndex, dataType) {
        if (!this.contract) throw new Error('Contract not initialized');
        return await this.contract.isThresholdSet(deviceIndex, dataType);
    }

    async getMyDevices() {
        if (!this.contract) throw new Error('Contract not initialized');

        const totalDevices = await this.getTotalDevices();
        const myDevices = [];

        for (let i = 0; i < totalDevices; i++) {
            try {
                const deviceInfo = await this.getDeviceInfo(i);
                if (deviceInfo.deviceOwner.toLowerCase() === this.userAddress.toLowerCase()) {
                    myDevices.push({
                        index: i,
                        deviceId: deviceInfo.deviceId,
                        deviceOwner: deviceInfo.deviceOwner,
                        isActive: deviceInfo.isActive,
                        registrationTime: deviceInfo.registrationTime,
                        lastUpdateTime: deviceInfo.lastUpdateTime
                    });
                }
            } catch (error) {
                console.warn(`Could not fetch device ${i}:`, error);
            }
        }

        return myDevices;
    }

    async getAllDataRecords(deviceFilter = null) {
        if (!this.contract) throw new Error('Contract not initialized');

        const totalRecords = await this.getTotalDataRecords();
        const records = [];

        for (let i = 0; i < totalRecords; i++) {
            try {
                const record = await this.getDataRecord(i);

                if (deviceFilter !== null && record.deviceIndex !== deviceFilter) {
                    continue;
                }

                records.push({
                    recordId: i,
                    deviceIndex: record.deviceIndex,
                    dataType: record.dataType,
                    timestamp: record.timestamp,
                    submitter: record.submitter
                });
            } catch (error) {
                console.warn(`Could not fetch record ${i}:`, error);
            }
        }

        return records.reverse(); // Show newest first
    }

    async getDeviceIndexByString(deviceId) {
        try {
            const result = await this.getDeviceByString(deviceId);
            if (result.exists) {
                return result.deviceIndex;
            }
            return null;
        } catch (error) {
            console.error('Error getting device by string:', error);
            return null;
        }
    }

    formatTimestamp(timestamp) {
        return new Date(timestamp * 1000).toLocaleString();
    }

    formatAddress(address) {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    getDataTypeName(dataType) {
        return CONFIG.DATA_TYPES[dataType] || 'Unknown';
    }

    async waitForTransaction(txHash) {
        if (!this.provider) throw new Error('Provider not initialized');
        return await this.provider.waitForTransaction(txHash);
    }

    async getTransactionReceipt(txHash) {
        if (!this.provider) throw new Error('Provider not initialized');
        return await this.provider.getTransactionReceipt(txHash);
    }

    async getBalance() {
        if (!this.signer) throw new Error('Signer not initialized');
        const balance = await this.signer.getBalance();
        return ethers.utils.formatEther(balance);
    }

    onAccountChanged(callback) {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', callback);
        }
    }

    onChainChanged(callback) {
        if (window.ethereum) {
            window.ethereum.on('chainChanged', callback);
        }
    }
}