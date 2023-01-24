import { ethers } from "hardhat";

async function main() {
  const Sandbox = await ethers.getContractFactory("Wallet");
  const sc = await Sandbox.deploy();

  await sc.deployed();

  console.log(`Smart contract deployed to ${sc.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
