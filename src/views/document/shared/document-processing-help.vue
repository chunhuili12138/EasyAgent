<script setup lang="ts">
import { computed } from 'vue';
import { $t } from '@/locales';

defineOptions({ name: 'DocumentProcessingHelp' });

const props = defineProps<{
  modelValue: boolean;
  topic: 'parse' | 'process';
}>();
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>();

const topicKeys = {
  parse: {
    title: 'page.manage.parse.helpTitle',
    intro: 'page.manage.parse.helpIntro',
    workflow: 'page.manage.parse.helpWorkflow',
    evidence: 'page.manage.parse.helpEvidence',
    actions: 'page.manage.parse.helpActions',
    notes: 'page.manage.parse.helpNotes'
  },
  process: {
    title: 'page.manage.process.helpTitle',
    intro: 'page.manage.process.helpIntro',
    workflow: 'page.manage.process.helpWorkflow',
    evidence: 'page.manage.process.helpEvidence',
    actions: 'page.manage.process.helpActions',
    notes: 'page.manage.process.helpNotes'
  }
} as const;

const content = computed(() => {
  const keys = topicKeys[props.topic];
  return {
    title: $t(keys.title),
    intro: $t(keys.intro),
    workflow: $t(keys.workflow),
    evidence: $t(keys.evidence),
    actions: $t(keys.actions),
    notes: $t(keys.notes)
  };
});
</script>

<template>
  <ElDrawer
    :model-value="modelValue"
    :title="content.title"
    size="min(560px, 94vw)"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="document-help">
      <ElAlert type="info" :closable="false" :title="content.intro" show-icon />
      <section>
        <h3>{{ $t('page.manage.parse.guideWorkflow') }}</h3>
        <p>{{ content.workflow }}</p>
      </section>
      <section>
        <h3>{{ $t('page.manage.parse.guideEvidence') }}</h3>
        <p>{{ content.evidence }}</p>
      </section>
      <section>
        <h3>{{ $t('page.manage.parse.guideActions') }}</h3>
        <p>{{ content.actions }}</p>
      </section>
      <section>
        <h3>{{ $t('page.manage.parse.guideNotes') }}</h3>
        <p>{{ content.notes }}</p>
      </section>
    </div>
  </ElDrawer>
</template>

<style scoped>
.document-help {
  display: grid;
  gap: 20px;
}

.document-help section {
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.document-help h3 {
  margin: 0 0 8px;
  font-size: 14px;
  letter-spacing: 0;
}

.document-help p {
  margin: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.75;
  white-space: pre-line;
}
</style>
