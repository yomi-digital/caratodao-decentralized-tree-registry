const fs = require("fs")

task("get-decision-message", "Calls the simple coin Contract to read the amount of CaratoDaoRegistrys owned by the account.")
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

      //Create connection to API Consumer Contract and call the createRequestTo function
      const CaratoDaoRegistryContract = new ethers.Contract(contractAddr, CaratoDaoRegistry.interface, signer)
      const message = await CaratoDaoRegistryContract.getDecisionMessage()
      console.log("Decision message is:", message)
    } else {
      console.log("Deploy contract first!")
    }
  })

module.exports = {}