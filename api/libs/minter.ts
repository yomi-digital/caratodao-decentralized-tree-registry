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


export { verify }