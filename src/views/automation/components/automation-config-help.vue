<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';

defineOptions({ name: 'AutomationConfigHelp' });

const props = defineProps<{
  modelValue: boolean;
  topic: 'workflow' | 'trigger' | 'runtime' | 'log' | 'failure' | 'event' | 'statistics';
}>();
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>();
const t = $t;
const topicKeys = {
  workflow: {
    title: 'automation.help.workflowTitle',
    intro: 'automation.help.workflowIntro',
    steps: 'automation.help.workflowSteps',
    fields: 'automation.help.workflowFields',
    example: 'automation.help.workflowExample',
    note: 'automation.help.workflowNote'
  },
  trigger: {
    title: 'automation.help.triggerTitle',
    intro: 'automation.help.triggerIntro',
    steps: 'automation.help.triggerSteps',
    fields: 'automation.help.triggerFields',
    example: 'automation.help.triggerExample',
    note: 'automation.help.triggerNote'
  },
  runtime: {
    title: 'automation.help.runtimeTitle',
    intro: 'automation.help.runtimeIntro',
    steps: 'automation.help.runtimeSteps',
    fields: 'automation.help.runtimeFields',
    example: 'automation.help.runtimeExample',
    note: 'automation.help.runtimeNote'
  },
  log: {
    title: 'automation.help.logTitle',
    intro: 'automation.help.logIntro',
    steps: 'automation.help.logSteps',
    fields: 'automation.help.logFields',
    example: 'automation.help.logExample',
    note: 'automation.help.logNote'
  },
  failure: {
    title: 'automation.help.failureTitle',
    intro: 'automation.help.failureIntro',
    steps: 'automation.help.failureSteps',
    fields: 'automation.help.failureFields',
    example: 'automation.help.failureExample',
    note: 'automation.help.failureNote'
  },
  event: {
    title: 'automation.help.eventTitle',
    intro: 'automation.help.eventIntro',
    steps: 'automation.help.eventSteps',
    fields: 'automation.help.eventFields',
    example: 'automation.help.eventExample',
    note: 'automation.help.eventNote'
  },
  statistics: {
    title: 'automation.help.statisticsTitle',
    intro: 'automation.help.statisticsIntro',
    steps: 'automation.help.statisticsSteps',
    fields: 'automation.help.statisticsFields',
    example: 'automation.help.statisticsExample',
    note: 'automation.help.statisticsNote'
  }
} as const;

const content = computed(() => {
  const keys = topicKeys[props.topic];
  return {
    title: t(keys.title),
    intro: t(keys.intro),
    steps: t(keys.steps),
    fields: t(keys.fields),
    example: t(keys.example),
    note: t(keys.note)
  };
});
</script>

<template>
  <ElDrawer
    :model-value="modelValue"
    :title="content.title"
    size="520px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="help-content">
      <ElAlert type="info" :closable="false" :title="content.intro" show-icon />
      <section>
        <h3>{{ t('automation.help.stepsTitle') }}</h3>
        <p>{{ content.steps }}</p>
      </section>
      <section>
        <h3>{{ t('automation.help.fieldsTitle') }}</h3>
        <p>{{ content.fields }}</p>
      </section>
      <section>
        <h3>{{ t('automation.help.examplesTitle') }}</h3>
        <pre>{{ content.example }}</pre>
      </section>
      <section>
        <h3>{{ t('automation.help.notesTitle') }}</h3>
        <p>{{ content.note }}</p>
      </section>
    </div>
  </ElDrawer>
</template>

<style scoped>
.help-content {
  display: grid;
  gap: 20px;
}
.help-content section {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 16px;
}
.help-content h3 {
  margin: 0 0 8px;
  font-size: 14px;
  letter-spacing: 0;
}
.help-content p,
.help-content pre {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.75;
  white-space: pre-line;
}
.help-content pre {
  overflow: auto;
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 6px;
  background: var(--el-fill-color-light);
  font-family: Consolas, 'Courier New', monospace;
  white-space: pre-wrap;
}
</style>
