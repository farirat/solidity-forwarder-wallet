import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    }
  },
  networks: {
    goerli: {
      url: 'https://eth-goerli.public.blastapi.io',
      accounts: [
          "88fee7d4abf558ec3836285e3e51129abc620f243b149a17848b522c13ffc000",
          "88fce7d4abf558ec3836285e3e51129abc620f143b141a17842b528c12ffc001",
          "86fae7d4abf558ec3836285e3e51129abc620f443b143a17846b528c12ffc002"
      ]
    }
  }
};

export default config;
