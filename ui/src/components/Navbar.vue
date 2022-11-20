<template>
    <div class="custom-navbar">
        <!-- Blockchain contract -->
        <div class="is-flex is-align-items-center is-justify-content-space-between">
            <img src="../assets/img/metamask.png" class="mr-3" alt="" />
            <p>
                <b>
                    <span v-if="parseInt(network) === 18">Wallaby</span>
                </b>
            </p>
            <i
                class="fa-solid fa-circle ml-3"
                :class="{
                    'color-secondary': account,
                    'color-error': !account,
                }"
            ></i>
        </div>
        <!-- END |  Blockchain contract -->
        <div class="is-flex is-align-items-center ml-3">
            <v-gravatar v-if="account" class="gravatar-nav" :email="account" :size="30" />
            <p v-if="account" class="ml-3">
                {{ account.substr(0, 6) + "..." + account.substr(-6) }}
            </p>
            <p v-if="!account">Not Connected</p>
        </div>

        <div class="mr-6">
            <div v-if="!account" class="btn-primary ml-3" @click="$emit('connect')">CONNECT</div>
        </div>
    </div>
</template>

<script>
import checkViewport from "@/mixins/checkViewport"

export default {
    name: "app-navbar",
    mixins: [checkViewport],
    props: ["account", "network"],
}
</script>
