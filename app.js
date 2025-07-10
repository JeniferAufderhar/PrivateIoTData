class IoTPrivacyApp {
    constructor() {
        this.contract = new ContractInterface();
        this.userAddress = null;
        this.isConnected = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.setupAccountHandlers();
        await this.checkConnection();
    }

    setupEventListeners() {
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        document.getElementById('registerDevice').addEventListener('click', () => this.registerDevice());
        document.getElementById('submitData').addEventListener('click', () => this.submitData());
        document.getElementById('setThreshold').addEventListener('click', () => this.setThreshold());
        document.getElementById('loadRecords').addEventListener('click', () => this.loadDataRecords());

        // Auto-refresh data when switching to devices tab
        document.querySelector('[onclick="showTab(\'devices\')"]').addEventListener('click', () => {
            if (this.isConnected) {
                setTimeout(() => this.loadDashboard(), 100);
            }
        });
    }

    setupAccountHandlers() {
        this.contract.onAccountChanged((accounts) => {
            if (accounts.length === 0) {
                this.handleDisconnect();
            } else {
                window.location.reload();
            }
        });

        this.contract.onChainChanged(() => {
            window.location.reload();
        });
    }

    async checkConnection() {
        try {
            if (window.ethereum && window.ethereum.selectedAddress) {
                await this.connectWallet();
            }
        } catch (error) {
            console.log('No previous connection found');
        }
    }

    async connectWallet() {
        try {
            this.showLoading(true);
            this.userAddress = await this.contract.init();
            this.isConnected = true;

            document.getElementById('connectWallet').style.display = 'none';
            document.getElementById('walletInfo').classList.remove('hidden');
            document.getElementById('walletAddress').textContent = this.contract.formatAddress(this.userAddress);
            document.getElementById('networkStatus').textContent = 'Sepolia';

            await this.loadDashboard();
            this.showNotification('Wallet connected successfully!', 'success');

        } catch (error) {
            console.error('Connection failed:', error);
            this.showNotification(`Failed to connect: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    handleDisconnect() {
        this.isConnected = false;
        this.userAddress = null;
        document.getElementById('connectWallet').style.display = 'block';
        document.getElementById('walletInfo').classList.add('hidden');
        this.clearDashboard();
    }

    async loadDashboard() {
        try {
            const [totalDevices, totalRecords, myDevices] = await Promise.all([
                this.contract.getTotalDevices(),
                this.contract.getTotalDataRecords(),
                this.contract.getMyDevices()
            ]);

            document.getElementById('totalDevices').textContent = myDevices.length;
            document.getElementById('activeDevices').textContent = myDevices.filter(d => d.isActive).length;
            document.getElementById('totalRecords').textContent = totalRecords.toString();

            this.displayDevices(myDevices);

        } catch (error) {
            console.error('Failed to load dashboard:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    displayDevices(devices) {
        const devicesList = document.getElementById('devicesList');

        if (devices.length === 0) {
            devicesList.innerHTML = '<div class="empty-state">No devices registered yet. Use the Register Device tab to add your first device.</div>';
            return;
        }

        devicesList.innerHTML = devices.map(device => `
            <div class="device-card">
                <div class="device-header">
                    <h3>${device.deviceId}</h3>
                    <span class="device-status ${device.isActive ? 'active' : 'inactive'}">
                        ${device.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div class="device-info">
                    <p><strong>Index:</strong> ${device.index}</p>
                    <p><strong>Registered:</strong> ${this.contract.formatTimestamp(device.registrationTime)}</p>
                    <p><strong>Last Update:</strong> ${device.lastUpdateTime > 0 ? this.contract.formatTimestamp(device.lastUpdateTime) : 'Never'}</p>
                </div>
                ${device.isActive ? `
                    <div class="device-actions">
                        <button onclick="app.deactivateDevice(${device.index})" class="btn-danger">Deactivate</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    async registerDevice() {
        const deviceId = document.getElementById('deviceId').value.trim();

        if (!deviceId) {
            this.showNotification('Please enter a device ID', 'error');
            return;
        }

        if (!this.isConnected) {
            this.showNotification('Please connect your wallet first', 'error');
            return;
        }

        try {
            this.showLoading(true);
            const txHash = await this.contract.registerDevice(deviceId);

            this.showNotification('Device registered successfully!', 'success');
            document.getElementById('deviceId').value = '';
            await this.loadDashboard();

        } catch (error) {
            console.error('Registration failed:', error);
            this.showNotification(`Registration failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async submitData() {
        const deviceIdStr = document.getElementById('dataDeviceId').value.trim();
        const value = document.getElementById('dataValue').value;
        const dataType = document.getElementById('dataType').value;

        if (!deviceIdStr || !value || dataType === '') {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!this.isConnected) {
            this.showNotification('Please connect your wallet first', 'error');
            return;
        }

        try {
            this.showLoading(true);

            const deviceIndex = await this.contract.getDeviceIndexByString(deviceIdStr);
            if (deviceIndex === null) {
                this.showNotification('Device not found', 'error');
                return;
            }

            const txHash = await this.contract.submitData(deviceIndex, parseInt(value), parseInt(dataType));

            this.showNotification('Data submitted successfully!', 'success');
            document.getElementById('dataDeviceId').value = '';
            document.getElementById('dataValue').value = '';
            await this.loadDashboard();

        } catch (error) {
            console.error('Data submission failed:', error);
            this.showNotification(`Data submission failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async setThreshold() {
        const deviceIdStr = document.getElementById('thresholdDeviceId').value.trim();
        const dataType = document.getElementById('thresholdDataType').value;
        const minValue = document.getElementById('minValue').value;
        const maxValue = document.getElementById('maxValue').value;

        if (!deviceIdStr || dataType === '' || !minValue || !maxValue) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (parseInt(minValue) > parseInt(maxValue)) {
            this.showNotification('Minimum value cannot be greater than maximum value', 'error');
            return;
        }

        if (!this.isConnected) {
            this.showNotification('Please connect your wallet first', 'error');
            return;
        }

        try {
            this.showLoading(true);

            const deviceIndex = await this.contract.getDeviceIndexByString(deviceIdStr);
            if (deviceIndex === null) {
                this.showNotification('Device not found', 'error');
                return;
            }

            const txHash = await this.contract.setThreshold(
                deviceIndex,
                parseInt(dataType),
                parseInt(minValue),
                parseInt(maxValue)
            );

            this.showNotification('Threshold set successfully!', 'success');
            document.getElementById('thresholdDeviceId').value = '';
            document.getElementById('minValue').value = '';
            document.getElementById('maxValue').value = '';

        } catch (error) {
            console.error('Threshold setting failed:', error);
            this.showNotification(`Threshold setting failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deactivateDevice(deviceIndex) {
        if (!confirm('Are you sure you want to deactivate this device?')) {
            return;
        }

        try {
            this.showLoading(true);
            const txHash = await this.contract.deactivateDevice(deviceIndex);

            this.showNotification('Device deactivated successfully!', 'success');
            await this.loadDashboard();

        } catch (error) {
            console.error('Deactivation failed:', error);
            this.showNotification(`Deactivation failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadDataRecords() {
        const searchDeviceId = document.getElementById('searchDeviceId').value.trim();

        if (!this.isConnected) {
            this.showNotification('Please connect your wallet first', 'error');
            return;
        }

        try {
            this.showLoading(true);

            let deviceFilter = null;
            if (searchDeviceId) {
                deviceFilter = await this.contract.getDeviceIndexByString(searchDeviceId);
                if (deviceFilter === null) {
                    this.showNotification('Device not found', 'error');
                    return;
                }
            }

            const records = await this.contract.getAllDataRecords(deviceFilter);
            this.displayDataRecords(records);

        } catch (error) {
            console.error('Failed to load records:', error);
            this.showNotification('Failed to load data records', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    displayDataRecords(records) {
        const recordsList = document.getElementById('recordsList');

        if (records.length === 0) {
            recordsList.innerHTML = '<div class="empty-state">No data records found.</div>';
            return;
        }

        recordsList.innerHTML = records.map(record => `
            <div class="record-card">
                <div class="record-header">
                    <h4>Record #${record.recordId}</h4>
                    <span class="data-type">${this.contract.getDataTypeName(record.dataType)}</span>
                </div>
                <div class="record-info">
                    <p><strong>Device Index:</strong> ${record.deviceIndex}</p>
                    <p><strong>Timestamp:</strong> ${this.contract.formatTimestamp(record.timestamp)}</p>
                    <p><strong>Submitter:</strong> ${this.contract.formatAddress(record.submitter)}</p>
                </div>
            </div>
        `).join('');
    }

    clearDashboard() {
        document.getElementById('totalDevices').textContent = '0';
        document.getElementById('activeDevices').textContent = '0';
        document.getElementById('totalRecords').textContent = '0';
        document.getElementById('devicesList').innerHTML = '';
        document.getElementById('recordsList').innerHTML = '';
    }

    showLoading(show) {
        document.getElementById('loading').classList.toggle('hidden', !show);
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const messageElement = document.getElementById('notificationMessage');

        messageElement.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }
}

function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');
}

function hideNotification() {
    document.getElementById('notification').classList.add('hidden');
}

// Initialize the app
const app = new IoTPrivacyApp();