const { ethers } = require("hardhat");

/**
 * Main deployment script for PrivateIoTData contract
 * Deploys to the configured network (local/Sepolia)
 */
async function main() {
  console.log("Starting PrivateIoTData deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deploy PrivateIoTData contract
  console.log("Deploying PrivateIoTData contract...");
  const PrivateIoTData = await ethers.getContractFactory("PrivateIoTData");
  const privateIoTData = await PrivateIoTData.deploy();

  await privateIoTData.waitForDeployment();
  const contractAddress = await privateIoTData.getAddress();

  console.log("✅ PrivateIoTData deployed to:", contractAddress);
  console.log("   Transaction hash:", privateIoTData.deploymentTransaction()?.hash);
  console.log("   Block number:", privateIoTData.deploymentTransaction()?.blockNumber);

  // Get network information
  const network = await ethers.provider.getNetwork();
  console.log("\n📋 Network Information:");
  console.log("   Network name:", network.name);
  console.log("   Chain ID:", network.chainId.toString());

  // Display contract information
  console.log("\n📄 Contract Information:");
  console.log("   Contract owner:", await privateIoTData.owner());
  console.log("   Device count:", (await privateIoTData.deviceCount()).toString());
  console.log("   Data record count:", (await privateIoTData.dataRecordCount()).toString());

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentHash: privateIoTData.deploymentTransaction()?.hash,
    blockNumber: privateIoTData.deploymentTransaction()?.blockNumber,
    timestamp: new Date().toISOString(),
  };

  console.log("\n💾 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // For Sepolia, show Etherscan link
  if (network.chainId === 11155111n) {
    console.log("\n🔗 Etherscan Link:");
    console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);
  }

  console.log("\n✨ Deployment completed successfully!");

  return contractAddress;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

module.exports = { main };
