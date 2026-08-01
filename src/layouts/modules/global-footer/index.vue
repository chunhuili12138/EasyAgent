<script setup lang="ts">
defineOptions({
  name: 'GlobalFooter'
});

const currentYear = new Date().getFullYear();
</script>

<template>
  <DarkModeContainer class="h-full flex-center">
    <span>Copyright © {{ currentYear }} EasyAgent</span>
  </DarkModeContainer>
</template>

<style scoped></style>
