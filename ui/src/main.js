import Vue from "vue"

import App from "./App.vue"
import router from "./router"
import Buefy from "buefy"
import Gravatar from "vue-gravatar"

import "buefy/dist/buefy.css"
import "./themes/style.scss"
import "./themes/colors.scss"

Vue.use(Buefy)
Vue.component("v-gravatar", Gravatar)

new Vue({
    router,
    render: (h) => h(App),
}).$mount("#app")
