const { run } = require("hardhat");

/**
 * Verify deployed contract on Etherscan
 * Usage: npx hardhat run scripts/verify.js --network sepolia
 */
async function main() {
  // Replace with your deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS || "";

  if (!contractAddress) {
    console.error("❌ Error: CONTRACT_ADDRESS environment variable not set");
    console.log("Usage: CONTRACT_ADDRESS=0x... npx hardhat run scripts/verify.js --network sepolia");
    process.exit(1);
  }

  console.log("Starting contract verification...\n");
  console.log("Contract address:", contractAddress);

  try {
    console.log("Verifying contract on Etherscan...");

    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });

    console.log("\n✅ Contract verified successfully!");
    console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("\n✅ Contract already verified!");
      console.log(`🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}#code`);
    } else {
      console.error("❌ Verification failed:", error.message);
      throw error;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

module.exports = { main };
