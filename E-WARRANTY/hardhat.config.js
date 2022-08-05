require("@nomiclabs/hardhat-waffle");

const fs = require("fs")
const privateKey = fs.readFileSync(".secret").toString()

const projectId = "5e07c1e2190849b1aaa120a9abda7f0f";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    hardhat: {
      chainId: 1337
    },
    rinkbey: {
      url: `https://rinkeby.infura.io/v3/${projectId}`,
      accounts: []
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${projectId}`,
      accounts: []
    }

  },
  solidity: "0.8.9",
};
