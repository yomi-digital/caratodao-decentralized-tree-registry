import { ABI } from '../libs/abi'
import { returnSecret } from '../libs/aws'
import { scan, put } from '../libs/database'
const { ethers } = require('ethers')
const requestsTable = process.env.STAGE + "_caratoRequests"

function setupMinter() {
    return new Promise(async response => {
        console.log('Setting up minter on network:', process.env.NFT_BLOCKCHAIN)
        const nft_proxy = await returnSecret('nft_proxy')
        response({
            PROVIDER: process.env.NFT_PROVIDER,
            BLOCKCHAIN: process.env.NFT_BLOCKCHAIN,
            CONTRACT: process.env.NFT_CONTRACT,
            PROXY: nft_proxy
        })
    })
}

const verify = (message, signature) => {
    return new Promise(async response => {
        const verified = await ethers.utils.verifyMessage(message, signature)
        response(verified)
    })
}

const mintTree = ((identifier, receiver, credits) => {
    return new Promise(async response => {
        const blockchainEnv = <any>await setupMinter()
        if (blockchainEnv.PROVIDER !== undefined && blockchainEnv.PROXY !== undefined && blockchainEnv.CONTRACT !== undefined && blockchainEnv.BLOCKCHAIN !== undefined) {
            try {
                console.log('Setting up contract: ' + blockchainEnv.CONTRACT)
                const provider = new ethers.providers.JsonRpcProvider(blockchainEnv.PROVIDER);
                const wallet = new ethers.Wallet(blockchainEnv.PROXY).connect(provider)
                const minter = wallet.address
                console.log('Using minter: ' + minter)
                const contract = new ethers.Contract(blockchainEnv.CONTRACT, ABI, wallet)
                let nonce
                let found = true
                let checkNonce = await provider.getTransactionCount(minter)
                while (found) {
                    try {
                        const doubleCheckNonce = await scan(requestsTable, "nonce = :n", { ":n": checkNonce })
                        console.log('Checking if nonce ' + checkNonce + ' exists in table:', doubleCheckNonce)
                        if (doubleCheckNonce === null) {
                            nonce = checkNonce
                            found = false
                        } else {
                            checkNonce++
                            console.log('Nonce already found in a mempool transaction, need to increment, now using ' + checkNonce + '..')
                        }
                    } catch (e) {
                        response(false)
                    }
                }
                try {
                    const gasPrice = (await wallet.getGasPrice()).mul(2)
                    console.log('Using gas price:', gasPrice.toString())
                    const minted = await contract.mintNFT(receiver, { gasPrice: gasPrice, gasLimit: 300000 })
                    const receipt = await minted.wait()
                    const tokenId = receipt.events[0].args[2].toString()
                    console.log("Receipt is:", JSON.stringify(receipt, null, 4))
                    console.log("Token id is:", tokenId)
                    const tx = minted.hash
                    console.log('Transaction id is ' + tx)
                    await put(
                        requestsTable,
                        {
                            opId: identifier,
                            nonce: nonce,
                            contractAddress: blockchainEnv.CONTRACT,
                            walletAddress: receiver,
                            initialCredit: credits,
                            creditAmount: credits,
                            tokenId: tokenId,
                            txId: tx,
                            txReceipt: receipt,
                            dateCreated: new Date().getTime()
                        }
                    )
                    response(receipt)
                } catch (e) {
                    console.log("MINTING FAILED", e)
                    response(false)
                }
            } catch (e) {
                console.log(e)
                response(false)
            }
        } else {
            response(false)
        }
    })
})

export { verify, mintTree }