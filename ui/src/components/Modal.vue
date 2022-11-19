<template>
    <div v-if="isCreate" class="modal-overlay">
        <div class="modal-container">
            <div class="modal-header">
                <div
                    class="modal-header-button"
                    @click="$emit('closeModal'), (activeStep = 0)"
                    style="cursor: pointer"
                >
                    <i class="fa-solid fa-xmark"></i>
                </div>
                <h3><b>Tree Registration</b></h3>
            </div>
            <div class="modal-content">
                <div class="pt-6">
                    <b-steps v-model="activeStep" animated :rounded="false" :has-navigation="false">
                        <!-- FORM DATA  -->
                        <b-step-item step="1" icon-pack="fa" icon="check" label="Info">
                            <div class="py-6">
                                <div class="columns">
                                    <div class="column">
                                        <b-field label="Title" vertical>
                                            <b-input
                                                type="text"
                                                placeholder="MyTree"
                                                maxlength="30"
                                                v-model="title"
                                            >
                                            </b-input>
                                        </b-field>
                                    </div>
                                    <div class="column">
                                        <b-field label="Tree Status">
                                            <b-select placeholder="Select a status" expanded>
                                                <option
                                                    v-for="(status, index) in statusTree"
                                                    :key="index"
                                                    :value="status"
                                                >
                                                    {{ status }}
                                                </option>
                                            </b-select>
                                        </b-field>
                                    </div>
                                </div>

                                <b-field label="Description" vertical>
                                    <b-input
                                        rows="2"
                                        type="textarea"
                                        placeholder=" Banana is a plant belonging to the Musaceae family"
                                        maxlength="30"
                                        v-model="description"
                                    >
                                    </b-input>
                                </b-field>

                                <div class="columns">
                                    <div class="column">
                                        <b-field label="Latitude" vertical>
                                            <b-input
                                                type="number"
                                                placeholder="54.222456"
                                                maxlength="8"
                                                v-model="lat"
                                            >
                                            </b-input>
                                        </b-field>
                                    </div>
                                    <div class="column">
                                        <b-field label="Longitude" vertical>
                                            <b-input
                                                type="number"
                                                placeholder="12.123445"
                                                maxlength="8"
                                                v-model="long"
                                            >
                                            </b-input>
                                        </b-field>
                                    </div>
                                </div>
                                <div class="btn-primary mt-4 mb-4" @click="addTree()">
                                    <i class="fa-solid fa-tree mr-3"></i>Add Tree
                                </div>
                            </div>
                        </b-step-item>
                        <!--END | FORM DATA  -->

                        <!-- PENDING -->
                        <b-step-item step="2" label="Pending" icon-pack="fa" icon="check">
                            <div class="py-6 has-text-centered">
                                <Loader />
                                <h2 class="mt-4 mb-4">
                                    Registering your Tree, <br />please wait...
                                </h2>
                            </div>
                        </b-step-item>
                        <!-- END PENDING -->

                        <!-- COMPLETED -->
                        <b-step-item step="3" label="Completed" icon-pack="fa" icon="check">
                            <div class="py-6 has-text-centered">
                                <div class="icon-status">
                                    <i class="fa-solid fa-check"></i>
                                </div>
                                <h2 class="mt-4 mb-4">
                                    Your tree is registered <br />
                                    successfully
                                </h2>

                                <div class="mt-6 mb-2">
                                    <div
                                        @click="$emit('closeModal'), (activeStep = 0)"
                                        class="btn-primary"
                                    >
                                        Close
                                    </div>
                                </div>
                            </div>
                        </b-step-item>
                        <!-- END COMPLETED -->
                    </b-steps>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import Loader from "@/components/Loader.vue"
export default {
    name: "custom-modal",
    props: ["isCreate"],
    components: {
        Loader,
    },
    data() {
        return {
            activeStep: 0,
            pendingTx: "",
            explorer: "",
            receipt: "",
            // FORM
            title: "",
            description: "",
            statusTree: ["seeding", "planting", "sprouting"],
            long: 0,
            lat: 0,
        }
    },
    methods: {
        addTree() {
            const app = this
            app.activeStep = 1
            setTimeout(function () {
                app.activeStep = 2
            }, 5000)
        },
    },
}
</script>
