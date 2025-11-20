const { ethers } = require("hardhat");

/**
 * Interact with deployed PrivateIoTData contract
 * Demonstrates basic operations: register device, submit data, set thresholds
 */
async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS || "";

  if (!contractAddress) {
    console.error("❌ Error: CONTRACT_ADDRESS environment variable not set");
    console.log("Usage: CONTRACT_ADDRESS=0x... npx hardhat run scripts/interact.js --network sepolia");
    process.exit(1);
  }

  console.log("Starting contract interaction...\n");
  console.log("Contract address:", contractAddress);

  // Get signer
  const [signer] = await ethers.getSigners();
  console.log("Interacting with account:", signer.address);

  // Get contract instance
  const PrivateIoTData = await ethers.getContractFactory("PrivateIoTData");
  const contract = PrivateIoTData.attach(contractAddress);

  console.log("\n📊 Current Contract State:");
  console.log("   Owner:", await contract.owner());
  console.log("   Total devices:", (await contract.getTotalDevices()).toString());
  console.log("   Total data records:", (await contract.getTotalDataRecords()).toString());

  // Example 1: Register a new IoT device
  console.log("\n🔧 Example 1: Register IoT Device");
  const deviceId = `device-${Date.now()}`;
  console.log("   Registering device:", deviceId);

  const registerTx = await contract.registerDevice(deviceId);
  const registerReceipt = await registerTx.wait();
  console.log("   ✅ Device registered!");
  console.log("   Transaction hash:", registerReceipt.hash);

  // Get device index from event
  const event = registerReceipt.logs.find(
    (log) => log.fragment && log.fragment.name === "DeviceRegistered"
  );
  const deviceIndex = event ? event.args[0] : 0n;
  console.log("   Device index:", deviceIndex.toString());

  // Example 2: Get device information
  console.log("\n📋 Example 2: Get Device Information");
  const deviceInfo = await contract.getDeviceInfo(deviceIndex);
  console.log("   Device ID:", deviceInfo.deviceId);
  console.log("   Owner:", deviceInfo.deviceOwner);
  console.log("   Active:", deviceInfo.isActive);
  console.log("   Registration time:", new Date(Number(deviceInfo.registrationTime) * 1000).toISOString());

  // Example 3: Submit encrypted data
  console.log("\n📤 Example 3: Submit Encrypted Data");
  const dataValue = 2500; // Example: 25.00°C
  const dataType = 0; // 0: temperature
  console.log("   Submitting data - Value:", dataValue, "Type:", dataType);

  const submitTx = await contract.submitData(deviceIndex, dataValue, dataType);
  const submitReceipt = await submitTx.wait();
  console.log("   ✅ Data submitted!");
  console.log("   Transaction hash:", submitReceipt.hash);

  // Example 4: Set threshold
  console.log("\n⚙️ Example 4: Set Data Threshold");
  const minValue = 1000; // 10.00°C
  const maxValue = 3500; // 35.00°C
  console.log("   Setting threshold - Min:", minValue, "Max:", maxValue);

  const thresholdTx = await contract.setThreshold(deviceIndex, dataType, minValue, maxValue);
  const thresholdReceipt = await thresholdTx.wait();
  console.log("   ✅ Threshold set!");
  console.log("   Transaction hash:", thresholdReceipt.hash);

  // Example 5: Check if threshold is set
  console.log("\n🔍 Example 5: Check Threshold Status");
  const isSet = await contract.isThresholdSet(deviceIndex, dataType);
  console.log("   Threshold set:", isSet);

  // Example 6: Add an operator
  console.log("\n👥 Example 6: Add Authorized Operator");
  const operatorAddress = signer.address;
  console.log("   Adding operator:", operatorAddress);

  const addOperatorTx = await contract.addOperator(operatorAddress);
  await addOperatorTx.wait();
  console.log("   ✅ Operator added!");

  // Final state
  console.log("\n📊 Final Contract State:");
  console.log("   Total devices:", (await contract.getTotalDevices()).toString());
  console.log("   Total data records:", (await contract.getTotalDataRecords()).toString());
  console.log("   Device data count:", (await contract.getDeviceDataCount(deviceIndex)).toString());

  console.log("\n✨ Interaction completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Interaction failed:", error);
    process.exit(1);
  });

module.exports = { main };
