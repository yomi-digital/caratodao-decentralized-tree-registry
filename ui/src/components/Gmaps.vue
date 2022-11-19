<template>
    <div>
        <div class="card-map p-3">
            <div id="map">ddd</div>
            <div class="p-3 btn-tree">
                <button :disabled="!account" class="btn-primary" @click="$emit('modalTree')">
                    <i class="fa-solid fa-tree mr-3"></i>Add Tree
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "GoogleMap",
    props: ["account"],
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
                center: { lat: 54.525961, lng: 15.255119 },
                zoom: 4,
            })
            console.log("What is this?", app.map)
        },
        fetchMarker() {
            const app = this
            console.log("adding markers")
            const markers = [
                { lat: 54.525961, lng: 11.255119 },
                { lat: 51.525111, lng: 12.255122 },
                { lat: 52.525222, lng: 13.255121 },
                { lat: 53.525333, lng: 14.255122 },
                { lat: 55.525965, lng: 15.255123 },
                { lat: 56.525966, lng: 16.255124 },
                { lat: 57.525967, lng: 17.255125 },
                { lat: 58.525968, lng: 18.255126 },
                { lat: 59.525969, lng: 19.255127 },
            ]
            for (let k in markers) {
                const image = {
                    url: "https://nftstorage.link/ipfs/bafkreid4vhexjyn5wbdg24bnlbc6l3gxuq5e4adh7u4bjjzge3dg77jdea",
                    scaledSize: new app.google.maps.Size(25, 25),
                }
                let marker = new app.google.maps.Marker({
                    position: markers[k],
                    title: "Hello World!",
                    icon: image,
                })
                marker.setMap(app.map)
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
