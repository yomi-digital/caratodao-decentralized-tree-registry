import express = require("express")
import { returnSecret } from "../libs/aws"
import { get, scan, update, put } from '../libs/database'
import { ABI } from "../libs/abi"
import { ethers } from "ethers"

const requestsTable = process.env.STAGE + "_caratoRequests"
const contractAddr = "0xA5EDc79f51A8138511C2408870a88840d7Ad27D8"

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
            const check = await scan(requestsTable, "opId = :i and memberAddress = :m", { ":i": req.body.signature, ":m": member })
            console.log("Checking if opid exists in table:", check)
            if (check === null) {
                await put(requestsTable, {
                    opId: req.body.signature,
                    memberAddress: member,
                    operation: req.body.operation,
                    details: req.body.details
                })
                res.send({ message: "Request processed correctly", error: false })
            } else {
                res.send({ message: "This opid was processed yet", op: check, error: true })
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