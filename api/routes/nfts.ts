import express = require("express")
import { returnSecret } from "../libs/aws"
import { get, scan, update } from '../libs/database'
import * as Minter from '../libs/minter'
const requestsTable = process.env.STAGE + "_caratoRequests"


export async function mintTree(req: express.Request, res: express.res) {
    const secret = await returnSecret('secret')
    if (req.body.details !== undefined && req.body.opid !== undefined && req.body.receiver !== undefined && req.body.secret === secret) {
        try {
            const check = await scan(requestsTable, "opId = :i", { ":i": req.body.opid })
            console.log("Checking if opid exists in table:", check)
            if (check === null) {
                const tx = await Minter.mintTree(req.body.opid, req.body.receiver, req.body.details)
                if (tx !== false) {
                    res.send({ message: "Nft minted successfully", error: false, tx })
                } else {
                    res.send({ message: "Error while minting, retry", error: true })
                }
            } else {
                res.send({ message: "This opid was processed yet", op: check, error: true })
            }
        } catch (e) {
            console.log(e)
            res.send({ message: "Nft service is not working, please retry.", error: true })
        }
    } else {
        res.send({ message: "Malformed request.", error: true })
    }
}
