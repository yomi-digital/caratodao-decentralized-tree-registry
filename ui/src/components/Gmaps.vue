<template>
    <div>
        <div class="card-map p-3">
            <div id="map"></div>
            <div class="p-3 btn-tree">
                <button :disabled="!account" v-if="isMember" class="btn-primary" @click="$emit('modalTree')">
                    <i class="fa-solid fa-tree mr-3"></i>Add Tree
                </button>
                <button :disabled="!account" v-if="!isMember" class="btn-primary" @click="$emit('modalTree')">
                    <i class="fa-solid fa-tree mr-3"></i>Propose Tree
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import axios from "axios"

export default {
    name: "GoogleMap",
    props: ["account", "isMember"],
    data() {
        return {
            google: window.google,
            map: {},
        }
    },
    mounted() {
        this.initMap()
        this.fetchMarker()
    },
    methods: {
        initMap() {
            const app = this
            app.map = new app.google.maps.Map(document.getElementById("map"), {
                center: { lat: 36.9009558, lng: 14.5880332 },
                zoom: 10,
            })
            console.log("Map created:", app.map)
        },
        async fetchMarker() {
            const app = this
            console.log("adding markers")
            const trees = await axios.get("https://carato-api.yomi.ninja/trees")
            console.log("Serverless response:", trees.data)
            let markers = []
            let infoWindows = []
            for (let k in trees.data) {
                const tree = trees.data[k].details
                const coords = tree.coordinates.split(",")
                markers.push({ lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) })
                const content = '<div id="content">' +
                    '<div id="bodyContent">' +
                    "<p>" +
                    "<b>Planting date</b>: " + tree.plantingDate + "<br>" +
                    "<b>Description</b>: " + tree.details + "<br>" +
                    "<b>Status</b>: " + tree.status + "<br>" +
                    "<b>Minted</b>: " + trees.data[k].minted + "<br>" +
                    "</p>" +
                    "</div>" +
                    "</div>"
                infoWindows.push(content)
            }
            console.log("Markers:", markers)
            for (let k in markers) {
                const image = {
                    url: "https://nftstorage.link/ipfs/bafkreid4vhexjyn5wbdg24bnlbc6l3gxuq5e4adh7u4bjjzge3dg77jdea",
                    scaledSize: new app.google.maps.Size(25, 25),
                }

                const infowindow = new google.maps.InfoWindow({
                    content: infoWindows[k],
                    ariaLabel: "Tree",
                });

                let marker = new app.google.maps.Marker({
                    position: markers[k],
                    title: "Tree",
                    icon: image,
                })
                marker.setMap(app.map)
                marker.addListener("click", () => {
                    infowindow.open({
                        anchor: marker,
                        map,
                    });
                });
            }
        },
    },
}
</script>

<style scoped>
#map {
    height: 100%;
    min-height: 500px;
    width: 100%;
    border-radius: 12px;
}
</style>
