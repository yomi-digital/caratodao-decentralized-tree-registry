import express = require("express")
import { returnSecret } from "../libs/aws"
import { get, scan, update, put } from '../libs/database'
import { ABI } from "../libs/abi"
import { ethers } from "ethers"
import { v4 as uuidv4 } from 'uuid'

const util = require("util");
const request = util.promisify(require("request"));

const requestsTable = process.env.STAGE + "_caratoRequests"
// Test contract
// const contractAddr = "0xA5EDc79f51A8138511C2408870a88840d7Ad27D8"

// Live contract
const contractAddr = "0x1bB2f70C37Ca0Cc0A318456bD8D8855e4958855B"

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

export async function mintTree(req: express.Request, res: express.res) {
    if (req.body.operation !== undefined && req.body.details !== undefined && req.body.signature !== undefined) {
        try {
            const provider = new ethers.providers.JsonRpcProvider("https://wallaby.node.glif.io/rpc/v0")
            const DEPLOYER_PRIVATE_KEY = await returnSecret('nft_proxy')
            const signer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY).connect(provider)
            const contract = new ethers.Contract(contractAddr, ABI, signer)
            const prefix = await contract.getDecisionMessage()
            const message = ethers.utils.arrayify(prefix)
            const member = await ethers.utils.verifyMessage(message, req.body.signature)
            console.log("Required by:", member)
            const check = await scan(requestsTable, "signature = :i and memberAddress = :m", { ":i": req.body.signature, ":m": member })
            console.log("Checking if opid exists in table:", check)
            const uuid = uuidv4()
            await put(requestsTable, {
                opId: uuid,
                memberAddress: member,
                operation: req.body.operation,
                details: req.body.details,
                signature: req.body.signature,
                timestamp: new Date().getTime(),
                minted: false
            })
            res.send({ message: "Request processed correctly", error: false })
        } catch (e) {
            console.log(e)
            res.send({ message: "Service is not working, please retry.", error: true })
        }
    } else {
        res.send({ message: "Malformed request.", error: true })
    }
}

// TODO: Fix process because doesn't work
export async function processMinting(req: express.Request, res: express.res) {
    try {
        console.log("Scanning collection..")
        const toMint = await scan(requestsTable, "minted = :m and operation = :o", { ":m": false, ":o": "ADD_TREE" }, true)
        console.log("Create blockchain instance..")
        if (toMint !== null && toMint.length > 0) {
            const provider = new ethers.providers.JsonRpcProvider("https://wallaby.node.glif.io/rpc/v0")
            const DEPLOYER_PRIVATE_KEY = await returnSecret('nft_proxy')
            const signer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY).connect(provider)
            // Selecting first tree to mint
            const tree = toMint[0]
            console.log("Minting:", tree)
            try {
                // Take nonce and fees from blockchain
                const nonce0x = await callRpc("eth_getTransactionCount", [signer.address, "latest"]);
                let nonce = parseInt(nonce0x)
                console.log('Checking nonce:', nonce);
                let found = false
                while (!found) {
                    const check = await scan(requestsTable, "nonce = :n", { ":n": nonce })
                    if (check === null) {
                        console.log('Nonce confirmed:', nonce);
                        found = true
                    } else {
                        nonce++
                    }
                }
                await update(
                    requestsTable,
                    { opId: tree.opId, },
                    "set nonce = :n",
                    { ":n": nonce }
                )
                // Create contract instance
                console.log("Creating contract instance..")
                const CaratoDaoRegistryContract = new ethers.Contract(contractAddr, ABI, signer)
                // Signing request by key
                const prefix = await CaratoDaoRegistryContract.getDecisionMessage()
                const message = ethers.utils.arrayify(prefix)
                const signature = await signer.signMessage(message)
                console.log("Signature is:", signature)
                // Final needed values
                const status = tree.details.status
                const coordinates = tree.details.coordinates
                const plantingDate = tree.details.plantingDate
                const details = tree.details.details
                // Send transaction
                const priorityFee = await callRpc("eth_maxPriorityFeePerGas", []);
                const priorityFeeHex = ethers.BigNumber.from(priorityFee).mul(2)
                console.log("Priority fee:", priorityFeeHex)
                const transaction = await CaratoDaoRegistryContract.mintTree([signature], status, coordinates, plantingDate, details, {
                    value: "0",
                    gasLimit: 10000000000,
                    maxPriorityFeePerGas: priorityFeeHex,
                    nonce: nonce
                })
                console.log(transaction)
                await update(
                    requestsTable,
                    { opId: tree.opId, },
                    "set minted = :m and txid = :t",
                    { ":m": true, ":t": transaction }
                )
                res.send({ message: "Minting successful.", error: false })
            } catch (e) {
                // Workaround for mismatch error
                if (e.message.indexOf("hash mismatch") !== -1) {
                    const split = e.message.split("returnedHash=")
                    const txid = split[1].split(',')[0].replace('"', '').replace('"', '')
                    console.log(txid)
                    await update(
                        requestsTable,
                        { opId: tree.opId, },
                        "set minted = :m, txid = :t",
                        { ":m": true, ":t": txid }
                    )
                    res.send({ message: "Minting successful.", error: false })
                } else {
                    await update(
                        requestsTable,
                        { opId: tree.opId, },
                        "set nonce = :n",
                        { ":n": "" }
                    )
                    console.log("Contract errored:", e.message)
                    res.send({ message: "Minting errored.", error: true, details: e.message })
                }
            }
        } else {
            res.send({ message: "Nothing to mint.", error: true })
        }
    } catch (e) {
        console.log(e)
        res.send({ message: "Service is not working, please retry.", error: true, details: e })
    }
}

export async function getTrees(req: express.Request, res: express.res) {
    try {
        const trees = await scan(requestsTable, "operation = :o", { ":o": "ADD_TREE" })
        res.send(trees)
    } catch (e) {
        console.log(e)
        res.send({ message: "Service is not working, please retry.", error: true })
    }
}

export async function confirmMinting(req: express.Request, res: express.res) {
    try {
        if (req.body.opid !== undefined && req.body.tx !== undefined && req.body.signature !== undefined) {
            const provider = new ethers.providers.JsonRpcProvider("https://wallaby.node.glif.io/rpc/v0")
            const DEPLOYER_PRIVATE_KEY = await returnSecret('nft_proxy')
            const signer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY).connect(provider)
            const CaratoDaoRegistryContract = new ethers.Contract(contractAddr, ABI, signer)
            const prefix = await CaratoDaoRegistryContract.getDecisionMessage()
            const message = ethers.utils.arrayify(prefix)
            const verifiedEthers = await ethers.utils.verifyMessage(message, req.body.signature)
            const check = await CaratoDaoRegistryContract._members(verifiedEthers)
            console.log("Is address a member?", check)
            if (check) {
                const toMint = await scan(requestsTable, "minted = :m and operation = :o", { ":m": false, ":opid": req.body.opid })
                if (toMint !== null) {
                    await update(
                        requestsTable,
                        { opId: req.body.opid, },
                        "set minted = :m, tx = :t",
                        { ":m": true, ":t": req.body.tx }
                    )
                    res.send({ message: "Minting confirmed successfully.", error: false })
                } else {
                    res.send({ message: "Nothing to mint.", error: true })
                }
            } else {
                res.send({ message: "Not authorized.", error: true })
            }
        } else {
            res.send({ message: "Malformed request.", error: true })
        }
    } catch (e) {
        console.log(e)
        res.send({ message: "Service is not working, please retry.", error: true, details: e })
    }
}