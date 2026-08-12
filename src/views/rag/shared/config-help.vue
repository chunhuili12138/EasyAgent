<script setup lang="ts">
import { ref } from 'vue';

defineOptions({ name: 'ConfigHelp' });

type ConfigGuide = {
  title: string;
  purpose: string;
  fields: string[];
  output: string;
  example?: string;
};

type ConfigParameter = {
  name: string;
  description: string;
  example?: string;
  required?: boolean;
};

withDefaults(
  defineProps<{
    title: string;
    description: string;
    steps?: string[];
    guides?: ConfigGuide[];
    parameters?: ConfigParameter[];
    rules?: string[];
    examples?: string[];
    effects?: string[];
    notes?: string[];
    field?: boolean;
  }>(),
  {
    steps: () => [],
    guides: () => [],
    parameters: () => [],
    rules: () => [],
    examples: () => [],
    effects: () => [],
    notes: () => [],
    field: false
  }
);

const visible = ref(false);
</script>

<template>
  <span class="config-help">
    <ElTooltip :content="title" placement="top">
      <ElButton
        text
        circle
        :class="field ? 'config-help__field' : 'config-help__panel'"
        :aria-label="title"
        @click.stop="visible = true"
      >
        <SvgIcon icon="mdi:help-circle-outline" />
      </ElButton>
    </ElTooltip>
    <ElDrawer
      v-model="visible"
      :title="title"
      :size="field ? 'min(480px, 94vw)' : 'min(560px, 94vw)'"
      append-to-body
      destroy-on-close
    >
      <div class="config-help__content text-sm leading-6 space-y-6">
      <section>
        <div class="mb-2 text-gray-800 font-medium">
          {{ $t('rag.help.description') }}
        </div>
        <div class="whitespace-pre-wrap text-gray-600">{{ description }}</div>
      </section>
      <section v-if="steps.length">
        <div class="mb-2 text-gray-800 font-medium">
          {{ $t('rag.help.steps') }}
        </div>
        <ol class="config-help__steps text-gray-600 space-y-3">
          <li v-for="(step, index) in steps" :key="step">
            <span class="config-help__step-index">{{ index + 1 }}</span>
            <span>{{ step }}</span>
          </li>
        </ol>
      </section>
      <section v-if="guides.length">
        <div class="mb-3 text-gray-800 font-medium">
          {{ $t('rag.help.stepTypes') }}
        </div>
        <div class="config-help__guides space-y-5">
          <section v-for="guide in guides" :key="guide.title" class="config-help__guide">
            <div class="mb-1 text-gray-800 font-medium">{{ guide.title }}</div>
            <div class="mb-2 text-gray-600">{{ guide.purpose }}</div>
            <div class="mb-1 text-xs text-gray-500 font-medium">
              {{ $t('rag.help.howToConfigure') }}
            </div>
            <ul class="mb-2 list-disc pl-5 text-gray-600 space-y-1">
              <li v-for="guideField in guide.fields" :key="guideField">
                {{ guideField }}
              </li>
            </ul>
            <div class="mb-1 text-xs text-gray-500 font-medium">
              {{ $t('rag.help.stepOutput') }}
            </div>
            <div class="mb-2 text-gray-600">{{ guide.output }}</div>
            <template v-if="guide.example">
              <div class="mb-1 text-xs text-gray-500 font-medium">
                {{ $t('rag.help.exampleConfig') }}
              </div>
              <pre class="overflow-x-auto border rounded bg-gray-50 p-3 text-xs font-mono">{{ guide.example }}</pre>
            </template>
          </section>
        </div>
      </section>
      <section v-if="parameters.length">
        <div class="mb-3 text-gray-800 font-medium">
          {{ $t('rag.help.parameters') }}
        </div>
        <div class="space-y-3">
          <section v-for="parameter in parameters" :key="parameter.name" class="border rounded p-3">
            <div class="mb-1 flex items-center gap-2">
              <span class="text-gray-800 font-medium">{{ parameter.name }}</span>
              <ElTag size="small" :type="parameter.required ? 'danger' : 'info'">
                {{ $t(parameter.required ? 'rag.help.required' : 'rag.help.optional') }}
              </ElTag>
            </div>
            <div class="whitespace-pre-wrap text-gray-600">
              {{ parameter.description }}
            </div>
            <div v-if="parameter.example" class="mt-2 text-xs">
              <span class="text-gray-500">{{ $t('rag.help.exampleValue') }}：</span>
              <code class="break-all rounded bg-gray-50 px-1.5 py-1">{{ parameter.example }}</code>
            </div>
          </section>
        </div>
      </section>
      <section v-if="rules.length">
        <div class="mb-2 text-gray-800 font-medium">
          {{ $t('rag.help.rules') }}
        </div>
        <ul class="list-disc pl-5 text-gray-600 space-y-2">
          <li v-for="rule in rules" :key="rule">{{ rule }}</li>
        </ul>
      </section>
      <section v-if="examples.length">
        <div class="mb-2 text-gray-800 font-medium">
          {{ $t('rag.help.examples') }}
        </div>
        <pre
          v-for="example in examples"
          :key="example"
          class="mb-3 overflow-x-auto border rounded bg-gray-50 p-3 text-xs font-mono"
          >{{ example }}</pre
        >
      </section>
      <section v-if="effects.length">
        <div class="mb-2 text-gray-800 font-medium">
          {{ $t('rag.help.effects') }}
        </div>
        <ul class="list-disc pl-5 text-gray-600 space-y-2">
          <li v-for="effect in effects" :key="effect">{{ effect }}</li>
        </ul>
      </section>
      <section v-if="notes.length">
        <div class="mb-2 text-gray-800 font-medium">
          {{ $t('rag.help.notes') }}
        </div>
        <ul class="list-disc pl-5 text-gray-600 space-y-2">
          <li v-for="note in notes" :key="note">{{ note }}</li>
        </ul>
      </section>
      </div>
    </ElDrawer>
  </span>
</template>

<style scoped>
.config-help__field {
  width: 22px;
  height: 22px;
  margin-left: 3px;
  color: var(--el-color-info);
  vertical-align: middle;
}

.config-help {
  display: inline-flex;
  align-items: center;
}

.config-help__panel {
  position: absolute;
  top: 4px;
  right: 48px;
  width: 40px;
  height: 40px;
  margin: 0;
  font-size: 19px;
  color: var(--el-color-primary);
}

.config-help__content {
  padding-bottom: 16px;
  overflow-wrap: anywhere;
}

.config-help__steps {
  margin: 0;
  padding: 0;
  list-style: none;
}

.config-help__steps li {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  gap: 8px;
  align-items: start;
}

.config-help__guide {
  padding-left: 12px;
  border-left: 3px solid var(--el-color-primary-light-7);
}

.config-help__step-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-top: 1px;
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 1;
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 50%;
}
</style>
