import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deployPrivateIoTData: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying PrivateIoTData contract...");

  const deployment = await deploy("PrivateIoTData", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 1,
  });

  console.log(`PrivateIoTData deployed to: ${deployment.address}`);
};

deployPrivateIoTData.tags = ["PrivateIoTData"];

export default deployPrivateIoTData;
