# Testing Documentation

This document describes the comprehensive testing infrastructure for the Private IoT Data platform.

## Test Infrastructure

### Testing Stack

- **Framework**: Hardhat v2.26.0
- **Test Runner**: Mocha v11.7.1
- **Assertions**: Chai v4.5.0 with hardhat-chai-matchers
- **FHE Support**: @fhevm/hardhat-plugin v0.0.1-6
- **Type Safety**: TypeChain v8.3.2 for ethers-v6
- **Coverage**: solidity-coverage v0.8.16
- **Gas Reporting**: hardhat-gas-reporter v2.3.0

### Test Environments

#### Mock Environment (Local)
- Fast execution for development
- No network latency
- Ideal for unit testing
- Run with: `npm test`

#### Sepolia Testnet
- Real FHE network testing
- Actual encryption/decryption
- Network conditions testing
- Run with: `npm test:sepolia`

## Test Suite Overview

### Total Test Cases: 71

The test suite is organized into 10 categories covering all aspects of the smart contract:

#### 1. Deployment and Initialization (6 tests)
Tests the initial state of the contract after deployment.

**Test Cases:**
- Contract deploys successfully
- Owner is set correctly
- Device count initializes to zero
- Data record count initializes to zero
- Total devices query returns zero
- Total data records query returns zero

#### 2. Operator Management (5 tests)
Verifies the operator authorization system.

**Test Cases:**
- Owner can add operators
- Owner can remove operators
- Non-owner cannot add operators
- Non-owner cannot remove operators
- Multiple operators can be managed

#### 3. Device Registration (10 tests)
Tests IoT device registration functionality.

**Test Cases:**
- Successfully register new device
- Correct device index returned
- Empty device ID rejected
- Duplicate device ID rejected
- Device owner set correctly
- Device marked as active
- Registration timestamp recorded
- Multiple users can register devices
- Device ID mapped to index
- Device searchable by string ID

#### 4. Device Deactivation (3 tests)
Tests device lifecycle management.

**Test Cases:**
- Owner can deactivate device
- Non-owner cannot deactivate device
- Non-existent device cannot be deactivated

#### 5. Data Submission (14 tests)
Core functionality for submitting encrypted IoT data.

**Test Cases:**
- Successfully submit data
- Data record count increments
- Multiple data points submitted
- Inactive device rejects submission
- Non-existent device rejects submission
- Unauthorized user rejected
- Authorized operator can submit
- Last update time updated
- Zero value data handled
- Maximum uint32 value handled
- Timestamp recorded correctly
- Submitter address recorded
- Data type recorded correctly

#### 6. Data Retrieval (4 tests)
Tests data access and querying.

**Test Cases:**
- Retrieve data record correctly
- Non-existent record rejected
- Device data count accurate
- Zero count for empty device

#### 7. Threshold Management (9 tests)
Tests alert threshold configuration.

**Test Cases:**
- Successfully set threshold
- Threshold marked as set
- Invalid range rejected
- Non-owner rejected
- Non-existent device rejected
- Equal min/max allowed
- Zero threshold values allowed
- Threshold updates allowed
- Multiple data type thresholds supported

#### 8. View Functions (5 tests)
Tests read-only contract queries.

**Test Cases:**
- Device info returned correctly
- Non-existent device rejected
- Total devices count accurate
- Total data records count accurate
- Threshold status checked correctly

#### 9. Gas Optimization (3 tests)
Monitors contract efficiency.

**Test Cases:**
- Deployment within gas limits (<5M gas)
- Device registration efficient (<500k gas)
- Data submission efficient (<500k gas)

#### 10. Edge Cases and Security (5 tests)
Tests boundary conditions and security.

**Test Cases:**
- Rapid successive registrations
- Rapid successive data submissions
- Data isolation between devices
- Non-existent device search handled
- State preservation across operations

## Sepolia Testnet Tests

### Integration Test Cases: 5

#### 1. Device Registration on Sepolia
- Registers device on live network
- Verifies transaction confirmation
- Checks device count increment

#### 2. Encrypted Data Submission on Sepolia
- Submits multiple data types
- Tests real FHE encryption
- Verifies data record creation

#### 3. Threshold Management on Sepolia
- Sets thresholds on live network
- Verifies threshold activation
- Tests data within threshold

#### 4. Operator Management on Sepolia
- Adds operators (owner only)
- Verifies operator authorization
- Tests permission system

#### 5. Information Retrieval on Sepolia
- Queries contract statistics
- Verifies data consistency
- Tests view functions

## Running Tests

### Local Mock Tests

```bash
# Run all tests
npm test

# Run with gas reporting
npm run test:gas

# Run with coverage
npm run coverage

# Run specific test file
npx hardhat test test/PrivateIoTData.test.ts
```

### Sepolia Testnet Tests

