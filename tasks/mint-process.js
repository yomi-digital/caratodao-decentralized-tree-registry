const fs = require("fs")
const fa = require("@glif/filecoin-address");
const util = require("util");
const request = util.promisify(require("request"));
const axios = require("axios")

task("mint-process", "Mint all trees.")
  .setAction(async (taskArgs) => {
    const account = taskArgs.account
    const networkId = network.name

    async function callRpc(method, params) {
      var options = {
        method: "POST",
        url: "https://wallaby.node.glif.io/rpc/v0",
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
      const trees = await axios.get("https://carato-api.yomi.ninja/trees")
      for (let k in trees.data) {
        const tree = trees.data[k]
        if (tree.minted === false) {
          console.log("Processing tree:", tree)
          // Get deployment informations
          const deployment = JSON.parse(fs.readFileSync("./deployments/wallaby/CaratoDaoRegistry.json").toString())
          const contractAddr = deployment.address
          console.log("Reading CaratoDaoRegistry deployed at", contractAddr, "on network", networkId)

          // Get signer information
          const accounts = await ethers.getSigners()
          const signer = accounts[0]
          console.log("Using address:", signer.address)

          const CaratoDaoRegistry = await ethers.getContractFactory("CaratoDaoRegistry")
          // Create connection to API Consumer Contract and call the createRequestTo function
          const CaratoDaoRegistryContract = new ethers.Contract(contractAddr, CaratoDaoRegistry.interface, signer)
          // Check if request is made by a real member
          const check = await CaratoDaoRegistryContract._members(tree.memberAddress)
          console.log("Is address a member?", check)

          if (check === true) {
            const prefix = await CaratoDaoRegistryContract.getDecisionMessage()
            const message = ethers.utils.arrayify(prefix)
            const signature = await signer.signMessage(message)
            console.log("Signature is:", signature)
            const verified = await CaratoDaoRegistryContract.verifyMemberSignature(signature)
            console.log("Verified address is:", verified)
            const members = await CaratoDaoRegistryContract._activeMembers()
            console.log("Number of members:", members.toString())
            const threshold = await CaratoDaoRegistryContract.consensusThreshold()
            console.log("How many signature are required?", threshold.toString())

            // Take data to pack the transaction
            const priorityFee = await callRpc("eth_maxPriorityFeePerGas");
            console.log("Priority fee:", priorityFee)
            const nonce0x = await callRpc("eth_getTransactionCount", [signer.address, "latest"]);
            const nonce = parseInt(nonce0x, "hex")
            console.log('nonce:', nonce);

            try {
              const contractInterface = new ethers.utils.Interface(deployment.abi)
              const status = tree.details.status
              const coordinates = tree.details.coordinates
              const platningDate = tree.details.plantingDate
              const details = tree.details.details
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
              await axios.post("https://carato-api.yomi.ninja/mint/confirm", {
                opid: tree.opId,
                tx: transaction.hash,
                signature: signature
              })
            } catch (e) {
              console.log("Contract errored:", e.message)
            }
          }
          console.log("--")
        } else {
          console.log("Not a member, can't do it manually.")
        }
      }
    } else {
      console.log("Deploy contract first!")
    }
  })

module.exports = {}