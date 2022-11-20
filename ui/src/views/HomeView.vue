<template>
    <div>
        <Navbar @connect="connect()" :account="account" :network="network" />
        <div class="gap-navbar"></div>
        <div class="container mt-6">
            <div class="columns">
                <div class="column is-5">
                    <div>
                        <h1 class="">🌳 CaratoDAO</h1>
                        <h2 class="subtitle">Decentralized Tree Registry</h2>
                        <p>
                            Tree registry is a smart-contract developed on the FEVM, the Filecoin EVM-compatible virtual
                            machine.<br><br>
                            Each tree is issued as an NFT by the community and the DAO members are dynamic. Each 3
                            participants 1 new signature is required to accomplish tasks inside the contract. Metadata
                            are stored and served directly by the contract, so are completely on-chain.<br><br>
                            Operations are also gasless, because a backend (or a member) collects all the requests (to
                            go at web2
                            speed) and processes them in the background while the DAO can operate fast. This means also
                            a non-member can ask for inclusion.<br><br>
                            This is a Proof of Concept, developed between 18th and 20th November 2022, during the first
                            FEVM Hackaton hosted by EthGlobal.<br><br>
                            Anyway <a href="https://twitter.com/CaratoDao" target="_blank">Carato</a> is a real project
                            and we plant trees for real, support us!
                        </p>
                    </div>
                </div>
                <div class="column is-7">
                    <Gmap :account="account" :isMember="isMember" @modalTree="modalTree()" />
                    <!-- ALERT BANNER NO ACCOUNT -->
                    <div class="mt-3" v-if="!account">
                        <div class="alert-banner py-3 px-4">
                            <div class="container">
                                <p>
                                    <i class="fa-solid fa-circle-exclamation mr-3"></i>
                                    <b>You have to connect with your wallet to add a tree</b>
                                </p>
                            </div>
                        </div>
                    </div>
                    <!-- END | ALERT BANNER NO ACCOUNT -->
                    <div class="mt-3" v-if="account">
                        Dao Active Members: {{ daoMembers }}<br>
                        Required signatures to reach consensus: {{ requiredSignatures }}<br>
                        Minted trees: {{ mintedTrees }}
                    </div>
                    <!-- ALERT BANNER NO MEMBER -->
                    <div class="mt-3" v-if="account && !isMember">
                        <div class="alert-banner py-3 px-4">
                            <div class="container">
                                <p>
                                    <i class="fa-solid fa-circle-exclamation mr-3"></i>
                                    <b>You are no part of the DAO, you can just propose trees.</b>
                                </p>
                            </div>
                        </div>
                    </div>
                    <!-- END | ALERT BANNER NO MEMBER -->
                </div>
            </div>
        </div>
        <Modal :isCreate="isCreate" :contract="contract" :account="account" :abi="abi" :web3="web3" @closeModal="closeModal()" />
    </div>
</template>

<script>
import Modal from "@/components/Modal.vue"
import Navbar from "@/components/Navbar.vue"
import Gmap from "@/components/Gmaps.vue"
import Web3 from "web3"
import Web3Modal from "web3modal"
import ABI from "../assets/abi.json"
export default {
    name: "home-app",
    data() {
        return {
            account: "",
            contract: "0x1bB2f70C37Ca0Cc0A318456bD8D8855e4958855B",
            web3: "",
            network: 18,
            abi: ABI,
            balance: "",
            isCreate: false,
            isMember: false,
            daoMembers: 0,
            requiredSignatures: 0,
            mintedTrees: 0
        }
    },
    components: {
        Navbar,
        Modal,
        Gmap,
    },
    methods: {
        async connect() {
            // TODO: not control the network
            const app = this
            // Instantiating Web3Modal
            const web3Modal = new Web3Modal({
                cacheProvider: true,
            })
            try {
                const provider = await web3Modal.connect()
                app.web3 = await new Web3(provider)
            } catch (e) {
                console.log("PROVIDER_ERROR", e.message)
                window.location = "/"
            }
            const netId = await app.web3.eth.net.getId()
            console.log("Current network is:", netId)
            if (parseInt(netId) === parseInt(app.network)) {
                try {
                    const accounts = await app.web3.eth.getAccounts()
                    if (accounts.length > 0) {
                        app.account = accounts[0]
                        app.balance = await app.web3.eth.getBalance(accounts[0])
                        console.log("account balance is", app.balance)
                        app.balance = parseFloat(
                            app.web3.utils.fromWei(app.balance, "ether")
                        ).toFixed(10)
                        const contract = new app.web3.eth.Contract(app.abi, app.contract);
                        app.isMember = await contract.methods._members(app.account).call()
                        app.daoMembers = await contract.methods._activeMembers().call()
                        app.requiredSignatures = await contract.methods.consensusThreshold().call()
                        app.mintedTrees = await contract.methods.totalSupply().call()
                        console.log("Is account member?", app.isMember)
                    }
                } catch (e) {
                    console.log("USER_CONNECT", e.message)
                }
            } else {
                try {
                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [
                            {
                                chainId: "0x" + Number(app.network).toString(16),
                            },
                        ],
                    })
                    setTimeout(function () {
                        app.connect()
                    }, 100)
                } catch (e) {
                    // ADD WALLABY IF NOT FOUND
                    if (
                        e.message ===
                        'Unrecognized chain ID "0x7ab7". Try adding the chain using wallet_addEthereumChain first.'
                    ) {
                        app.network = 31415
                        try {
                            await window.ethereum.request({
                                method: "wallet_addEthereumChain",
                                params: [
                                    {
                                        chainId: "0x" + Number(app.network).toString(16),
                                        blockExplorerUrls: ["https://wallaby.filscan.io"],
                                        chainName: "Filecoin — Wallaby testnet",
                                        nativeCurrency: {
                                            decimals: 18,
                                            name: "Filecoin — Wallaby testnet",
                                            symbol: "tFIL",
                                        },
                                        rpcUrls: ["https://wallaby.node.glif.io/rpc/v0"],
                                    },
                                ],
                            })
                            setTimeout(function () {
                                app.connect()
                            }, 100)
                        } catch (e) {
                            console.log("Can't add Wallaby network, please do it manually.")
                        }
                    } else {
                        alert("Can't switch network, please do it manually.")
                    }
                }
            }
        },
        modalTree() {
            const app = this
            app.isCreate = true
        },
        closeModal() {
            const app = this
            app.isCreate = false
        },
    },
}
</script>
