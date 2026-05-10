require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-ignition-ethers");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.28" },
      { version: "0.8.20" }
    ]
  },
  networks: {
    hardhat: {},
    localhost: {
      url: process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545"
    },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/0lOeq1KY_Ab_V2avqupdm",
      accounts: ["1f13575d5045dbed79126f54e395666651eaff87cd2612363f9885cedd0c52a1"]
    }
  },
};
