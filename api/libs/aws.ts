import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
require('dotenv').config()

const returnSecret = (key): any => {
    return new Promise(async response => {
        if (process.env[key] === undefined) {
            try {
                const secret_key = process.env.SECRET_PREFIX + "/" + process.env.STAGE + "/" + key
                const client = new SSMClient({ region: process.env.AWS_REGION });
                const ssm = await client.send(new GetParameterCommand({ Name: secret_key, WithDecryption: true }));
                const secret = ssm?.Parameter?.Value
                if (secret !== undefined) {
                    response(secret)
                } else {
                    response(false)
                }
            } catch (err) {
                console.log(err)
                response(false)
            }
        } else {
            response(process.env[key])
        }
    })
}

export { returnSecret }