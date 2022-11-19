const fs = require("fs")
const fa = require("@glif/filecoin-address");
const util = require("util");
const request = util.promisify(require("request"));

task("mint-tree", "Mint a new tree.")
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
      const verified = await CaratoDaoRegistryContract.verifyMemberSignature(signature)
      console.log("Verified address is:", verified)
      const members = await CaratoDaoRegistryContract._activeMembers()
      console.log("Number of members:", members.toString())
      const check = await CaratoDaoRegistryContract._members(verified)
      console.log("Is address a member?", check)
      const threshold = await CaratoDaoRegistryContract.consensusThreshold()
      console.log("How many signature are required?", threshold.toString())

      // Take data to pack the transaction
      const priorityFee = await callRpc("eth_maxPriorityFeePerGas");
      const nonce0x = await callRpc("eth_getTransactionCount", [signer.address, "latest"]);
      const nonce = parseInt(nonce0x, "hex")
      console.log('nonce:', nonce);

      try {
        const contractInterface = new ethers.utils.Interface(deployment.abi)
        const status = "GROWING"
        const coordinates = "36.8853942,14.5329769"
        const platningDate = "2022-11-06"
        const details = "Quercus"
        // Send transaction
        const data = await contractInterface.encodeFunctionData("mintTree", [[signature], status, coordinates, platningDate, details])
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
      } catch (e) {
        console.log("Contract errored:", e.message)
      }
    } else {
      console.log("Deploy contract first!")
    }
  })

module.exports = {}