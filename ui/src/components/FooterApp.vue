<template>
    <div class="p-bottom is-flex is-align-items-center is-justify-content-space-between py-3 px-6">
        <div>
            <p>
                Developer with ❤️ by <a href="https://yomi.digital" target="_blank"><b>YOMI</b></a>
            </p>
        </div>
        <div>
            <a
                href="https://github.com/yomi-digital/caratodao-decentralized-tree-registry"
                target="_blank"
                ><i class="fa-brands fa-github mr-2"></i>Watch the repository on GitHub</a
            >
        </div>
    </div>
</template>
<script>
export default {
    name: "app-footer",
}
</script>

<style lang="scss" scoped>
a {
    color: var(--primary-color);
    &:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
    }
    i {
        font-size: 1.3rem;
    }
}
</style>
