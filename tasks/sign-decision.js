const fs = require("fs")

task("sign-decision", "Tests the signature chain.")
  .setAction(async (taskArgs) => {
    const account = taskArgs.account
    const networkId = network.name

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
      const members = await CaratoDaoRegistryContract._active_members()
      console.log("Number of members:", members.toString())
      const check = await CaratoDaoRegistryContract._members(verified)
      console.log("Is address a member?", check)
      const threshold = await CaratoDaoRegistryContract.consensusThreshold()
      console.log("How many signature are required?", threshold.toString())
    } else {
      console.log("Deploy contract first!")
    }
  })

module.exports = {}