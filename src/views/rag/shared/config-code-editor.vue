<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { EditorView, basicSetup } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { yaml as yamlLanguage } from '@codemirror/lang-yaml';
import { type Diagnostic, lintGutter, linter } from '@codemirror/lint';
import { parse, stringify } from 'yaml';
import { $t } from '@/locales';

defineOptions({ name: 'ConfigCodeEditor' });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    language?: 'json' | 'yaml';
    rows?: number;
    example?: string;
    expectedRoot?: 'object' | 'array';
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    language: 'json',
    rows: 8,
    example: '',
    expectedRoot: undefined,
    disabled: false
  }
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  validityChange: [valid: boolean];
}>();

const host = ref<HTMLElement>();
const errorMessage = ref('');
let view: EditorView | undefined;
let lastValid: boolean | undefined;

function parseContent(value: string) {
  if (!value.trim()) return undefined;
  return props.language === 'yaml' ? parse(value) : JSON.parse(value);
}

function validate(viewState: EditorView): Diagnostic[] {
  const value = viewState.state.doc.toString();
  if (!value.trim()) {
    errorMessage.value = '';
    updateValidity(true);
    return [];
  }
  try {
    const parsed = parseContent(value);
    if (props.expectedRoot === 'array' && !Array.isArray(parsed)) throw new Error($t('rag.editor.arrayRequired'));
    if (
      props.expectedRoot === 'object' &&
      (parsed === null || parsed === undefined || Array.isArray(parsed) || typeof parsed !== 'object')
    ) {
      throw new Error($t('rag.editor.objectRequired'));
    }
    errorMessage.value = '';
    updateValidity(true);
    return [];
  } catch (error: any) {
    updateValidity(false);
    const position = error?.pos?.[0] ?? positionFromJsonError(error?.message, value.length);
    const safePosition = Math.max(0, Math.min(position, value.length));
    const line = viewState.state.doc.lineAt(safePosition);
    errorMessage.value = $t('rag.editor.errorDetail', {
      line: line.number,
      column: safePosition - line.from + 1,
      message: error?.message || $t('rag.editor.invalidContent')
    });
    return [
      {
        from: safePosition,
        to: Math.max(1, Math.min(position + 1, value.length)),
        severity: 'error',
        message: error?.message || $t('rag.editor.invalidContent')
      }
    ];
  }
}

function positionFromJsonError(message: string | undefined, fallback: number) {
  const match = message?.match(/position\s+(\d+)/i);
  return match ? Number(match[1]) : Math.max(0, fallback - 1);
}

function updateValidity(valid: boolean) {
  if (lastValid === valid) return;
  lastValid = valid;
  emit('validityChange', valid);
}

function createEditor() {
  if (!host.value) return;
  view = new EditorView({
    doc: props.modelValue || '',
    parent: host.value,
    extensions: [
      basicSetup,
      props.language === 'yaml' ? yamlLanguage() : json(),
      lintGutter(),
      linter(validate),
      EditorView.lineWrapping,
      EditorView.editable.of(!props.disabled),
      EditorView.updateListener.of(update => {
        if (update.docChanged) emit('update:modelValue', update.state.doc.toString());
      }),
      EditorView.theme({
        '&': {
          minHeight: `${props.rows * 21}px`,
          maxHeight: `${Math.max(props.rows * 28, 240)}px`
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'var(--el-font-family-monospace, Consolas, monospace)'
        },
        '.cm-content': { fontSize: '13px' },
        '.cm-gutters': {
          backgroundColor: 'var(--el-fill-color-light)',
          color: 'var(--el-text-color-secondary)'
        },
        '&.cm-focused': { outline: '1px solid var(--el-color-primary)' }
      })
    ]
  });
  validate(view);
}

function replaceContent(value: string) {
  if (!view || value === view.state.doc.toString()) return;
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: value }
  });
}

function formatContent() {
  try {
    const parsed = parseContent(view?.state.doc.toString() || '');
    if (parsed === undefined) return;
    replaceContent(props.language === 'yaml' ? stringify(parsed) : JSON.stringify(parsed, null, 2));
  } catch (error: any) {
    ElMessage.warning(error?.message || $t('rag.editor.invalidContent'));
  }
}

function useExample() {
  if (!props.example) return;
  try {
    const parsed = props.language === 'yaml' ? parse(props.example) : JSON.parse(props.example);
    replaceContent(props.language === 'yaml' ? stringify(parsed) : JSON.stringify(parsed, null, 2));
  } catch {
    replaceContent(props.example);
  }
}

watch(
  () => props.modelValue,
  value => replaceContent(value || '')
);
onMounted(createEditor);
onBeforeUnmount(() => view?.destroy());
</script>

<template>
  <div class="config-code-editor w-full">
    <div class="mb-2 flex justify-end gap-2">
      <ElButton size="small" @click="formatContent">
        <SvgIcon icon="mdi:format-align-left" />
        {{ $t('rag.editor.format') }}
      </ElButton>
      <ElButton v-if="example" size="small" @click="useExample">
        <SvgIcon icon="mdi:file-document-outline" />
        {{ $t('rag.editor.useExample') }}
      </ElButton>
    </div>
    <div ref="host" class="config-code-editor__host overflow-hidden border rounded border-solid" />
    <div v-if="errorMessage" class="mt-1 text-xs text-red-500" role="alert">
      {{ errorMessage }}
    </div>
    <div class="mt-1 text-xs text-gray-500">
      {{ $t(`rag.editor.${language}Hint`) }}
    </div>
  </div>
</template>

<style scoped>
.config-code-editor__host {
  border-color: var(--el-border-color);
  background: var(--el-bg-color);
}
</style>
