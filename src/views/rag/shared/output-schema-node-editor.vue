<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'OutputSchemaNodeEditor' });

type SchemaNode = Record<string, any>;

const props = withDefaults(
  defineProps<{
    modelValue: SchemaNode;
    showName?: boolean;
    depth?: number;
    maxDepth?: number;
  }>(),
  { showName: true, depth: 1, maxDepth: 5 }
);

const emit = defineEmits<{ remove: [] }>();
const node = computed(() => props.modelValue);
const types = ['string', 'integer', 'number', 'boolean', 'array', 'object'];

function createNode() {
  return {
    key: `schema-node-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: '',
    type: 'string',
    description: '',
    required: false,
    enumValues: [],
    format: '',
    pattern: '',
    minLength: undefined,
    maxLength: undefined,
    minimum: undefined,
    maximum: undefined,
    minItems: undefined,
    maxItems: undefined,
    uniqueItems: false,
    additionalProperties: false,
    properties: [],
    items: undefined
  };
}

function ensureChildren(target: SchemaNode) {
  if (!Array.isArray(target.properties)) target.properties = [];
}

function ensureItems(target: SchemaNode) {
  if (!target.items || typeof target.items !== 'object') target.items = createNode();
}

function onTypeChange(value: string) {
  node.value.type = value;
  if (value === 'object') ensureChildren(node.value);
  if (value === 'array') ensureItems(node.value);
}

function addProperty() {
  ensureChildren(node.value);
  node.value.properties.push(createNode());
}
</script>

<template>
  <div class="schema-node" :class="{ 'schema-node--nested': depth > 1 }">
    <div class="schema-node__grid">
      <ElFormItem v-if="showName" :label="$t('rag.skill.outputSchemaFieldName')">
        <ElInput v-model="node.name" />
      </ElFormItem>
      <ElFormItem :label="showName ? $t('rag.skill.outputSchemaFieldType') : $t('rag.skill.outputSchemaArrayItemType')">
        <ElSelect :model-value="node.type" class="w-full" @update:model-value="onTypeChange">
          <ElOption v-for="type in types" :key="type" :label="type" :value="type" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="showName" :label="$t('rag.skill.outputSchemaFieldDescription')">
        <ElInput v-model="node.description" />
      </ElFormItem>
      <ElFormItem v-if="showName" :label="$t('rag.skill.outputSchemaFieldRequired')">
        <ElCheckbox v-model="node.required" />
      </ElFormItem>
      <ElButton v-if="showName" text circle type="danger" :title="$t('common.delete')" @click="emit('remove')">
        <SvgIcon icon="mdi:close" />
      </ElButton>
    </div>

    <div v-if="['string', 'integer', 'number'].includes(node.type)" class="schema-node__rules">
      <ElFormItem :label="$t('rag.skill.outputSchemaEnum')">
        <ElSelect v-model="node.enumValues" multiple filterable allow-create default-first-option class="w-full" :placeholder="$t('rag.skill.outputSchemaEnumHint')" />
      </ElFormItem>
      <template v-if="node.type === 'string'">
        <ElFormItem :label="$t('rag.skill.outputSchemaFormat')"><ElInput v-model="node.format" placeholder="date-time" /></ElFormItem>
        <ElFormItem :label="$t('rag.skill.outputSchemaPattern')"><ElInput v-model="node.pattern" placeholder="^SO[0-9]{12}$" /></ElFormItem>
        <ElFormItem :label="$t('rag.skill.outputSchemaMinLength')"><ElInputNumber v-model="node.minLength" :min="0" class="w-full" /></ElFormItem>
        <ElFormItem :label="$t('rag.skill.outputSchemaMaxLength')"><ElInputNumber v-model="node.maxLength" :min="0" class="w-full" /></ElFormItem>
      </template>
      <template v-else>
        <ElFormItem :label="$t('rag.skill.outputSchemaMinimum')"><ElInputNumber v-model="node.minimum" class="w-full" /></ElFormItem>
        <ElFormItem :label="$t('rag.skill.outputSchemaMaximum')"><ElInputNumber v-model="node.maximum" class="w-full" /></ElFormItem>
      </template>
    </div>

    <template v-if="node.type === 'object'">
      <div class="schema-node__children-head">
        <span>{{ $t('rag.skill.outputSchemaChildFields') }}</span>
        <ElCheckbox :model-value="node.additionalProperties === true" @update:model-value="node.additionalProperties = $event">{{ $t('rag.skill.outputSchemaAdditionalProperties') }}</ElCheckbox>
        <ElButton size="small" plain type="primary" :disabled="depth >= maxDepth" @click="addProperty">
          <SvgIcon icon="mdi:plus" class="mr-1" />{{ $t('rag.skill.outputSchemaAddChildField') }}
        </ElButton>
      </div>
      <ElAlert v-if="depth >= maxDepth" type="info" :closable="false" :title="$t('rag.skill.outputSchemaMaxDepthHint', { count: maxDepth })" />
      <OutputSchemaNodeEditor
        v-for="(child, index) in node.properties"
        :key="child.key"
        :model-value="child"
        :depth="depth + 1"
        :max-depth="maxDepth"
        @remove="node.properties.splice(index, 1)"
      />
    </template>

    <template v-if="node.type === 'array'">
      <div class="schema-node__rules">
        <ElFormItem :label="$t('rag.skill.outputSchemaMinItems')"><ElInputNumber v-model="node.minItems" :min="0" class="w-full" /></ElFormItem>
        <ElFormItem :label="$t('rag.skill.outputSchemaMaxItems')"><ElInputNumber v-model="node.maxItems" :min="0" class="w-full" /></ElFormItem>
        <ElFormItem :label="$t('rag.skill.outputSchemaUniqueItems')"><ElCheckbox v-model="node.uniqueItems" /></ElFormItem>
      </div>
      <div class="schema-node__item"><span>{{ $t('rag.skill.outputSchemaArrayItems') }}</span></div>
      <OutputSchemaNodeEditor v-if="node.items" :model-value="node.items" :show-name="false" :depth="depth + 1" :max-depth="maxDepth" />
    </template>
  </div>
</template>

<style scoped>
.schema-node { padding: 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; }
.schema-node--nested { margin-top: 10px; background: var(--el-fill-color-lighter); }
.schema-node__grid, .schema-node__rules { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px 12px; align-items: end; }
.schema-node__grid :deep(.el-form-item), .schema-node__rules :deep(.el-form-item) { margin-bottom: 0; }
.schema-node__children-head { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 12px; font-size: 13px; font-weight: 500; }
.schema-node__children-head .el-button { margin-left: auto; }
.schema-node__item { margin-top: 12px; font-size: 13px; font-weight: 500; }
@media (max-width: 640px) { .schema-node__grid, .schema-node__rules { grid-template-columns: 1fr; } .schema-node__children-head .el-button { margin-left: 0; } }
</style>
