const { ethers } = require("hardhat");

/**
 * Simulate a complete IoT data flow scenario
 * Demonstrates multi-device, multi-operator workflow
 */
async function main() {
  console.log("🚀 Starting IoT Data Flow Simulation...\n");

  // Get signers
  const [owner, operator1, operator2, deviceOwner1, deviceOwner2] = await ethers.getSigners();

  console.log("👥 Participants:");
  console.log("   Owner:", owner.address);
  console.log("   Operator 1:", operator1.address);
  console.log("   Operator 2:", operator2.address);
  console.log("   Device Owner 1:", deviceOwner1.address);
  console.log("   Device Owner 2:", deviceOwner2.address);

  // Deploy contract
  console.log("\n📦 Deploying PrivateIoTData contract...");
  const PrivateIoTData = await ethers.getContractFactory("PrivateIoTData");
  const contract = await PrivateIoTData.deploy();
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  console.log("   ✅ Contract deployed to:", contractAddress);

  // Scenario 1: Register multiple devices
  console.log("\n📱 Scenario 1: Register Multiple IoT Devices");

  const device1Id = "sensor-temperature-001";
  const device2Id = "sensor-humidity-002";
  const device3Id = "sensor-pressure-003";

  console.log("   Registering device 1:", device1Id);
  let tx = await contract.connect(deviceOwner1).registerDevice(device1Id);
  await tx.wait();
  console.log("   ✅ Device 1 registered (Owner: Device Owner 1)");

  console.log("   Registering device 2:", device2Id);
  tx = await contract.connect(deviceOwner2).registerDevice(device2Id);
  await tx.wait();
  console.log("   ✅ Device 2 registered (Owner: Device Owner 2)");

  console.log("   Registering device 3:", device3Id);
  tx = await contract.connect(deviceOwner1).registerDevice(device3Id);
  await tx.wait();
  console.log("   ✅ Device 3 registered (Owner: Device Owner 1)");

  console.log("\n   Total devices:", (await contract.getTotalDevices()).toString());

  // Scenario 2: Add authorized operators
  console.log("\n👥 Scenario 2: Add Authorized Operators");

  console.log("   Adding operator 1...");
  tx = await contract.addOperator(operator1.address);
  await tx.wait();
  console.log("   ✅ Operator 1 added");

  console.log("   Adding operator 2...");
  tx = await contract.addOperator(operator2.address);
  await tx.wait();
  console.log("   ✅ Operator 2 added");

  // Scenario 3: Set thresholds for devices
  console.log("\n⚙️ Scenario 3: Set Data Thresholds");

  console.log("   Setting temperature threshold for device 0...");
  tx = await contract.connect(deviceOwner1).setThreshold(
    0, // device index
    0, // data type: temperature
    1500, // min: 15.00°C
    3000  // max: 30.00°C
  );
  await tx.wait();
  console.log("   ✅ Temperature threshold set (15.00°C - 30.00°C)");

  console.log("   Setting humidity threshold for device 1...");
  tx = await contract.connect(deviceOwner2).setThreshold(
    1, // device index
    1, // data type: humidity
    3000, // min: 30%
    8000  // max: 80%
  );
  await tx.wait();
  console.log("   ✅ Humidity threshold set (30% - 80%)");

  // Scenario 4: Submit data from devices
  console.log("\n📊 Scenario 4: Submit Encrypted Data");

  const dataPoints = [
    { device: 0, value: 2200, type: 0, desc: "22.00°C (normal)" },
    { device: 1, value: 6500, type: 1, desc: "65% humidity (normal)" },
    { device: 0, value: 3500, type: 0, desc: "35.00°C (above threshold!)" },
    { device: 2, value: 101300, type: 2, desc: "101.3 kPa pressure" },
    { device: 1, value: 2000, type: 1, desc: "20% humidity (below threshold!)" },
  ];

  for (let i = 0; i < dataPoints.length; i++) {
    const dp = dataPoints[i];
    console.log(`   Submitting data ${i + 1}: Device ${dp.device} - ${dp.desc}`);

    const deviceOwner = dp.device === 1 ? deviceOwner2 : deviceOwner1;
    tx = await contract.connect(deviceOwner).submitData(dp.device, dp.value, dp.type);
    await tx.wait();

    console.log(`   ✅ Data ${i + 1} submitted`);
  }

  // Scenario 5: Operator submits data
  console.log("\n🔧 Scenario 5: Operator Submits Data");

  console.log("   Operator 1 submitting data for device 0...");
  tx = await contract.connect(operator1).submitData(0, 2500, 0);
  await tx.wait();
  console.log("   ✅ Data submitted by operator");

  // Scenario 6: Query device information
  console.log("\n🔍 Scenario 6: Query Device Information");

  for (let i = 0; i < 3; i++) {
    const info = await contract.getDeviceInfo(i);
    const dataCount = await contract.getDeviceDataCount(i);

    console.log(`   Device ${i}:`);
    console.log(`      ID: ${info.deviceId}`);
    console.log(`      Owner: ${info.deviceOwner}`);
    console.log(`      Active: ${info.isActive}`);
    console.log(`      Data records: ${dataCount.toString()}`);
  }

  // Scenario 7: Deactivate a device
  console.log("\n🔒 Scenario 7: Deactivate Device");

  console.log("   Deactivating device 2...");
  tx = await contract.connect(deviceOwner1).deactivateDevice(2);
  await tx.wait();
  console.log("   ✅ Device 2 deactivated");

  const deactivatedInfo = await contract.getDeviceInfo(2);
  console.log("   Device 2 active status:", deactivatedInfo.isActive);

  // Final Statistics
  console.log("\n📈 Final Statistics:");
  console.log("   Total devices registered:", (await contract.getTotalDevices()).toString());
  console.log("   Total data records:", (await contract.getTotalDataRecords()).toString());
  console.log("   Active devices:", 2);
  console.log("   Inactive devices:", 1);

  // Scenario Summary
  console.log("\n✨ Simulation Completed Successfully!");
  console.log("\n📋 Summary:");
  console.log("   ✅ 3 IoT devices registered");
  console.log("   ✅ 2 authorized operators added");
  console.log("   ✅ 2 data thresholds configured");
  console.log("   ✅ 6 encrypted data points submitted");
  console.log("   ✅ 1 device deactivated");
  console.log("\n   Contract Address:", contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Simulation failed:", error);
    process.exit(1);
  });

module.exports = { main };
