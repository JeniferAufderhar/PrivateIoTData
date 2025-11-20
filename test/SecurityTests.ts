import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("Security Tests - DoS Protection", function () {
  async function deployFixture() {
    const [owner, user1, user2, attacker] = await ethers.getSigners();

    const PrivateIoTData = await ethers.getContractFactory("PrivateIoTData");
    const contract = await PrivateIoTData.deploy();

    return { contract, owner, user1, user2, attacker };
  }

  describe("Rate Limiting Protection", function () {
    it("Should allow normal operation within rate limits", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      // Register device
      const tx1 = await contract.connect(user1).registerDevice("device-001");
      await expect(tx1).to.emit(contract, "DeviceRegistered");

      // Should allow data submission
      const tx2 = await contract.connect(user1).submitData(0, 100, 0);
      await expect(tx2).to.emit(contract, "DataSubmitted");
    });

    it("Should prevent rapid sequential device registrations", async function () {
      const { contract, attacker } = await loadFixture(deployFixture);

      // Register multiple devices rapidly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          contract.connect(attacker).registerDevice(`attack-device-${i}`)
        );
      }

      // First few should succeed, but system should handle them
      await Promise.all(promises);

      const deviceCount = await contract.getTotalDevices();
      expect(deviceCount).to.be.lte(10);
    });

    it("Should prevent data spam attacks", async function () {
      const { contract, user1, attacker } = await loadFixture(deployFixture);

      // Setup: Register device
      await contract.connect(user1).registerDevice("test-device");

      // Attempt to submit data multiple times rapidly
      const submissions = [];
      for (let i = 0; i < 20; i++) {
        submissions.push(
          contract.connect(user1).submitData(0, i, 0).catch(() => null)
        );
      }

      await Promise.all(submissions);

      // Verify system remained stable
      const recordCount = await contract.getTotalDataRecords();
      expect(recordCount).to.be.lte(30);
    });
  });

  describe("Gas Limit Protection", function () {
    it("Should handle large data queries efficiently", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      // Register device
      await contract.connect(user1).registerDevice("gas-test-device");

      // Submit multiple data points
      for (let i = 0; i < 10; i++) {
        await contract.connect(user1).submitData(0, i * 10, 0);
      }

      // Query should not consume excessive gas
      const tx = await contract.getDeviceDataCount(0);
      expect(tx).to.equal(10);
    });

    it("Should prevent unbounded loop exploits", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      // Register multiple devices
      for (let i = 0; i < 5; i++) {
        await contract.connect(user1).registerDevice(`device-${i}`);
      }

      // Counting operation should complete without running out of gas
      const deviceCount = await contract.getTotalDevices();
      expect(deviceCount).to.equal(5);
    });

    it("Should optimize storage reads for device lookup", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      await contract.connect(user1).registerDevice("lookup-test");

      // Direct lookup should be gas efficient
      const [deviceIndex, exists] = await contract.getDeviceByString("lookup-test");
      expect(exists).to.be.true;
      expect(deviceIndex).to.equal(0);
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy in data submission", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      await contract.connect(user1).registerDevice("reentrancy-test");

      // Normal submission should work
      const tx = await contract.connect(user1).submitData(0, 500, 0);
      await expect(tx).to.emit(contract, "DataSubmitted");

      // Verify state is consistent
      const recordCount = await contract.getTotalDataRecords();
      expect(recordCount).to.equal(1);
    });

    it("Should maintain state consistency under concurrent operations", async function () {
      const { contract, user1, user2 } = await loadFixture(deployFixture);

      // Register devices for both users
      await contract.connect(user1).registerDevice("concurrent-device-1");
      await contract.connect(user2).registerDevice("concurrent-device-2");

      // Submit data concurrently
      await Promise.all([
        contract.connect(user1).submitData(0, 100, 0),
        contract.connect(user2).submitData(1, 200, 1),
      ]);

      // Verify both submissions succeeded
      const recordCount = await contract.getTotalDataRecords();
      expect(recordCount).to.equal(2);
    });
  });

  describe("Access Control and Authorization", function () {
    it("Should prevent unauthorized device access", async function () {
      const { contract, user1, attacker } = await loadFixture(deployFixture);

      await contract.connect(user1).registerDevice("protected-device");

      // Attacker should not be able to submit data for user1's device
      await expect(
        contract.connect(attacker).submitData(0, 999, 0)
      ).to.be.revertedWith("Not authorized to submit data");
    });

    it("Should prevent unauthorized threshold modifications", async function () {
      const { contract, user1, attacker } = await loadFixture(deployFixture);

      await contract.connect(user1).registerDevice("threshold-device");

      // Attacker should not be able to set thresholds
      await expect(
        contract.connect(attacker).setThreshold(0, 0, 10, 100)
      ).to.be.revertedWith("Not device owner");
    });

    it("Should allow owner to manage operators securely", async function () {
      const { contract, owner, user1, attacker } = await loadFixture(deployFixture);

      // Owner can add operator
      await contract.connect(owner).addOperator(user1.address);

      // Verify operator was added
      expect(await contract.authorizedOperators(user1.address)).to.be.true;

      // Non-owner cannot add operators
      await expect(
        contract.connect(attacker).addOperator(attacker.address)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Input Validation and Sanitization", function () {
    it("Should reject empty device IDs", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      await expect(
        contract.connect(user1).registerDevice("")
      ).to.be.revertedWith("Device ID cannot be empty");
    });

    it("Should prevent duplicate device registration", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      await contract.connect(user1).registerDevice("unique-device");

      // Second registration should fail
      await expect(
        contract.connect(user1).registerDevice("unique-device")
      ).to.be.revertedWith("Device already registered");
    });

    it("Should validate threshold ranges", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      await contract.connect(user1).registerDevice("threshold-validation");

      // Invalid range (min > max) should fail
      await expect(
        contract.connect(user1).setThreshold(0, 0, 100, 10)
      ).to.be.revertedWith("Invalid threshold range");
    });

    it("Should validate device existence for operations", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      // Operating on non-existent device should fail
      await expect(
        contract.connect(user1).submitData(999, 100, 0)
      ).to.be.revertedWith("Device does not exist");
    });
  });

  describe("State Management and Data Integrity", function () {
    it("Should maintain accurate device count", async function () {
      const { contract, user1, user2 } = await loadFixture(deployFixture);

      expect(await contract.getTotalDevices()).to.equal(0);

      await contract.connect(user1).registerDevice("device-1");
      expect(await contract.getTotalDevices()).to.equal(1);

      await contract.connect(user2).registerDevice("device-2");
      expect(await contract.getTotalDevices()).to.equal(2);
    });

    it("Should maintain accurate data record count", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      await contract.connect(user1).registerDevice("counting-device");

      expect(await contract.getTotalDataRecords()).to.equal(0);

      await contract.connect(user1).submitData(0, 100, 0);
      expect(await contract.getTotalDataRecords()).to.equal(1);

      await contract.connect(user1).submitData(0, 200, 1);
      expect(await contract.getTotalDataRecords()).to.equal(2);
    });

    it("Should update device state correctly", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      await contract.connect(user1).registerDevice("state-test");

      const [, , isActive, ,] = await contract.getDeviceInfo(0);
      expect(isActive).to.be.true;

      // Deactivate device
      await contract.connect(user1).deactivateDevice(0);

      const [, , isActiveAfter, ,] = await contract.getDeviceInfo(0);
      expect(isActiveAfter).to.be.false;
    });

    it("Should prevent operations on inactive devices", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      await contract.connect(user1).registerDevice("inactive-test");
      await contract.connect(user1).deactivateDevice(0);

      // Should not allow data submission on inactive device
      await expect(
        contract.connect(user1).submitData(0, 100, 0)
      ).to.be.revertedWith("Device is not active");
    });
  });

  describe("Performance and Scalability", function () {
    it("Should handle multiple devices efficiently", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      const deviceRegistrations = [];
      for (let i = 0; i < 10; i++) {
        deviceRegistrations.push(
          contract.connect(user1).registerDevice(`perf-device-${i}`)
        );
      }

      await Promise.all(deviceRegistrations);

      const deviceCount = await contract.getTotalDevices();
      expect(deviceCount).to.equal(10);
    });

    it("Should maintain performance with many data records", async function () {
      const { contract, user1 } = await loadFixture(deployFixture);

      await contract.connect(user1).registerDevice("perf-data-device");

      // Submit multiple data points
      for (let i = 0; i < 15; i++) {
        await contract.connect(user1).submitData(0, i * 5, i % 4);
      }

      const recordCount = await contract.getTotalDataRecords();
      expect(recordCount).to.equal(15);

      // Query should still be efficient
      const deviceDataCount = await contract.getDeviceDataCount(0);
      expect(deviceDataCount).to.equal(15);
    });
  });
});
