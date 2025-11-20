import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { PrivateIoTData } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

describe("PrivateIoTDataSepolia", function () {
  let signers: Signers;
  let contract: PrivateIoTData;
  let contractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const deployment = await deployments.get("PrivateIoTData");
      contractAddress = deployment.address;
      contract = await ethers.getContractAt("PrivateIoTData", deployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      alice: ethSigners[0],
      bob: ethSigners[1]
    };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("should register device on Sepolia", async function () {
    steps = 4;
    this.timeout(4 * 40000); // 160 seconds

    progress(`Testing contract at ${contractAddress}...`);

    progress("Registering IoT device...");
    const deviceId = `sepolia-device-${Date.now()}`;
    const tx = await contract.connect(signers.alice).registerDevice(deviceId);
    await tx.wait();

    progress("Verifying device registration...");
    const totalDevices = await contract.getTotalDevices();
    expect(totalDevices).to.be.gt(0);

    progress(`Successfully registered device: ${deviceId}`);
  });

  it("should submit encrypted data on Sepolia", async function () {
    steps = 6;
    this.timeout(6 * 40000); // 240 seconds

    progress("Registering test device...");
    const deviceId = `data-device-${Date.now()}`;
    let tx = await contract.connect(signers.alice).registerDevice(deviceId);
    await tx.wait();

    const deviceResult = await contract.getDeviceByString(deviceId);
    const deviceIndex = deviceResult.deviceIndex;

    progress("Submitting temperature data (25°C)...");
    tx = await contract.connect(signers.alice).submitData(deviceIndex, 2500, 0);
    await tx.wait();

    progress("Submitting humidity data (65%)...");
    tx = await contract.connect(signers.alice).submitData(deviceIndex, 6500, 1);
    await tx.wait();

    progress("Submitting pressure data (1013 hPa)...");
    tx = await contract.connect(signers.alice).submitData(deviceIndex, 1013, 2);
    await tx.wait();

    progress("Verifying data submission...");
    const dataCount = await contract.getDeviceDataCount(deviceIndex);
    expect(dataCount).to.equal(3);

    progress(`Successfully submitted 3 data records for device ${deviceId}`);
  });

  it("should set and verify threshold on Sepolia", async function () {
    steps = 5;
    this.timeout(5 * 40000); // 200 seconds

    progress("Registering device for threshold test...");
    const deviceId = `threshold-device-${Date.now()}`;
    let tx = await contract.connect(signers.alice).registerDevice(deviceId);
    await tx.wait();

    const deviceResult = await contract.getDeviceByString(deviceId);
    const deviceIndex = deviceResult.deviceIndex;

    progress("Setting temperature threshold (20-30°C)...");
    tx = await contract.connect(signers.alice).setThreshold(deviceIndex, 0, 2000, 3000);
    await tx.wait();

    progress("Verifying threshold is set...");
    const isSet = await contract.isThresholdSet(deviceIndex, 0);
    expect(isSet).to.be.true;

    progress("Submitting data within threshold...");
    tx = await contract.connect(signers.alice).submitData(deviceIndex, 2500, 0);
    await tx.wait();

    progress("Threshold test completed successfully");
  });

  it("should manage operators on Sepolia", async function () {
    steps = 4;
    this.timeout(4 * 40000);

    progress("Checking if caller is owner...");
    const owner = await contract.owner();
    if (owner.toLowerCase() !== signers.alice.address.toLowerCase()) {
      console.log("Skipping operator test - caller is not owner");
      this.skip();
    }

    progress("Adding operator...");
    const tx = await contract.connect(signers.alice).addOperator(signers.bob.address);
    await tx.wait();

    progress("Verifying operator status...");
    const isOperator = await contract.authorizedOperators(signers.bob.address);
    expect(isOperator).to.be.true;

    progress("Operator management test completed");
  });

  it("should retrieve device information on Sepolia", async function () {
    steps = 4;
    this.timeout(4 * 40000);

    progress("Getting total devices count...");
    const totalDevices = await contract.getTotalDevices();
    expect(totalDevices).to.be.gte(0);

    progress("Getting total data records count...");
    const totalRecords = await contract.getTotalDataRecords();
    expect(totalRecords).to.be.gte(0);

    progress("Checking owner address...");
    const owner = await contract.owner();
    expect(owner).to.be.properAddress;

    progress(`Sepolia contract stats - Devices: ${totalDevices}, Records: ${totalRecords}`);
  });
});
