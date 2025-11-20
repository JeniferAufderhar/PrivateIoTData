// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint32, euint8, euint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PrivateIoTData
 * @notice Secure IoT Data Management with FHE and Gateway Callback Pattern
 * @dev Implements privacy-preserving IoT data storage with advanced security features
 *
 * Architecture Overview:
 * 1. User submits encrypted data request
 * 2. Contract records request and locks funds
 * 3. Gateway decrypts and validates data
 * 4. Gateway calls back to complete transaction
 * 5. Timeout protection enables refunds for failed decryptions
 */
contract PrivateIoTData is SepoliaConfig {

    // ============ State Variables ============

    address public owner;
    address public gateway;
    address public pauser;

    uint256 public deviceCount;
    uint256 public dataRecordCount;
    uint256 public requestCount;

    // Timeout protection (24 hours default)
    uint256 public constant CALLBACK_TIMEOUT = 24 hours;

    // Refund pool for failed operations
    uint256 public refundPool;

    bool public paused;

    // ============ Structures ============

    struct IoTDevice {
        string deviceId;
        address deviceOwner;
        bool isActive;
        uint256 registrationTime;
        euint32 lastDataValue;
        uint256 lastUpdateTime;
        uint256 dataSubmissionCount;
    }

    struct DataRecord {
        uint256 deviceIndex;
        euint32 encryptedValue;
        uint8 dataType;
        uint256 timestamp;
        address submitter;
        bool validated;
    }

    struct DataThreshold {
        euint32 minValue;
        euint32 maxValue;
        bool isSet;
    }

    struct GatewayRequest {
        uint256 requestId;
        address requester;
        uint256 deviceIndex;
        uint8 dataType;
        euint32 encryptedValue;
        uint256 timestamp;
        uint256 timeout;
        bool completed;
        bool refunded;
        uint256 depositAmount;
    }

    struct PriceObfuscation {
        euint32 randomMultiplier;
        euint32 obfuscatedPrice;
        uint256 timestamp;
    }

    // ============ Mappings ============

    mapping(uint256 => IoTDevice) public devices;
    mapping(string => uint256) public deviceIdToIndex;
    mapping(uint256 => DataRecord) public dataRecords;
    mapping(uint256 => mapping(uint8 => DataThreshold)) public deviceThresholds;
    mapping(address => bool) public authorizedOperators;
    mapping(uint256 => GatewayRequest) public gatewayRequests;
    mapping(uint256 => PriceObfuscation) public priceObfuscations;
    mapping(address => uint256) public userRefunds;

    // ============ Events ============

    event DeviceRegistered(uint256 indexed deviceIndex, string deviceId, address indexed owner);
    event DataSubmitted(uint256 indexed deviceIndex, uint256 indexed recordId, uint8 dataType);
    event ThresholdSet(uint256 indexed deviceIndex, uint8 dataType);
    event AlertTriggered(uint256 indexed deviceIndex, uint8 dataType, uint256 timestamp);
    event OperatorAdded(address indexed operator);
    event OperatorRemoved(address indexed operator);

    // Gateway callback events
    event GatewayRequestCreated(uint256 indexed requestId, address indexed requester, uint256 deviceIndex);
    event GatewayCallbackCompleted(uint256 indexed requestId, bool success);
    event RequestRefunded(uint256 indexed requestId, address indexed user, uint256 amount);
    event TimeoutRefundClaimed(uint256 indexed requestId, address indexed user, uint256 amount);

    // Security events
    event PauserSet(address indexed oldPauser, address indexed newPauser);
    event GatewayUpdated(address indexed oldGateway, address indexed newGateway);
    event ContractPaused(address indexed by);
    event ContractUnpaused(address indexed by);
    event RefundPoolDeposited(uint256 amount);
    event PriceObfuscated(uint256 indexed requestId, uint256 timestamp);

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: owner only");
        _;
    }

    modifier onlyGateway() {
        require(msg.sender == gateway, "Not authorized: gateway only");
        _;
    }

    modifier onlyPauser() {
        require(msg.sender == pauser || msg.sender == owner, "Not authorized: pauser only");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract is not paused");
        _;
    }

    modifier onlyDeviceOwner(uint256 deviceIndex) {
        require(devices[deviceIndex].deviceOwner == msg.sender, "Not device owner");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == owner || authorizedOperators[msg.sender], "Not authorized");
        _;
    }

    modifier deviceExists(uint256 deviceIndex) {
        require(deviceIndex < deviceCount, "Device does not exist");
        _;
    }

    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address: zero address");
        _;
    }

    // ============ Constructor ============

    constructor() {
        owner = msg.sender;
        gateway = msg.sender; // Default to owner, should be updated
        pauser = msg.sender;
        deviceCount = 0;
        dataRecordCount = 0;
        requestCount = 0;
        paused = false;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the gateway address for callback operations
     * @param _gateway New gateway address
     */
    function setGateway(address _gateway) external onlyOwner validAddress(_gateway) {
        address oldGateway = gateway;
        gateway = _gateway;
        emit GatewayUpdated(oldGateway, _gateway);
    }

    /**
     * @notice Set the pauser address
     * @param _pauser New pauser address
     */
    function setPauser(address _pauser) external onlyOwner validAddress(_pauser) {
        address oldPauser = pauser;
        pauser = _pauser;
        emit PauserSet(oldPauser, _pauser);
    }

    /**
     * @notice Pause the contract
     */
    function pause() external onlyPauser whenNotPaused {
        paused = true;
        emit ContractPaused(msg.sender);
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyPauser whenPaused {
        paused = false;
        emit ContractUnpaused(msg.sender);
    }

    /**
     * @notice Add funds to refund pool
     */
    function depositRefundPool() external payable onlyOwner {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        refundPool += msg.value;
        emit RefundPoolDeposited(msg.value);
    }

    function addOperator(address operator) external onlyOwner validAddress(operator) {
        authorizedOperators[operator] = true;
        emit OperatorAdded(operator);
    }

    function removeOperator(address operator) external onlyOwner {
        authorizedOperators[operator] = false;
        emit OperatorRemoved(operator);
    }

    // ============ Device Management ============

    /**
     * @notice Register a new IoT device
     * @param deviceId Unique device identifier
     * @return deviceIndex Index of the registered device
     */
    function registerDevice(string memory deviceId)
        external
        whenNotPaused
        returns (uint256)
    {
        // Input validation
        require(bytes(deviceId).length > 0, "Device ID cannot be empty");
        require(bytes(deviceId).length <= 64, "Device ID too long");
        require(
            deviceIdToIndex[deviceId] == 0 ||
            !devices[deviceIdToIndex[deviceId]].isActive,
            "Device already registered"
        );

        uint256 deviceIndex = deviceCount;

        devices[deviceIndex] = IoTDevice({
            deviceId: deviceId,
            deviceOwner: msg.sender,
            isActive: true,
            registrationTime: block.timestamp,
            lastDataValue: FHE.asEuint32(0),
            lastUpdateTime: 0,
            dataSubmissionCount: 0
        });

        deviceIdToIndex[deviceId] = deviceIndex;
        deviceCount++;

        emit DeviceRegistered(deviceIndex, deviceId, msg.sender);
        return deviceIndex;
    }

    /**
     * @notice Deactivate a device
     * @param deviceIndex Index of the device to deactivate
     */
    function deactivateDevice(uint256 deviceIndex)
        external
        deviceExists(deviceIndex)
        onlyDeviceOwner(deviceIndex)
        whenNotPaused
    {
        devices[deviceIndex].isActive = false;
    }

    // ============ Gateway Callback Pattern ============

    /**
     * @notice Submit data with Gateway callback pattern
     * @param deviceIndex Index of the device
     * @param value Encrypted sensor value
     * @param dataType Type of data (0-5)
     * @return requestId ID of the gateway request
     */
    function submitDataWithCallback(
        uint256 deviceIndex,
        uint32 value,
        uint8 dataType
    )
        external
        payable
        deviceExists(deviceIndex)
        whenNotPaused
        returns (uint256)
    {
        // Input validation
        require(devices[deviceIndex].isActive, "Device is not active");
        require(dataType <= 5, "Invalid data type");
        require(
            msg.sender == devices[deviceIndex].deviceOwner ||
            authorizedOperators[msg.sender],
            "Not authorized to submit data"
        );
        require(msg.value >= 0.001 ether, "Insufficient deposit for callback");

        euint32 encryptedValue = FHE.asEuint32(value);

        uint256 requestId = requestCount;
        requestCount++;

        // Create gateway request
        gatewayRequests[requestId] = GatewayRequest({
            requestId: requestId,
            requester: msg.sender,
            deviceIndex: deviceIndex,
            dataType: dataType,
            encryptedValue: encryptedValue,
            timestamp: block.timestamp,
            timeout: block.timestamp + CALLBACK_TIMEOUT,
            completed: false,
            refunded: false,
            depositAmount: msg.value
        });

        // Price obfuscation using random multiplier
        _obfuscatePrice(requestId, encryptedValue);

        emit GatewayRequestCreated(requestId, msg.sender, deviceIndex);

        // Request decryption from Gateway
        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(encryptedValue);
        FHE.requestDecryption(cts, this.gatewayCallback.selector);

        return requestId;
    }

    /**
     * @notice Gateway callback to complete data submission
     * @param requestId ID of the request
     * @param decryptedValue Decrypted value from gateway
     * @param signatures Cryptographic signatures
     */
    function gatewayCallback(
        uint256 requestId,
        uint32 decryptedValue,
        bytes[] memory signatures
    )
        external
        onlyGateway
    {
        GatewayRequest storage request = gatewayRequests[requestId];

        require(!request.completed, "Request already completed");
        require(!request.refunded, "Request already refunded");
        require(block.timestamp <= request.timeout, "Request timeout exceeded");
        require(signatures.length > 0, "No signatures provided");

        // Validate decrypted value (basic range check)
        require(decryptedValue > 0 && decryptedValue < type(uint32).max, "Invalid decrypted value");

        // Create data record
        uint256 recordId = dataRecordCount;
        dataRecords[recordId] = DataRecord({
            deviceIndex: request.deviceIndex,
            encryptedValue: request.encryptedValue,
            dataType: request.dataType,
            timestamp: block.timestamp,
            submitter: request.requester,
            validated: true
        });

        devices[request.deviceIndex].lastDataValue = request.encryptedValue;
        devices[request.deviceIndex].lastUpdateTime = block.timestamp;
        devices[request.deviceIndex].dataSubmissionCount++;

        FHE.allowThis(request.encryptedValue);
        FHE.allow(request.encryptedValue, devices[request.deviceIndex].deviceOwner);

        dataRecordCount++;
        request.completed = true;

        // Return deposit to user
        (bool success, ) = request.requester.call{value: request.depositAmount}("");
        require(success, "Deposit return failed");

        emit DataSubmitted(request.deviceIndex, recordId, request.dataType);
        emit GatewayCallbackCompleted(requestId, true);

        // Check threshold
        _checkThreshold(request.deviceIndex, request.dataType, request.encryptedValue);
    }

    /**
     * @notice Claim refund for timed-out request
     * @param requestId ID of the timed-out request
     */
    function claimTimeoutRefund(uint256 requestId) external {
        GatewayRequest storage request = gatewayRequests[requestId];

        require(request.requester == msg.sender, "Not request owner");
        require(!request.completed, "Request already completed");
        require(!request.refunded, "Already refunded");
        require(block.timestamp > request.timeout, "Timeout not reached");

        request.refunded = true;
        uint256 refundAmount = request.depositAmount;

        // Transfer refund
        (bool success, ) = msg.sender.call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit TimeoutRefundClaimed(requestId, msg.sender, refundAmount);
    }

    /**
     * @notice Admin refund for failed decryption
     * @param requestId ID of the failed request
     */
    function adminRefund(uint256 requestId) external onlyOwner {
        GatewayRequest storage request = gatewayRequests[requestId];

        require(!request.completed, "Request already completed");
        require(!request.refunded, "Already refunded");

        request.refunded = true;
        uint256 refundAmount = request.depositAmount;

        // Transfer from refund pool if needed
        if (address(this).balance < refundAmount) {
            require(refundPool >= refundAmount, "Insufficient refund pool");
            refundPool -= refundAmount;
        }

        (bool success, ) = request.requester.call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit RequestRefunded(requestId, request.requester, refundAmount);
    }

    // ============ Privacy Protection ============

    /**
     * @notice Obfuscate price using random multiplier
     * @param requestId Request identifier
     * @param value Encrypted value
     */
    function _obfuscatePrice(uint256 requestId, euint32 value) private {
        // Generate random multiplier (simulated - in production use VRF)
        uint32 randomSeed = uint32(uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            requestId,
            msg.sender
        ))));

        euint32 randomMultiplier = FHE.asEuint32(randomSeed % 1000 + 1);
        euint32 obfuscatedPrice = FHE.mul(value, randomMultiplier);

        priceObfuscations[requestId] = PriceObfuscation({
            randomMultiplier: randomMultiplier,
            obfuscatedPrice: obfuscatedPrice,
            timestamp: block.timestamp
        });

        emit PriceObfuscated(requestId, block.timestamp);
    }

    /**
     * @notice Set threshold with overflow protection
     * @param deviceIndex Device index
     * @param dataType Data type
     * @param minValue Minimum threshold value
     * @param maxValue Maximum threshold value
     */
    function setThreshold(
        uint256 deviceIndex,
        uint8 dataType,
        uint32 minValue,
        uint32 maxValue
    )
        external
        deviceExists(deviceIndex)
        onlyDeviceOwner(deviceIndex)
        whenNotPaused
    {
        // Input validation with overflow protection
        require(dataType <= 5, "Invalid data type");
        require(minValue < maxValue, "Invalid threshold range");
        require(minValue < type(uint32).max, "Min value overflow");
        require(maxValue < type(uint32).max, "Max value overflow");

        euint32 encryptedMin = FHE.asEuint32(minValue);
        euint32 encryptedMax = FHE.asEuint32(maxValue);

        deviceThresholds[deviceIndex][dataType] = DataThreshold({
            minValue: encryptedMin,
            maxValue: encryptedMax,
            isSet: true
        });

        FHE.allowThis(encryptedMin);
        FHE.allowThis(encryptedMax);
        FHE.allow(encryptedMin, msg.sender);
        FHE.allow(encryptedMax, msg.sender);

        emit ThresholdSet(deviceIndex, dataType);
    }

    function _checkThreshold(uint256 deviceIndex, uint8 dataType, euint32 value) private {
        DataThreshold storage threshold = deviceThresholds[deviceIndex][dataType];
        if (!threshold.isSet) return;

        ebool belowMin = FHE.lt(value, threshold.minValue);
        ebool aboveMax = FHE.gt(value, threshold.maxValue);
        ebool alertNeeded = FHE.or(belowMin, aboveMax);

        bytes32[] memory cts = new bytes32[](1);
        cts[0] = FHE.toBytes32(alertNeeded);

        FHE.requestDecryption(cts, this.processThresholdAlert.selector);
    }

    function processThresholdAlert(
        uint256 requestId,
        bool shouldAlert,
        bytes[] memory signatures
    ) external onlyGateway {
        require(signatures.length > 0, "No signatures provided");

        if (shouldAlert) {
            emit AlertTriggered(0, 0, block.timestamp);
        }
    }

    // ============ View Functions ============

    function getDeviceInfo(uint256 deviceIndex)
        external
        view
        deviceExists(deviceIndex)
        returns (
            string memory deviceId,
            address deviceOwner,
            bool isActive,
            uint256 registrationTime,
            uint256 lastUpdateTime,
            uint256 dataSubmissionCount
        )
    {
        IoTDevice storage device = devices[deviceIndex];
        return (
            device.deviceId,
            device.deviceOwner,
            device.isActive,
            device.registrationTime,
            device.lastUpdateTime,
            device.dataSubmissionCount
        );
    }

    function getDataRecord(uint256 recordId)
        external
        view
        returns (
            uint256 deviceIndex,
            uint8 dataType,
            uint256 timestamp,
            address submitter,
            bool validated
        )
    {
        require(recordId < dataRecordCount, "Record does not exist");
        DataRecord storage record = dataRecords[recordId];
        return (
            record.deviceIndex,
            record.dataType,
            record.timestamp,
            record.submitter,
            record.validated
        );
    }

    function getGatewayRequest(uint256 requestId)
        external
        view
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
    {
        GatewayRequest storage request = gatewayRequests[requestId];
        return (
            request.requester,
            request.deviceIndex,
            request.dataType,
            request.timestamp,
            request.timeout,
            request.completed,
            request.refunded,
            request.depositAmount
        );
    }

    function getDeviceDataCount(uint256 deviceIndex)
        external
        view
        deviceExists(deviceIndex)
        returns (uint256 count)
    {
        return devices[deviceIndex].dataSubmissionCount;
    }

    function isThresholdSet(uint256 deviceIndex, uint8 dataType)
        external
        view
        deviceExists(deviceIndex)
        returns (bool)
    {
        return deviceThresholds[deviceIndex][dataType].isSet;
    }

    function getTotalDevices() external view returns (uint256) {
        return deviceCount;
    }

    function getTotalDataRecords() external view returns (uint256) {
        return dataRecordCount;
    }

    function getTotalRequests() external view returns (uint256) {
        return requestCount;
    }

    function getDeviceByString(string memory deviceId)
        external
        view
        returns (uint256 deviceIndex, bool exists)
    {
        deviceIndex = deviceIdToIndex[deviceId];
        exists = devices[deviceIndex].isActive &&
                 keccak256(bytes(devices[deviceIndex].deviceId)) == keccak256(bytes(deviceId));
        return (deviceIndex, exists);
    }

    function getRefundPoolBalance() external view returns (uint256) {
        return refundPool;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ============ Fallback Functions ============

    receive() external payable {
        refundPool += msg.value;
        emit RefundPoolDeposited(msg.value);
    }

    fallback() external payable {
        revert("Invalid function call");
    }
}
