import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { PrivateIoTData, PrivateIoTData__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  operator: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("PrivateIoTData")) as PrivateIoTData__factory;
  const contract = (await factory.deploy()) as PrivateIoTData;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("PrivateIoTData", function () {
  let signers: Signers;
  let contract: PrivateIoTData;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      operator: ethSigners[3]
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This test suite cannot run on Sepolia`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Deployment and Initialization", function () {
    it("should deploy successfully", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("should set deployer as owner", async function () {
      expect(await contract.owner()).to.equal(signers.deployer.address);
    });

    it("should initialize device count to zero", async function () {
      expect(await contract.deviceCount()).to.equal(0);
    });

    it("should initialize data record count to zero", async function () {
      expect(await contract.dataRecordCount()).to.equal(0);
    });

    it("should return zero for total devices", async function () {
      expect(await contract.getTotalDevices()).to.equal(0);
    });

    it("should return zero for total data records", async function () {
      expect(await contract.getTotalDataRecords()).to.equal(0);
    });
  });

  describe("Operator Management", function () {
    it("should allow owner to add operator", async function () {
      await expect(
        contract.connect(signers.deployer).addOperator(signers.operator.address)
      ).to.emit(contract, "OperatorAdded")
        .withArgs(signers.operator.address);

      expect(await contract.authorizedOperators(signers.operator.address)).to.be.true;
    });

    it("should allow owner to remove operator", async function () {
      await contract.connect(signers.deployer).addOperator(signers.operator.address);

      await expect(
        contract.connect(signers.deployer).removeOperator(signers.operator.address)
      ).to.emit(contract, "OperatorRemoved")
        .withArgs(signers.operator.address);

      expect(await contract.authorizedOperators(signers.operator.address)).to.be.false;
    });

    it("should reject non-owner adding operator", async function () {
      await expect(
        contract.connect(signers.alice).addOperator(signers.operator.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("should reject non-owner removing operator", async function () {
      await expect(
        contract.connect(signers.alice).removeOperator(signers.operator.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("should allow multiple operators to be added", async function () {
      await contract.connect(signers.deployer).addOperator(signers.alice.address);
      await contract.connect(signers.deployer).addOperator(signers.bob.address);

      expect(await contract.authorizedOperators(signers.alice.address)).to.be.true;
      expect(await contract.authorizedOperators(signers.bob.address)).to.be.true;
    });
  });

  describe("Device Registration", function () {
    it("should register a new device successfully", async function () {
      await expect(
        contract.connect(signers.alice).registerDevice("device-001")
      ).to.emit(contract, "DeviceRegistered")
        .withArgs(0, "device-001", signers.alice.address);

      expect(await contract.deviceCount()).to.equal(1);
    });

    it("should return correct device index after registration", async function () {
      const tx = await contract.connect(signers.alice).registerDevice("device-002");
      const receipt = await tx.wait();

      expect(await contract.deviceCount()).to.equal(1);
    });

    it("should reject registration with empty device ID", async function () {
      await expect(
        contract.connect(signers.alice).registerDevice("")
      ).to.be.revertedWith("Device ID cannot be empty");
    });

    it("should reject duplicate device registration", async function () {
      await contract.connect(signers.alice).registerDevice("device-003");

      await expect(
        contract.connect(signers.alice).registerDevice("device-003")
      ).to.be.revertedWith("Device already registered");
    });

    it("should set device owner correctly", async function () {
      await contract.connect(signers.alice).registerDevice("device-004");

      const deviceInfo = await contract.getDeviceInfo(0);
      expect(deviceInfo.deviceOwner).to.equal(signers.alice.address);
    });

    it("should set device as active upon registration", async function () {
      await contract.connect(signers.alice).registerDevice("device-005");

      const deviceInfo = await contract.getDeviceInfo(0);
      expect(deviceInfo.isActive).to.be.true;
    });

    it("should record registration timestamp", async function () {
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const timestamp = block!.timestamp;

      await contract.connect(signers.alice).registerDevice("device-006");

      const deviceInfo = await contract.getDeviceInfo(0);
      expect(deviceInfo.registrationTime).to.be.gte(timestamp);
    });

    it("should allow multiple users to register devices", async function () {
      await contract.connect(signers.alice).registerDevice("device-alice");
      await contract.connect(signers.bob).registerDevice("device-bob");

      expect(await contract.deviceCount()).to.equal(2);
    });

    it("should map device ID to correct index", async function () {
      await contract.connect(signers.alice).registerDevice("device-mapping");

      const index = await contract.deviceIdToIndex("device-mapping");
      expect(index).to.equal(0);
    });

    it("should retrieve device by string ID", async function () {
      await contract.connect(signers.alice).registerDevice("search-device");

      const result = await contract.getDeviceByString("search-device");
      expect(result.exists).to.be.true;
      expect(result.deviceIndex).to.equal(0);
    });
  });

  describe("Device Deactivation", function () {
    beforeEach(async function () {
      await contract.connect(signers.alice).registerDevice("device-deactivate");
    });

    it("should allow device owner to deactivate device", async function () {
      await contract.connect(signers.alice).deactivateDevice(0);

      const deviceInfo = await contract.getDeviceInfo(0);
      expect(deviceInfo.isActive).to.be.false;
    });

    it("should reject deactivation by non-owner", async function () {
      await expect(
        contract.connect(signers.bob).deactivateDevice(0)
      ).to.be.revertedWith("Not device owner");
    });

    it("should reject deactivation of non-existent device", async function () {
      await expect(
        contract.connect(signers.alice).deactivateDevice(99)
      ).to.be.revertedWith("Device does not exist");
    });
  });

  describe("Data Submission", function () {
    beforeEach(async function () {
      await contract.connect(signers.alice).registerDevice("data-device");
    });

    it("should submit data successfully", async function () {
      await expect(
        contract.connect(signers.alice).submitData(0, 2500, 0)
      ).to.emit(contract, "DataSubmitted")
        .withArgs(0, 0, 0);
    });

    it("should increment data record count", async function () {
      await contract.connect(signers.alice).submitData(0, 2500, 0);

      expect(await contract.dataRecordCount()).to.equal(1);
    });

    it("should submit multiple data points", async function () {
      await contract.connect(signers.alice).submitData(0, 2500, 0);
      await contract.connect(signers.alice).submitData(0, 6500, 1);
      await contract.connect(signers.alice).submitData(0, 1013, 2);

      expect(await contract.dataRecordCount()).to.equal(3);
    });

    it("should reject data submission to inactive device", async function () {
      await contract.connect(signers.alice).deactivateDevice(0);

      await expect(
        contract.connect(signers.alice).submitData(0, 2500, 0)
      ).to.be.revertedWith("Device is not active");
    });

    it("should reject data submission to non-existent device", async function () {
      await expect(
        contract.connect(signers.alice).submitData(99, 2500, 0)
      ).to.be.revertedWith("Device does not exist");
    });

    it("should reject data submission from unauthorized user", async function () {
      await expect(
        contract.connect(signers.bob).submitData(0, 2500, 0)
      ).to.be.revertedWith("Not authorized to submit data");
    });

    it("should allow authorized operator to submit data", async function () {
      await contract.connect(signers.deployer).addOperator(signers.operator.address);

      await expect(
        contract.connect(signers.operator).submitData(0, 2500, 0)
      ).to.emit(contract, "DataSubmitted");
    });

    it("should update device last update time", async function () {
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const timestamp = block!.timestamp;

      await contract.connect(signers.alice).submitData(0, 2500, 0);

      const deviceInfo = await contract.getDeviceInfo(0);
      expect(deviceInfo.lastUpdateTime).to.be.gte(timestamp);
    });

    it("should handle zero value data", async function () {
      await expect(
        contract.connect(signers.alice).submitData(0, 0, 0)
      ).to.emit(contract, "DataSubmitted");
    });

    it("should handle maximum uint32 value", async function () {
      const maxValue = 4294967295; // 2^32 - 1

      await expect(
        contract.connect(signers.alice).submitData(0, maxValue, 0)
      ).to.emit(contract, "DataSubmitted");
    });

    it("should record data with correct timestamp", async function () {
      const blockNum = await ethers.provider.getBlockNumber();
      const block = await ethers.provider.getBlock(blockNum);
      const timestamp = block!.timestamp;

      await contract.connect(signers.alice).submitData(0, 2500, 0);

      const record = await contract.getDataRecord(0);
      expect(record.timestamp).to.be.gte(timestamp);
    });

    it("should record correct submitter address", async function () {
      await contract.connect(signers.alice).submitData(0, 2500, 0);

      const record = await contract.getDataRecord(0);
      expect(record.submitter).to.equal(signers.alice.address);
    });

    it("should record correct data type", async function () {
      await contract.connect(signers.alice).submitData(0, 2500, 3);

      const record = await contract.getDataRecord(0);
      expect(record.dataType).to.equal(3);
    });
  });

  describe("Data Retrieval", function () {
    beforeEach(async function () {
      await contract.connect(signers.alice).registerDevice("retrieval-device");
      await contract.connect(signers.alice).submitData(0, 2500, 0);
    });

    it("should retrieve data record correctly", async function () {
      const record = await contract.getDataRecord(0);

      expect(record.deviceIndex).to.equal(0);
      expect(record.dataType).to.equal(0);
      expect(record.submitter).to.equal(signers.alice.address);
    });

    it("should reject retrieval of non-existent record", async function () {
      await expect(
        contract.getDataRecord(99)
      ).to.be.revertedWith("Record does not exist");
    });

    it("should count device data correctly", async function () {
      await contract.connect(signers.alice).submitData(0, 3000, 1);
      await contract.connect(signers.alice).submitData(0, 3500, 2);

      const count = await contract.getDeviceDataCount(0);
      expect(count).to.equal(3);
    });

    it("should return zero count for device with no data", async function () {
      await contract.connect(signers.bob).registerDevice("empty-device");

      const count = await contract.getDeviceDataCount(1);
      expect(count).to.equal(0);
    });
  });

  describe("Threshold Management", function () {
    beforeEach(async function () {
      await contract.connect(signers.alice).registerDevice("threshold-device");
    });

    it("should set threshold successfully", async function () {
      await expect(
        contract.connect(signers.alice).setThreshold(0, 0, 2000, 3000)
      ).to.emit(contract, "ThresholdSet")
        .withArgs(0, 0);
    });

    it("should mark threshold as set", async function () {
      await contract.connect(signers.alice).setThreshold(0, 0, 2000, 3000);

      expect(await contract.isThresholdSet(0, 0)).to.be.true;
    });

    it("should reject invalid threshold range", async function () {
      await expect(
        contract.connect(signers.alice).setThreshold(0, 0, 3000, 2000)
      ).to.be.revertedWith("Invalid threshold range");
    });

    it("should reject threshold setting by non-owner", async function () {
      await expect(
        contract.connect(signers.bob).setThreshold(0, 0, 2000, 3000)
      ).to.be.revertedWith("Not device owner");
    });

    it("should reject threshold for non-existent device", async function () {
      await expect(
        contract.connect(signers.alice).setThreshold(99, 0, 2000, 3000)
      ).to.be.revertedWith("Device does not exist");
    });

    it("should allow equal min and max threshold", async function () {
      await expect(
        contract.connect(signers.alice).setThreshold(0, 0, 2500, 2500)
      ).to.emit(contract, "ThresholdSet");
    });

    it("should allow zero threshold values", async function () {
      await expect(
        contract.connect(signers.alice).setThreshold(0, 0, 0, 1000)
      ).to.emit(contract, "ThresholdSet");
    });

    it("should allow updating existing threshold", async function () {
      await contract.connect(signers.alice).setThreshold(0, 0, 2000, 3000);

      await expect(
        contract.connect(signers.alice).setThreshold(0, 0, 1500, 3500)
      ).to.emit(contract, "ThresholdSet");
    });

    it("should support different thresholds for different data types", async function () {
      await contract.connect(signers.alice).setThreshold(0, 0, 2000, 3000);
      await contract.connect(signers.alice).setThreshold(0, 1, 5000, 8000);

      expect(await contract.isThresholdSet(0, 0)).to.be.true;
      expect(await contract.isThresholdSet(0, 1)).to.be.true;
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await contract.connect(signers.alice).registerDevice("view-device");
    });

    it("should return correct device info", async function () {
      const info = await contract.getDeviceInfo(0);

      expect(info.deviceId).to.equal("view-device");
      expect(info.deviceOwner).to.equal(signers.alice.address);
      expect(info.isActive).to.be.true;
    });

    it("should reject get device info for non-existent device", async function () {
      await expect(
        contract.getDeviceInfo(99)
      ).to.be.revertedWith("Device does not exist");
    });

    it("should return correct total devices count", async function () {
      await contract.connect(signers.bob).registerDevice("another-device");

      expect(await contract.getTotalDevices()).to.equal(2);
    });

    it("should return correct total data records count", async function () {
      await contract.connect(signers.alice).submitData(0, 2500, 0);
      await contract.connect(signers.alice).submitData(0, 3000, 1);

      expect(await contract.getTotalDataRecords()).to.equal(2);
    });

    it("should check threshold status correctly", async function () {
      expect(await contract.isThresholdSet(0, 0)).to.be.false;

      await contract.connect(signers.alice).setThreshold(0, 0, 2000, 3000);

      expect(await contract.isThresholdSet(0, 0)).to.be.true;
    });
  });

  describe("Gas Optimization", function () {
    it("should deploy within reasonable gas limits", async function () {
      const factory = await ethers.getContractFactory("PrivateIoTData");
      const tx = factory.getDeployTransaction();

      const estimatedGas = await ethers.provider.estimateGas(tx);
      expect(estimatedGas).to.be.lt(5000000); // Less than 5M gas
    });

    it("should register device efficiently", async function () {
      const tx = await contract.connect(signers.alice).registerDevice("gas-test");
      const receipt = await tx.wait();

      expect(receipt!.gasUsed).to.be.lt(500000); // Less than 500k gas
    });

    it("should submit data efficiently", async function () {
      await contract.connect(signers.alice).registerDevice("gas-device");

      const tx = await contract.connect(signers.alice).submitData(0, 2500, 0);
      const receipt = await tx.wait();

      expect(receipt!.gasUsed).to.be.lt(500000); // Less than 500k gas
    });
  });

  describe("Edge Cases and Security", function () {
    it("should handle rapid successive registrations", async function () {
      for (let i = 0; i < 5; i++) {
        await contract.connect(signers.alice).registerDevice(`rapid-${i}`);
      }

      expect(await contract.getTotalDevices()).to.equal(5);
    });

    it("should handle rapid successive data submissions", async function () {
      await contract.connect(signers.alice).registerDevice("rapid-data");

      for (let i = 0; i < 5; i++) {
        await contract.connect(signers.alice).submitData(0, 2000 + i * 100, 0);
      }

      expect(await contract.getTotalDataRecords()).to.equal(5);
    });

    it("should maintain data isolation between devices", async function () {
      await contract.connect(signers.alice).registerDevice("device-1");
      await contract.connect(signers.bob).registerDevice("device-2");

      await contract.connect(signers.alice).submitData(0, 1000, 0);
      await contract.connect(signers.bob).submitData(1, 2000, 0);

      const count1 = await contract.getDeviceDataCount(0);
      const count2 = await contract.getDeviceDataCount(1);

      expect(count1).to.equal(1);
      expect(count2).to.equal(1);
    });

    it("should handle device search for non-existent ID", async function () {
      const result = await contract.getDeviceByString("non-existent");
      expect(result.exists).to.be.false;
    });

    it("should preserve state across multiple operations", async function () {
      await contract.connect(signers.alice).registerDevice("state-device");
      await contract.connect(signers.deployer).addOperator(signers.operator.address);
      await contract.connect(signers.alice).submitData(0, 2500, 0);

      expect(await contract.getTotalDevices()).to.equal(1);
      expect(await contract.getTotalDataRecords()).to.equal(1);
      expect(await contract.authorizedOperators(signers.operator.address)).to.be.true;
    });
  });
});