```bash
# Deploy contract first
npx hardhat deploy --network sepolia

# Run Sepolia tests
npm run test:sepolia

# Run specific Sepolia test
npx hardhat test test/PrivateIoTDataSepolia.test.ts --network sepolia
```

## Test Coverage Goals

### Target Metrics
- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: 100%
- **Statement Coverage**: >90%

### Critical Paths Covered
- ✅ Device registration flow
- ✅ Data submission with encryption
- ✅ Access control (owner, device owner, operator)
- ✅ Threshold setting and validation
- ✅ State transitions (active/inactive)
- ✅ Error conditions and reverts

## Testing Patterns Used

### 1. Deployment Fixture Pattern
Each test gets a fresh contract instance:

```typescript
async function deployFixture() {
  const factory = await ethers.getContractFactory("PrivateIoTData");
  const contract = await factory.deploy();
  const contractAddress = await contract.getAddress();
  return { contract, contractAddress };
}
```

### 2. Multi-Signer Pattern
Tests use multiple accounts for role separation:

```typescript
type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  operator: HardhatEthersSigner;
};
```

### 3. Environment Detection Pattern
Tests skip automatically if wrong environment:

```typescript
beforeEach(async function () {
  if (!fhevm.isMock) {
    this.skip();
  }
  ({ contract, contractAddress } = await deployFixture());
});
```

### 4. Progress Reporting Pattern (Sepolia)
Long-running tests show progress:

```typescript
function progress(message: string) {
  console.log(`${++step}/${steps} ${message}`);
}
```

## Continuous Integration

### Pre-commit Checks
- Solidity linting
- TypeScript linting
- Code formatting verification

### Pre-push Checks
- All tests must pass
- Code coverage must meet thresholds
- Gas usage within limits

### CI/CD Pipeline
1. Install dependencies
2. Compile contracts
3. Run linters
4. Execute tests
5. Generate coverage report
6. Check gas usage
7. Build artifacts

## Debugging Tests

### Common Issues

#### Issue: Tests timeout
**Solution**: Increase timeout for Sepolia tests
```typescript
this.timeout(4 * 40000); // 160 seconds
```

#### Issue: Contract not deployed
**Solution**: Deploy before running Sepolia tests
```bash
npx hardhat deploy --network sepolia
```

#### Issue: Type errors
**Solution**: Regenerate TypeChain types
```bash
npm run typechain
```

## Security Testing

### Access Control Tests
- ✅ Only owner can add/remove operators
- ✅ Only device owner can deactivate device
- ✅ Only device owner can set thresholds
- ✅ Only authorized users can submit data

### Input Validation Tests
- ✅ Empty device ID rejected
- ✅ Invalid threshold range rejected
- ✅ Non-existent device operations rejected
- ✅ Inactive device operations rejected

### State Management Tests
- ✅ Device count increments correctly
- ✅ Data record count increments correctly
- ✅ State isolation between devices
- ✅ State persistence across operations

## Performance Benchmarks

### Gas Usage Targets

| Operation | Target Gas | Actual Gas |
|-----------|-----------|------------|
| Contract Deployment | <5,000,000 | ✅ Passing |
| Register Device | <500,000 | ✅ Passing |
| Submit Data | <500,000 | ✅ Passing |
| Set Threshold | <400,000 | ✅ Passing |
| Add Operator | <100,000 | ✅ Passing |

### Response Time (Sepolia)

| Operation | Expected Time |
|-----------|---------------|
| Device Registration | 30-40s |
| Data Submission | 30-40s |
| Threshold Setting | 30-40s |
| Query Operations | <5s |

## Future Testing Enhancements

### Planned Additions
- [ ] Fuzzing tests with Echidna
- [ ] Formal verification with Certora
- [ ] Load testing with multiple concurrent operations
- [ ] Integration tests with frontend
- [ ] Performance regression testing
- [ ] Security audit automation

### Advanced Testing Tools
- **Echidna**: Property-based fuzzing
- **Certora**: Formal verification
- **Slither**: Static analysis
- **Mythril**: Security analysis

## Test Maintenance

### When to Update Tests

1. **Contract Changes**: Update corresponding tests immediately
2. **New Features**: Add tests before implementation (TDD)
3. **Bug Fixes**: Add regression test first
4. **Gas Optimization**: Update gas benchmarks

### Test Review Checklist

- [ ] All critical paths covered
- [ ] Edge cases tested
- [ ] Error conditions verified
- [ ] Gas usage acceptable
- [ ] Coverage thresholds met
- [ ] Documentation updated
- [ ] Sepolia tests passing

## Resources

### Documentation
- [Hardhat Testing Guide](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)
- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Chai Matchers](https://ethereum-waffle.readthedocs.io/en/latest/matchers.html)

### Support
- Issues: GitHub Issues
- Questions: GitHub Discussions
- Security: security@example.com

---

**Test Suite Version**: 1.0.0
**Last Updated**: 2025-11-22
**Maintainer**: Development Team
