const bip39 = require('bip39')
const { ethers } = require('ethers') 
const web3 = require("web3")
const ETH_DERIVATION_PATH = 'm/44\'/60\'/0\'/0';
import ethWallet, { hdkey as ethHdKey } from 'ethereumjs-wallet';
const crypto = require('crypto')
const key = crypto.createHash('sha256').update(String(process.env.SECRET)).digest('base64').substr(0, 32)

// Setting up provider
let PROVIDER
let CHAINID
if (process.env.NETWORK === 'ganache') {
    PROVIDER = process.env.GANACHE_WEB3_PROVIDER
    CHAINID = process.env.GANACHE_CHAINID
} else if (process.env.NETWORK === 'mumbai') {
    PROVIDER = process.env.MUMBAI_WEB3_PROVIDER
    CHAINID = process.env.MUMBAI_CHAINID
} else if (process.env.NETWORK === 'polygon') {
    PROVIDER = process.env.POLYGON_WEB3_PROVIDER
    CHAINID = process.env.POLYGON_CHAINID
}

const encrypt = ((val, password?) => {
    if (password === undefined) {
        password = key
    }
    let iv = crypto.randomBytes(8).toString('hex')
    let pwd = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32)
    let cipher = crypto.createCipheriv('aes-256-cbc', pwd, iv)
    let encrypted = cipher.update(val, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + '*' + encrypted
})

const decrypt = ((encrypted, password?) => {
    if (password === undefined) {
        password = key
    }
    try {
        let parts = encrypted.split('*')
        let pwd = crypto.createHash('sha256').update(String(password)).digest('base64').substr(0, 32)
        let decipher = crypto.createDecipheriv('aes-256-cbc', pwd, parts[0])
        let decrypted = decipher.update(parts[1], 'hex', 'utf8')
        return (decrypted + decipher.final('utf8'))
    } catch (e) {
        return false
    }
})

const hash = ((text) => {
    let buf = Buffer.from(text)
    var sha = crypto.createHash('sha256').update(buf).digest()
    return sha.toString('hex')
})

const getnewaddress = (async (mnemonic = false, child = 0, chain = 'ETH') => {
    let address
    let privkey
    let eid

    if (chain === 'ETH') {
        if (!mnemonic) {
            mnemonic = bip39.generateMnemonic()
        }
        eid = encrypt(mnemonic)
        const hdwallet = ethHdKey.fromMasterSeed(await bip39.mnemonicToSeed(mnemonic));
        const derivePath = hdwallet.derivePath(ETH_DERIVATION_PATH).deriveChild(child);
        privkey = derivePath.getWallet().getPrivateKeyString();
        const wallet = ethWallet.fromPrivateKey(Buffer.from(privkey.replace('0x', ''), 'hex'));
        address = wallet.getAddressString()
    }

    return {
        address: address,
        privkey: privkey,
        eid: eid
    }
})

const gasbalance = (async (address) => {
    const provider = new ethers.providers.JsonRpcProvider(PROVIDER);
    const web3Instance = new web3(provider)
    let balance = await provider.getBalance(address)
    balance = web3Instance.utils.fromWei(balance, "ether");
    return balance
})

export { getnewaddress, gasbalance, encrypt, decrypt, hash }