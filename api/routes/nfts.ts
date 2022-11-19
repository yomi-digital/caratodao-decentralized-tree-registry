import express = require("express")
import { returnSecret } from "../libs/aws"
import { get, scan, update, put } from '../libs/database'
import { ABI } from "../libs/abi"
import { ethers } from "ethers"
import { v4 as uuidv4 } from 'uuid'

const util = require("util");
const request = util.promisify(require("request"));

const requestsTable = process.env.STAGE + "_caratoRequests"
const contractAddr = "0xA5EDc79f51A8138511C2408870a88840d7Ad27D8"

async function callRpc(method, params = {}) {
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

export async function processMinting(req: express.Request, res: express.res) {
    if (req.body.operation !== undefined && req.body.details !== undefined && req.body.signature !== undefined) {
        try {
            const toMint = await scan(requestsTable, "minted = :m and operation  = :o", { ":m": false, ":o": "ADD_TREE" })
            const provider = new ethers.providers.JsonRpcProvider("https://wallaby.node.glif.io/rpc/v0")
            const DEPLOYER_PRIVATE_KEY = await returnSecret('nft_proxy')
            const signer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY).connect(provider)
            if (toMint !== null && toMint.length > 0) {
                const tree = toMint[0]
                const priorityFee = await callRpc("eth_maxPriorityFeePerGas");
                const nonce0x = await callRpc("eth_getTransactionCount", [signer.address, "latest"]);
                const nonce = parseInt(nonce0x)
                console.log('nonce:', nonce);
                try {
                    const contractInterface = new ethers.utils.Interface(ABI)
                    const status = tree.details.status
                    const coordinates = tree.details.coordinates
                    const platingDate = tree.details.plantingDate
                    const details = tree.details.details
                    // Send transaction
                    const data = await contractInterface.encodeFunctionData("mintTree", [[tree.signature], status, coordinates, platingDate, details])
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
                    await update(
                        requestsTable,
                        { opId: tree.opId, },
                        "set minted = :m and txid = :t",
                        { ":m": true, ":t": transaction }
                    )
                } catch (e) {
                    console.log("Contract errored:", e.message)
                }
            }
        } catch (e) {
            console.log(e)
            res.send({ message: "Service is not working, please retry.", error: true })
        }
    } else {
        res.send({ message: "Malformed request.", error: true })
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