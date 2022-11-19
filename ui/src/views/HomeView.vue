<template>
    <div>
        <Navbar @connect="connect()" :account="account" :network="network" />
        <div class="gap-navbar"></div>
        <div class="container mt-6">
            <div class="columns">
                <div class="column is-5">
                    <div>
                        <h1 class="">WebTree</h1>
                        <p>
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                            commodo consequat.
                        </p>
                    </div>
                    <!-- ALERT BANNER NO ACCOUNT -->
                    <div class="mt-6" v-if="!account">
                        <div class="alert-banner py-3 px-4">
                            <div class="container">
                                <p>
                                    <i class="fa-solid fa-circle-exclamation mr-3"></i>
                                    <b> You have to connect with your wallet to add a tree</b>
                                </p>
                            </div>
                        </div>
                    </div>
                    <!-- END | ALERT BANNER NO ACCOUNT -->
                </div>
                <div class="column is-7">
                    <Gmap :account="account" @modalTree="modalTree()" />
                </div>
            </div>
        </div>
        <Modal :isCreate="isCreate" @closeModal="closeModal()" />
    </div>
</template>

<script>
import Modal from "@/components/Modal.vue"
import Navbar from "@/components/Navbar.vue"
import Gmap from "@/components/Gmaps.vue"
import Web3 from "web3"
import Web3Modal from "web3modal"
export default {
    name: "home-app",
    data() {
        return {
            account: "",
            web3: "",
            network: 18,
            abi: "",
            balance: "",
            isCreate: false,
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
