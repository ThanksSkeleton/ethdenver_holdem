// THIS IS THE DEFAULT SAPPHIRE TESTNET SETUP

// import { HardhatUserConfig } from "hardhat/config";
// import '@oasisprotocol/sapphire-hardhat';
// import "@nomicfoundation/hardhat-toolbox";

// const config: HardhatUserConfig = {
//   solidity: "0.8.20",
//     networks: {
//       'sapphire-testnet': {
//         // This is Testnet! If you want Mainnet, add a new network config item.
//         url: "https://testnet.sapphire.oasis.dev",
//         accounts: process.env.PRIVATE_KEY
//           ? [process.env.PRIVATE_KEY]
//           : [],
//         chainId: 0x5aff,
//       },
//     },
// };

// export default config;

// THIS IS THE DEFAULT HARDHAT SETUP

 import { HardhatUserConfig } from "hardhat/config";
 import "@nomicfoundation/hardhat-toolbox";

 const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
 };

 export default config;