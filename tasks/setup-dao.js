const fs = require("fs")
const fa = require("@glif/filecoin-address");
const util = require("util");
const request = util.promisify(require("request"));

task("setup-dao", "Add all members in the DAO.")
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

      const provider = new ethers.providers.JsonRpcProvider("https://wallaby.node.glif.io/rpc/v0")
      const second_member = new ethers.Wallet(process.env.SECOND_MEMBER).connect(provider)
      const third_member = new ethers.Wallet(process.env.THIRD_MEMBER).connect(provider)
      let members = [second_member.address, third_member.address]

      for (let k in members) {
        try {
          // Take data to pack the transaction
          const priorityFee = await callRpc("eth_maxPriorityFeePerGas");
          const nonce0x = await callRpc("eth_getTransactionCount", [signer.address, "latest"]);
          const nonce = parseInt(nonce0x, "hex")
          console.log('nonce:', nonce);

          // Create needed signatures first
          const prefix = await CaratoDaoRegistryContract.getDecisionMessage()
          const message = ethers.utils.arrayify(prefix)
          const signature = await signer.signMessage(message)

          const contractInterface = new ethers.utils.Interface(deployment.abi)
          const data = await contractInterface.encodeFunctionData("fixMember", [members[k], true, [signature]])
          console.log("Adding " + members[k] + " to DAO...")
          const transaction = await signer.sendTransaction({
            from: signer.address,
            to: contractAddr,
            value: "0",
            data: data,
            gasLimit: 10000000000,
            maxPriorityFeePerGas: priorityFee,
            nonce: nonce
          })
          console.log(transaction)
          console.log("--")
        } catch (e) {
          console.log("Contract errored:", e.message)
        }
      }
    } else {
      console.log("Deploy contract first!")
    }
  })

module.exports = {}