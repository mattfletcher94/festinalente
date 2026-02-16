<script setup lang="ts">
import { ref } from 'vue';
import ProjectPicker from './components/ProjectPicker.vue';
import TerminalPanel from './components/TerminalPanel.vue';

const projectPath = ref<string | null>(null);
</script>

<template>
  <div class="h-screen w-screen dark">
    <TerminalPanel v-if="projectPath" :project-path="projectPath" />
    <ProjectPicker v-else @selected="projectPath = $event" />
  </div>
</template>
