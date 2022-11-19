const fs = require("fs")
const fa = require("@glif/filecoin-address");
const util = require("util");
const request = util.promisify(require("request"));

task("mint-fail", "Mint a new tree.")
  .setAction(async (taskArgs) => {
    const account = taskArgs.account
    const networkId = network.name

    async function callRpc(method, params) {
      var options = {
        method: "POST",
        url: "https://wallaby.node.glif.io/rpc/v0",
        // url: "http://localhost:1234/rpc/v0",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: method,
          params: params,
          id: 1,
        }),
      };
      const res = await request(options);
      return JSON.parse(res.body).result;
    }

    if (fs.existsSync("./deployments/wallaby/CaratoDaoRegistry.json")) {
      const deployment = JSON.parse(fs.readFileSync("./deployments/wallaby/CaratoDaoRegistry.json").toString())
      const contractAddr = deployment.address
      console.log("Reading CaratoDaoRegistry deployed at", contractAddr, "on network", networkId)
      const CaratoDaoRegistry = await ethers.getContractFactory("CaratoDaoRegistry")

      //Get signer information
      const accounts = await ethers.getSigners()
      const signer = accounts[0]
      console.log("Using address:", signer.address)

      // Create connection to API Consumer Contract and call the createRequestTo function
      const CaratoDaoRegistryContract = new ethers.Contract(contractAddr, CaratoDaoRegistry.interface, signer)

      const prefix = await CaratoDaoRegistryContract.getDecisionMessage()
      const message = ethers.utils.arrayify(prefix)
      const signature = await signer.signMessage(message)
      console.log("Signature is:", signature)

      try {
        await CaratoDaoRegistryContract.mintTree([signature])
      } catch (e) {
        console.log("Contract errored:", e.message)
      }

    } else {
      console.log("Deploy contract first!")
    }
  })

module.exports = {}