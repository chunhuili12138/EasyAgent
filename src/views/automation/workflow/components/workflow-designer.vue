<script setup lang="ts">
import { computed, nextTick, onMounted, ref, shallowRef, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  type Connection,
  type Edge as FlowEdge,
  type Node as FlowNode,
  Handle,
  MarkerType,
  Position,
  VueFlow,
  useVueFlow
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import '@vue-flow/controls/dist/style.css';
import '@vue-flow/minimap/dist/style.css';
import {
  type WorkflowDefinition,
  type WorkflowEdgeDefinition,
  type WorkflowNodeDefinition,
  fetchWorkflows
} from '@/service/api/automation';
import { fetchDatasources, fetchSchemas, fetchSkills, fetchTools } from '@/service/api/rag';
import { $t } from '@/locales';
import ConfigCodeEditor from '@/views/rag/shared/config-code-editor.vue';

defineOptions({ name: 'AutomationWorkflowDesigner' });
const t = $t;

const props = defineProps<{
  modelValue: WorkflowDefinition;
  readonly?: boolean;
  validationErrors?: string[];
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: WorkflowDefinition): void;
  (e: 'change'): void;
}>();

interface NodeTemplate {
  type: string;
  label: string;
  icon: string;
  tone: string;
  category: 'control' | 'data' | 'ai' | 'integration';
}

interface Snapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

interface VariableTreeNode {
  label: string;
  value?: string;
  children?: VariableTreeNode[];
}

interface ResourceOption {
  id: number;
  code: string;
  name: string;
  type: 'api' | 'skill' | 'datasource' | 'schema' | 'workflow';
  version?: number;
}

const templates = computed<NodeTemplate[]>(() => [
  {
    type: 'start',
    label: t('automation.designer.nodes.start'),
    icon: 'mdi:play-circle-outline',
    tone: '#16845b',
    category: 'control'
  },
  {
    type: 'end',
    label: t('automation.designer.nodes.end'),
    icon: 'mdi:stop-circle-outline',
    tone: '#495057',
    category: 'control'
  },
  {
    type: 'condition',
    label: t('automation.designer.nodes.condition'),
    icon: 'mdi:source-branch',
    tone: '#a05a00',
    category: 'control'
  },
  {
    type: 'parallel',
    label: t('automation.designer.nodes.parallel'),
    icon: 'mdi:call-split',
    tone: '#7a5d00',
    category: 'control'
  },
  {
    type: 'delay',
    label: t('automation.designer.nodes.delay'),
    icon: 'mdi:timer-sand',
    tone: '#b36b00',
    category: 'control'
  },
  {
    type: 'wait_event',
    label: t('automation.designer.nodes.wait_event'),
    icon: 'mdi:progress-clock',
    tone: '#8b5a00',
    category: 'control'
  },
  {
    type: 'batch_loop',
    label: t('automation.designer.nodes.batch_loop'),
    icon: 'mdi:repeat',
    tone: '#9b4d24',
    category: 'control'
  },
  {
    type: 'aggregate',
    label: t('automation.designer.nodes.aggregate'),
    icon: 'mdi:call-merge',
    tone: '#2374ab',
    category: 'data'
  },
  {
    type: 'transform',
    label: t('automation.designer.nodes.transform'),
    icon: 'mdi:swap-horizontal',
    tone: '#087f8c',
    category: 'data'
  },
  {
    type: 'builtin',
    label: t('automation.designer.nodes.builtin'),
    icon: 'mdi:calculator-variant-outline',
    tone: '#3d6b35',
    category: 'data'
  },
  {
    type: 'datasource',
    label: t('automation.designer.nodes.datasource'),
    icon: 'mdi:database-outline',
    tone: '#286f6c',
    category: 'data'
  },
  {
    type: 'rag',
    label: t('automation.designer.nodes.rag'),
    icon: 'mdi:book-search-outline',
    tone: '#3d5a80',
    category: 'ai'
  },
  {
    type: 'llm',
    label: 'LLM',
    icon: 'mdi:creation-outline',
    tone: '#6f42c1',
    category: 'ai'
  },
  {
    type: 'nl2sql',
    label: 'NL2SQL',
    icon: 'mdi:database-search-outline',
    tone: '#445aa7',
    category: 'ai'
  },
  {
    type: 'skill',
    label: t('automation.designer.nodes.skill'),
    icon: 'mdi:lightning-bolt-outline',
    tone: '#8a4f7d',
    category: 'ai'
  },
  {
    type: 'agent',
    label: t('automation.designer.nodes.agent'),
    icon: 'mdi:account-cog-outline',
    tone: '#4d638c',
    category: 'ai'
  },
  {
    type: 'api',
    label: 'API',
    icon: 'mdi:api',
    tone: '#006d77',
    category: 'integration'
  },
  {
    type: 'subflow',
    label: t('automation.designer.nodes.subflow'),
    icon: 'mdi:sitemap-outline',
    tone: '#7a4e2d',
    category: 'integration'
  }
]);

const categories = computed(
  () =>
    [
      { key: 'control', label: t('automation.designer.categories.control') },
      { key: 'data', label: t('automation.designer.categories.data') },
      { key: 'ai', label: t('automation.designer.categories.ai') },
      { key: 'integration', label: t('automation.designer.categories.integration') }
    ] as const
);

const nodes = shallowRef<FlowNode[]>([]);
const edges = shallowRef<FlowEdge[]>([]);
const selectedNodeId = ref('');
const selectedEdgeId = ref('');
const leftTab = ref<'nodes' | 'variables'>('nodes');
const history = shallowRef<Snapshot[]>([]);
const historyIndex = ref(-1);
const hydrating = ref(false);
const advancedJson = ref({
  config: '{}',
  inputSchema: '{}',
  inputMapping: '[]',
  outputSchema: '{}',
  outputMapping: '[]'
});
const advancedTab = ref<'config' | 'inputSchema' | 'inputMapping' | 'outputSchema' | 'outputMapping'>('config');
const workflowJson = ref({
  inputSchema: '{}',
  variablesSchema: '{}',
  outputSchema: '{}',
  finalOutput: '[]',
  resourceBindings: '[]'
});
const workflowTab = ref<'inputSchema' | 'variablesSchema' | 'outputSchema' | 'finalOutput' | 'resourceBindings'>(
  'inputSchema'
);
const { screenToFlowCoordinate, fitView } = useVueFlow();
const resourceOptions = ref<ResourceOption[]>([]);
const resourcesLoading = ref(false);

const transformConfigExample = JSON.stringify({
  operations: [
    {
      op: 'template',
      target: 'prompt',
      template: 'Input: {{input}}\nKnowledge: {{knowledge}}',
      values: { input: 'input', knowledge: 'knowledge' }
    }
  ]
});
const inputSchemaExample = JSON.stringify({
  type: 'object',
  required: ['question'],
  properties: { question: { type: 'string', description: '当前任务需要处理的业务问题' } }
});
const inputMappingExample = JSON.stringify([
  {
    target: 'query',
    sourceKind: 'PATH',
    source: 'workflow.input.question',
    required: true,
    nullable: false,
    conversion: 'STRING',
    missingPolicy: 'FAIL',
    sensitive: false
  }
]);
const outputSchemaExample = JSON.stringify({
  type: 'object',
  required: ['result'],
  properties: { result: { type: 'string', description: '节点处理结果' } }
});
const outputMappingExample = JSON.stringify([
  {
    target: 'result',
    sourceKind: 'PATH',
    source: 'raw.result',
    required: true,
    nullable: false,
    conversion: 'STRING',
    missingPolicy: 'FAIL',
    sensitive: false
  }
]);
const finalOutputExample = JSON.stringify([
  {
    target: 'result',
    sourceKind: 'PATH',
    source: 'workflow.input.question',
    required: true,
    nullable: false,
    conversion: 'STRING',
    missingPolicy: 'FAIL',
    sensitive: false
  }
]);

const selectedNode = computed(() => nodes.value.find(node => node.id === selectedNodeId.value));
const selectedDefinition = computed(() => selectedNode.value?.data.definition as WorkflowNodeDefinition | undefined);
const selectedEdge = computed(() => edges.value.find(edge => edge.id === selectedEdgeId.value));
const selectedEdgeDefinition = computed(
  () => selectedEdge.value?.data.definition as WorkflowEdgeDefinition | undefined
);
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value >= 0 && historyIndex.value < history.value.length - 1);
const selectedResourceType = computed<ResourceOption['type'] | undefined>(() => {
  const type = selectedDefinition.value?.type;
  return ({ api: 'api', skill: 'skill', datasource: 'datasource', nl2sql: 'schema', subflow: 'workflow' } as const)[
    type as 'api' | 'skill' | 'datasource' | 'nl2sql' | 'subflow'
  ];
});
const selectedResourceId = computed(() => {
  const alias = selectedDefinition.value?.config.resourceAlias;
  return props.modelValue.resourceBindings.find(binding => binding.alias === alias)?.resourceId;
});
const selectedResourceOptions = computed(() =>
  resourceOptions.value.filter(option => option.type === selectedResourceType.value)
);

const variableTree = computed(() => [
  {
    label: 'workflow.input',
    children: schemaChildren(props.modelValue.inputSchema, 'workflow.input')
  },
  {
    label: 'workflow.variables',
    children: schemaChildren(props.modelValue.variablesSchema, 'workflow.variables')
  },
  {
    label: 'nodes',
    children: nodes.value.map(node => ({
      label: node.data.definition.name,
      value: `nodes.${node.id}.output`,
      children: schemaChildren(node.data.definition.outputSchema, `nodes.${node.id}.output`)
    }))
  },
  {
    label: 'loop',
    children: ['item', 'index', 'key'].map(key => ({
      label: key,
      value: `loop.${key}`
    }))
  }
]);

function schemaChildren(schema: Record<string, any> | undefined, prefix: string): VariableTreeNode[] {
  const properties = schema?.properties || {};
  return Object.entries(properties).map(([key, value]: [string, any]) => ({
    label: key,
    value: `${prefix}.${key}`,
    children: value?.properties ? schemaChildren(value, `${prefix}.${key}`) : undefined
  }));
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function defaultPolicy() {
  return {
    maxRetries: 2,
    retryDelay: 'PT10S',
    timeoutMs: 60000,
    failurePolicy: 'FAIL_WORKFLOW' as const
  };
}

function defaultConfig(type: string): Record<string, any> {
  if (type === 'delay') return { duration: 'PT5M' };
  if (type === 'aggregate') return { strategy: 'object', waitPolicy: 'all_required' };
  if (type === 'transform') return { operations: [] };
  if (type === 'builtin') return { toolCode: 'calculator' };
  if (type === 'llm') return { maxCompletionTokens: 1024 };
  if (type === 'batch_loop') {
    return {
      itemsPath: 'workflow.input.items',
      batchSize: 50,
      maxConcurrency: 4,
      rateLimitPerSecond: 10,
      maxAttempts: 2,
      failureThreshold: 1,
      body: {
        id: 'loop_item',
        type: 'builtin',
        name: t('automation.designer.nodes.builtin'),
        config: { toolCode: 'calculator' }
      }
    };
  }
  return {};
}

function createDefinition(template: NodeTemplate): WorkflowNodeDefinition {
  const count = nodes.value.filter(node => node.data.definition.type === template.type).length + 1;
  return {
    id: `${template.type}_${Date.now().toString(36)}_${count}`,
    type: template.type,
    name: `${template.label}${count > 1 ? ` ${count}` : ''}`,
    config: defaultConfig(template.type),
    inputSchema: {},
    inputMapping: [],
    outputSchema: template.type === 'llm' ? { type: 'object', properties: {} } : {},
    outputMapping: [],
    executionPolicy: defaultPolicy()
  };
}

function flowNode(definition: WorkflowNodeDefinition, position: { x: number; y: number }): FlowNode {
  return {
    id: definition.id,
    type: 'workflow',
    position,
    data: { definition }
  };
}

function hydrate(definition: WorkflowDefinition) {
  hydrating.value = true;
  syncWorkflowJson(definition);
  const positions = definition.policies?.designer?.positions || {};
  nodes.value = (definition.nodes || []).map((node, index) =>
    flowNode(
      deepClone(node),
      positions[node.id] || {
        x: 80 + (index % 4) * 230,
        y: 80 + Math.floor(index / 4) * 130
      }
    )
  );
  edges.value = (definition.edges || []).map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    markerEnd: MarkerType.ArrowClosed,
    label: edge.condition || (edge.defaultBranch ? t('automation.common.default') : ''),
    data: { definition: deepClone(edge) }
  }));
  selectedNodeId.value = '';
  selectedEdgeId.value = '';
  history.value = [];
  historyIndex.value = -1;
  pushHistory();
  nextTick(() => {
    hydrating.value = false;
    fitView({ padding: 0.18, maxZoom: 1 });
  });
}

function serialize(): WorkflowDefinition {
  const definition = deepClone(props.modelValue);
  definition.nodes = nodes.value.map(node => deepClone(node.data.definition));
  definition.edges = edges.value.map(edge => deepClone(edge.data.definition));
  definition.policies ||= {};
  definition.policies.designer = {
    positions: Object.fromEntries(nodes.value.map(node => [node.id, { x: node.position.x, y: node.position.y }]))
  };
  return definition;
}

function notifyChange(record = true) {
  if (hydrating.value) return;
  nodes.value = [...nodes.value];
  edges.value = [...edges.value];
  emit('update:modelValue', serialize());
  emit('change');
  if (record) pushHistory();
}

function snapshot(): Snapshot {
  return { nodes: deepClone(nodes.value), edges: deepClone(edges.value) };
}

function pushHistory() {
  const current = snapshot();
  const next = history.value.slice(0, historyIndex.value + 1);
  const previous = next.at(-1);
  if (previous && JSON.stringify(previous) === JSON.stringify(current)) return;
  next.push(current);
  if (next.length > 50) next.shift();
  history.value = next;
  historyIndex.value = next.length - 1;
}

function restoreHistory(index: number) {
  const item = history.value[index];
  if (!item) return;
  historyIndex.value = index;
  nodes.value = deepClone(item.nodes);
  edges.value = deepClone(item.edges);
  notifyChange(false);
}

function undo() {
  if (canUndo.value) restoreHistory(historyIndex.value - 1);
}

function redo() {
  if (canRedo.value) restoreHistory(historyIndex.value + 1);
}

function addNode(template: NodeTemplate, position?: { x: number; y: number }) {
  if (props.readonly) return;
  if (template.type === 'start' && nodes.value.some(node => node.data.definition.type === 'start')) {
    ElMessage.warning(t('automation.designer.onlyOneStart'));
    return;
  }
  const definition = createDefinition(template);
  const fallback = {
    x: 120 + (nodes.value.length % 3) * 220,
    y: 100 + Math.floor(nodes.value.length / 3) * 140
  };
  nodes.value = [...nodes.value, flowNode(definition, position || fallback)];
  selectedNodeId.value = definition.id;
  selectedEdgeId.value = '';
  notifyChange();
}

function onDragStart(event: DragEvent, template: NodeTemplate) {
  if (!event.dataTransfer) return;
  event.dataTransfer.setData('application/workflow-node', template.type);
  event.dataTransfer.effectAllowed = 'move';
}

function onDrop(event: DragEvent) {
  const type = event.dataTransfer?.getData('application/workflow-node');
  const template = templates.value.find(item => item.type === type);
  if (!template) return;
  addNode(template, screenToFlowCoordinate({ x: event.clientX, y: event.clientY }));
}

function onDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}

function hasPath(source: string, target: string): boolean {
  const outgoing = new Map<string, string[]>();
  edges.value.forEach(edge => outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge.target]));
  const pending = [source];
  const visited = new Set<string>();
  while (pending.length) {
    const current = pending.pop()!;
    if (current === target) return true;
    if (!visited.has(current)) {
      visited.add(current);
      pending.push(...(outgoing.get(current) || []));
    }
  }
  return false;
}

function connectionError(connection: Connection): string | null {
  if (!connection.source || !connection.target) return t('automation.designer.invalidEndpoint');
  if (connection.source === connection.target) return t('automation.designer.selfEdge');
  const source = nodes.value.find(node => node.id === connection.source)?.data.definition;
  const target = nodes.value.find(node => node.id === connection.target)?.data.definition;
  if (source?.type === 'end') return t('automation.designer.endOutgoing');
  if (target?.type === 'start') return t('automation.designer.startIncoming');
  if (edges.value.some(edge => edge.source === connection.source && edge.target === connection.target)) {
    return t('automation.designer.duplicateEdge');
  }
  if (hasPath(connection.target, connection.source)) return t('automation.designer.cycleEdge');
  return null;
}

function onConnect(connection: Connection) {
  if (props.readonly) return;
  const error = connectionError(connection);
  if (error) {
    ElMessage.warning(error);
    return;
  }
  const definition: WorkflowEdgeDefinition = {
    id: `edge_${connection.source}_${connection.target}_${Date.now().toString(36)}`,
    source: connection.source!,
    target: connection.target!,
    defaultBranch: false
  };
  edges.value = [
    ...edges.value,
    {
      ...connection,
      id: definition.id,
      type: 'smoothstep',
      markerEnd: MarkerType.ArrowClosed,
      data: { definition }
    } as FlowEdge
  ];
  notifyChange();
}

function selectNode(event: { node: FlowNode }) {
  selectedNodeId.value = event.node.id;
  selectedEdgeId.value = '';
}

function selectEdge(event: { edge: FlowEdge }) {
  selectedEdgeId.value = event.edge.id;
  selectedNodeId.value = '';
}

function clearSelection() {
  selectedNodeId.value = '';
  selectedEdgeId.value = '';
}

function deleteSelection() {
  if (props.readonly) return;
  if (selectedNodeId.value) {
    nodes.value = nodes.value.filter(node => node.id !== selectedNodeId.value);
    edges.value = edges.value.filter(
      edge => edge.source !== selectedNodeId.value && edge.target !== selectedNodeId.value
    );
    selectedNodeId.value = '';
  } else if (selectedEdgeId.value) {
    edges.value = edges.value.filter(edge => edge.id !== selectedEdgeId.value);
    selectedEdgeId.value = '';
  }
  notifyChange();
}

function touch() {
  if (selectedNode.value && selectedDefinition.value) selectedNode.value.data.definition = selectedDefinition.value;
  if (selectedEdge.value && selectedEdgeDefinition.value) {
    selectedEdge.value.data.definition = selectedEdgeDefinition.value;
    selectedEdge.value.label =
      selectedEdgeDefinition.value.condition ||
      (selectedEdgeDefinition.value.defaultBranch ? t('automation.common.default') : '');
  }
  notifyChange();
}

function copyVariable(data: { value?: string }) {
  if (!data.value) return;
  navigator.clipboard.writeText(data.value);
  ElMessage.success(t('automation.designer.copiedVariable', { value: data.value }));
}

async function loadResourceOptions() {
  resourcesLoading.value = true;
  try {
    const [tools, skills, datasources, workflows] = await Promise.all([
      fetchAllPages(page => fetchTools({ page, size: 100, status: 1 })),
      fetchAllPages(page => fetchSkills({ page, size: 100, status: 1 })),
      fetchAllPages(page => fetchDatasources({ page, size: 100, status: 1 })),
      fetchAllPages(page => fetchWorkflows({ page, size: 100, status: 'PUBLISHED' }))
    ]);
    const datasourceRecords = datasources;
    const schemaResponses = await Promise.all(datasourceRecords.map((item: any) => fetchSchemas(item.id)));
    resourceOptions.value = [
      ...tools.map((item: any) => ({ id: item.id, code: item.code, name: item.name, type: 'api' as const })),
      ...skills.map((item: any) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        version: item.version,
        type: 'skill' as const
      })),
      ...datasourceRecords.map((item: any) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        type: 'datasource' as const
      })),
      ...schemaResponses.flatMap(response =>
        (response.data || []).map((item: any) => ({
          id: item.id,
          code: item.domainCode,
          name: item.domainName || item.viewName,
          type: 'schema' as const
        }))
      ),
      ...workflows.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        version: item.currentVersion,
        type: 'workflow' as const
      }))
    ];
  } finally {
    resourcesLoading.value = false;
  }
}

async function fetchAllPages(fetchPage: (page: number) => Promise<any>) {
  const records: any[] = [];
  let page = 1;
  while (true) {
    const response = await fetchPage(page);
    if (response.error) throw response.error;
    const batch = response.data?.records || [];
    records.push(...batch);
    const total = Number(response.data?.total || 0);
    if (!batch.length || records.length >= total) return records;
    page += 1;
  }
}

function bindResource(resourceId: number) {
  if (!selectedDefinition.value || !selectedResourceType.value) return;
  const option = selectedResourceOptions.value.find(item => item.id === resourceId);
  if (!option) return;
  const previousAlias = String(selectedDefinition.value.config.resourceAlias || '');
  const alias = `${selectedDefinition.value.id}_${option.type}_${option.code || option.id}`
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .slice(0, 64);
  selectedDefinition.value.config.resourceAlias = alias;
  const definition = serialize();
  const oldAliasIsStillUsed = definition.nodes.some(node => {
    if (String(node.config?.resourceAlias || '') === previousAlias) return true;
    const body = node.config?.body;
    return body && typeof body === 'object' && String(body.config?.resourceAlias || '') === previousAlias;
  });
  const bindings = (definition.resourceBindings || []).filter(
    binding => binding.alias !== alias && (binding.alias !== previousAlias || oldAliasIsStillUsed)
  );
  bindings.push({
    alias,
    resourceType: option.type,
    resourceId: option.id,
    resourceCode: option.code,
    ...(option.version ? { resourceVersion: option.version } : {})
  });
  definition.resourceBindings = bindings;
  syncWorkflowJson(definition);
  emit('update:modelValue', definition);
  emit('change');
  selectedNode.value!.data.definition = selectedDefinition.value;
  syncAdvancedJson();
  pushHistory();
}

function syncAdvancedJson() {
  const node = selectedDefinition.value;
  if (!node) return;
  advancedJson.value = {
    config: JSON.stringify(node.config || {}, null, 2),
    inputSchema: JSON.stringify(node.inputSchema || {}, null, 2),
    inputMapping: JSON.stringify(node.inputMapping || [], null, 2),
    outputSchema: JSON.stringify(node.outputSchema || {}, null, 2),
    outputMapping: JSON.stringify(node.outputMapping || [], null, 2)
  };
}

function syncWorkflowJson(definition: WorkflowDefinition) {
  workflowJson.value = {
    inputSchema: JSON.stringify(definition.inputSchema || {}, null, 2),
    variablesSchema: JSON.stringify(definition.variablesSchema || {}, null, 2),
    outputSchema: JSON.stringify(definition.outputSchema || {}, null, 2),
    finalOutput: JSON.stringify(definition.finalOutput || [], null, 2),
    resourceBindings: JSON.stringify(definition.resourceBindings || [], null, 2)
  };
}

function applyAdvancedJson(field: keyof typeof advancedJson.value) {
  if (!selectedDefinition.value) return;
  const labels = {
    config: t('automation.designer.nodeConfig'),
    inputSchema: t('automation.designer.inputSchema'),
    inputMapping: t('automation.designer.inputMapping'),
    outputSchema: t('automation.designer.outputSchema'),
    outputMapping: t('automation.designer.outputMapping')
  };
  try {
    const parsed = JSON.parse(advancedJson.value[field]);
    if (field === 'config') selectedDefinition.value.config = parsed;
    if (field === 'inputSchema') selectedDefinition.value.inputSchema = parsed;
    if (field === 'inputMapping') selectedDefinition.value.inputMapping = parsed;
    if (field === 'outputSchema') selectedDefinition.value.outputSchema = parsed;
    if (field === 'outputMapping') selectedDefinition.value.outputMapping = parsed;
    touch();
    ElMessage.success(t('automation.designer.jsonApplied'));
  } catch {
    ElMessage.error(t('automation.designer.jsonError', { field: labels[field] }));
  }
}

function applyWorkflowJson(field: keyof typeof workflowJson.value) {
  const labels = {
    inputSchema: t('automation.designer.workflowInputSchema'),
    variablesSchema: t('automation.designer.workflowVariablesSchema'),
    outputSchema: t('automation.designer.workflowOutputSchema'),
    finalOutput: t('automation.designer.finalOutput'),
    resourceBindings: t('automation.designer.resourceBindings')
  };
  try {
    const parsed = JSON.parse(workflowJson.value[field]);
    const definition = serialize();
    definition[field] = parsed;
    emit('update:modelValue', definition);
    emit('change');
    ElMessage.success(t('automation.designer.jsonApplied'));
  } catch {
    ElMessage.error(t('automation.designer.jsonError', { field: labels[field] }));
  }
}

function autoLayout() {
  const indegree = new Map(nodes.value.map(node => [node.id, 0]));
  const outgoing = new Map<string, string[]>();
  edges.value.forEach(edge => {
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge.target]);
  });
  const levels = new Map<string, number>();
  const queue = nodes.value.filter(node => (indegree.get(node.id) || 0) === 0).map(node => node.id);
  queue.forEach(id => levels.set(id, 0));
  while (queue.length) {
    const id = queue.shift()!;
    for (const target of outgoing.get(id) || []) {
      levels.set(target, Math.max(levels.get(target) || 0, (levels.get(id) || 0) + 1));
      indegree.set(target, (indegree.get(target) || 0) - 1);
      if (indegree.get(target) === 0) queue.push(target);
    }
  }
  const grouped = new Map<number, FlowNode[]>();
  nodes.value.forEach(node => {
    const level = levels.get(node.id) || 0;
    grouped.set(level, [...(grouped.get(level) || []), node]);
  });
  nodes.value = nodes.value.map(node => {
    const level = levels.get(node.id) || 0;
    const row = grouped.get(level)!.findIndex(item => item.id === node.id);
    return { ...node, position: { x: 90 + level * 250, y: 70 + row * 130 } };
  });
  notifyChange();
  nextTick(() => fitView({ padding: 0.16, maxZoom: 1 }));
}

function errorForNode(nodeId: string) {
  return (props.validationErrors || []).some(error => error.includes(nodeId));
}

watch(
  () => props.modelValue,
  value => {
    if (!hydrating.value && !nodes.value.length && value.nodes?.length) hydrate(value);
  },
  { deep: false }
);
watch(selectedNodeId, syncAdvancedJson);

onMounted(() => {
  hydrate(props.modelValue);
  loadResourceOptions();
});

defineExpose({
  autoLayout,
  focusNode: (id: string) => {
    selectedNodeId.value = id;
  }
});
</script>

<template>
  <div class="workflow-designer">
    <aside class="designer-left">
      <div class="panel-tabs">
        <button :class="{ active: leftTab === 'nodes' }" @click="leftTab = 'nodes'">
          {{ t('automation.designer.nodeLibrary') }}
        </button>
        <button :class="{ active: leftTab === 'variables' }" @click="leftTab = 'variables'">
          {{ t('automation.designer.variables') }}
        </button>
      </div>
      <div v-if="leftTab === 'nodes'" class="palette-scroll">
        <section v-for="category in categories" :key="category.key" class="palette-section">
          <div class="palette-title">{{ category.label }}</div>
          <div class="palette-grid">
            <button
              v-for="template in templates.filter(item => item.category === category.key)"
              :key="template.type"
              class="palette-item"
              :disabled="readonly"
              draggable="true"
              @dragstart="onDragStart($event, template)"
              @click="addNode(template)"
            >
              <span
                class="palette-icon"
                :style="{
                  color: template.tone,
                  backgroundColor: `${template.tone}14`
                }"
              >
                <SvgIcon :icon="template.icon" />
              </span>
              <span>{{ template.label }}</span>
            </button>
          </div>
        </section>
      </div>
      <div v-else class="variable-tree">
        <ElTree :data="variableTree" node-key="value" default-expand-all :expand-on-click-node="false">
          <template #default="{ data }">
            <button class="variable-row" :disabled="!data.value" @click="copyVariable(data)">
              <SvgIcon :icon="data.children ? 'mdi:folder-outline' : 'mdi:code-braces'" />
              <span>{{ data.label }}</span>
            </button>
          </template>
        </ElTree>
      </div>
    </aside>

    <main class="designer-canvas" @drop="onDrop" @dragover="onDragOver">
      <div class="canvas-toolbar">
        <ElTooltip :content="t('automation.designer.undo')">
          <ElButton text circle :disabled="!canUndo || readonly" @click="undo"><SvgIcon icon="mdi:undo" /></ElButton>
        </ElTooltip>
        <ElTooltip :content="t('automation.designer.redo')">
          <ElButton text circle :disabled="!canRedo || readonly" @click="redo"><SvgIcon icon="mdi:redo" /></ElButton>
        </ElTooltip>
        <span class="toolbar-separator" />
        <ElTooltip :content="t('automation.designer.autoLayout')">
          <ElButton text circle @click="autoLayout"><SvgIcon icon="mdi:graph-outline" /></ElButton>
        </ElTooltip>
        <ElTooltip :content="t('automation.designer.fit')">
          <ElButton text circle @click="fitView({ padding: 0.18 })">
            <SvgIcon icon="mdi:fit-to-screen-outline" />
          </ElButton>
        </ElTooltip>
        <ElTooltip :content="t('automation.designer.deleteSelected')">
          <ElButton
            text
            circle
            type="danger"
            :disabled="readonly || (!selectedNodeId && !selectedEdgeId)"
            @click="deleteSelection"
          >
            <SvgIcon icon="mdi:trash-can-outline" />
          </ElButton>
        </ElTooltip>
        <span class="canvas-count">
          {{ t('automation.designer.canvasCount', { nodes: nodes.length, edges: edges.length }) }}
        </span>
      </div>
      <VueFlow
        v-model:nodes="nodes"
        v-model:edges="edges"
        class="automation-flow"
        :min-zoom="0.2"
        :max-zoom="1.8"
        :nodes-draggable="!readonly"
        :nodes-connectable="!readonly"
        :elements-selectable="true"
        :delete-key-code="readonly ? null : 'Delete'"
        fit-view-on-init
        @connect="onConnect"
        @node-click="selectNode"
        @edge-click="selectEdge"
        @pane-click="clearSelection"
        @node-drag-stop="notifyChange()"
        @nodes-delete="notifyChange()"
        @edges-delete="notifyChange()"
      >
        <template #node-workflow="{ data, selected }">
          <div
            class="workflow-node"
            :class="{ selected, invalid: errorForNode(data.definition.id) }"
            :style="{
              '--node-tone': templates.find(item => item.type === data.definition.type)?.tone || '#495057'
            }"
          >
            <Handle v-if="data.definition.type !== 'start'" type="target" :position="Position.Left" />
            <div class="node-icon">
              <SvgIcon :icon="templates.find(item => item.type === data.definition.type)?.icon || 'mdi:cube-outline'" />
            </div>
            <div class="node-copy">
              <strong>{{ data.definition.name }}</strong>
              <span>
                {{ templates.find(item => item.type === data.definition.type)?.label || data.definition.type }}
              </span>
            </div>
            <Handle v-if="data.definition.type !== 'end'" type="source" :position="Position.Right" />
          </div>
        </template>
        <Background :gap="20" :size="1" color="#dfe4ea" />
        <Controls position="bottom-left" />
        <MiniMap position="bottom-right" :pannable="true" :zoomable="true" />
      </VueFlow>
    </main>

    <aside class="designer-right">
      <div class="property-header">
        <span>
          {{
            selectedDefinition
              ? t('automation.designer.nodeProperties')
              : selectedEdgeDefinition
                ? t('automation.designer.edgeProperties')
                : t('automation.designer.workflowSettings')
          }}
        </span>
        <ElTag v-if="readonly" size="small" type="info">{{ t('automation.designer.readonly') }}</ElTag>
      </div>
      <div v-if="selectedDefinition" class="property-scroll">
        <ElForm label-position="top" size="small" :disabled="readonly">
          <ElFormItem :label="t('automation.designer.nodeName')">
            <ElInput
              v-model="selectedDefinition.name"
              :placeholder="t('automation.designer.nodeNamePlaceholder')"
              maxlength="80"
              @change="touch"
            />
          </ElFormItem>
          <ElFormItem :label="t('automation.designer.nodeId')">
            <ElInput :model-value="selectedDefinition.id" disabled />
          </ElFormItem>
          <template v-if="selectedDefinition.type === 'delay'">
            <ElFormItem :label="t('automation.designer.duration')">
              <ElInput v-model="selectedDefinition.config.duration" placeholder="PT5M" @change="touch" />
            </ElFormItem>
          </template>
          <template v-else-if="selectedDefinition.type === 'aggregate'">
            <ElFormItem :label="t('automation.designer.aggregateStrategy')">
              <ElSelect
                v-model="selectedDefinition.config.strategy"
                :placeholder="t('automation.designer.aggregateStrategyPlaceholder')"
                @change="touch"
              >
                <ElOption :label="t('automation.designer.aggregateOptions.object')" value="object" />
                <ElOption :label="t('automation.designer.aggregateOptions.concat')" value="concat" />
                <ElOption :label="t('automation.designer.aggregateOptions.coalesce')" value="coalesce" />
                <ElOption :label="t('automation.designer.aggregateOptions.branch_union')" value="branch_union" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem :label="t('automation.designer.waitPolicy')">
              <ElSelect
                v-model="selectedDefinition.config.waitPolicy"
                :placeholder="t('automation.designer.waitPolicyPlaceholder')"
                @change="touch"
              >
                <ElOption :label="t('automation.designer.waitOptions.all_required')" value="all_required" />
                <ElOption :label="t('automation.designer.waitOptions.any')" value="any" />
              </ElSelect>
            </ElFormItem>
          </template>
          <template v-else-if="selectedDefinition.type === 'builtin'">
            <ElFormItem :label="t('automation.designer.tool')">
              <ElSelect
                v-model="selectedDefinition.config.toolCode"
                :placeholder="t('automation.designer.toolPlaceholder')"
                @change="touch"
              >
                <ElOption :label="t('automation.designer.builtins.current_datetime')" value="current_datetime" />
                <ElOption :label="t('automation.designer.builtins.date_calculate')" value="date_calculate" />
                <ElOption :label="t('automation.designer.builtins.calculator')" value="calculator" />
                <ElOption :label="t('automation.designer.builtins.unit_convert')" value="unit_convert" />
              </ElSelect>
            </ElFormItem>
          </template>
          <template v-else-if="selectedDefinition.type === 'batch_loop'">
            <ElFormItem :label="t('automation.designer.itemsPath')">
              <ElInput
                v-model="selectedDefinition.config.itemsPath"
                :placeholder="t('automation.designer.itemsPathPlaceholder')"
                @change="touch"
              />
            </ElFormItem>
            <div class="form-grid">
              <ElFormItem :label="t('automation.designer.batchSize')">
                <ElInputNumber
                  v-model="selectedDefinition.config.batchSize"
                  :min="1"
                  :max="500"
                  :placeholder="t('automation.designer.batchSizePlaceholder')"
                  @change="touch"
                />
              </ElFormItem>
              <ElFormItem :label="t('automation.designer.concurrency')">
                <ElInputNumber
                  v-model="selectedDefinition.config.maxConcurrency"
                  :min="1"
                  :max="32"
                  :placeholder="t('automation.designer.concurrencyPlaceholder')"
                  @change="touch"
                />
              </ElFormItem>
              <ElFormItem :label="t('automation.designer.rateLimit')">
                <ElInputNumber
                  v-model="selectedDefinition.config.rateLimitPerSecond"
                  :min="1"
                  :max="1000"
                  :placeholder="t('automation.designer.rateLimitPlaceholder')"
                  @change="touch"
                />
              </ElFormItem>
              <ElFormItem :label="t('automation.designer.failureThreshold')">
                <ElInputNumber
                  v-model="selectedDefinition.config.failureThreshold"
                  :min="1"
                  :max="10000"
                  :placeholder="t('automation.designer.failureThresholdPlaceholder')"
                  @change="touch"
                />
              </ElFormItem>
            </div>
          </template>
          <template v-else-if="selectedResourceType">
            <ElFormItem :label="t('automation.designer.resource')">
              <ElSelect
                :model-value="selectedResourceId"
                filterable
                :loading="resourcesLoading"
                :placeholder="t('automation.designer.resourcePlaceholder')"
                @change="bindResource"
              >
                <ElOption
                  v-for="option in selectedResourceOptions"
                  :key="option.id"
                  :label="`${option.name} (${option.code})`"
                  :value="option.id"
                />
              </ElSelect>
              <div class="field-help">{{ t('automation.designer.resourceHelp') }}</div>
            </ElFormItem>
            <ElFormItem :label="t('automation.designer.resourceAlias')">
              <ElInput
                :model-value="selectedDefinition.config.resourceAlias"
                :placeholder="t('automation.designer.resourceAliasHint')"
                disabled
              />
              <div class="field-help">{{ t('automation.designer.resourceAliasHelp') }}</div>
            </ElFormItem>
          </template>
          <template v-else-if="selectedDefinition.type === 'llm'">
            <ElFormItem :label="t('automation.designer.systemInstruction')">
              <ElInput
                v-model="selectedDefinition.config.systemPrompt"
                type="textarea"
                :rows="5"
                :placeholder="t('automation.designer.systemInstructionPlaceholder')"
                maxlength="8000"
                show-word-limit
                @change="touch"
              />
            </ElFormItem>
            <ElFormItem :label="t('automation.designer.model')">
              <ElInput
                v-model="selectedDefinition.config.model"
                :placeholder="t('automation.designer.modelPlaceholder')"
                @change="touch"
              />
            </ElFormItem>
            <ElFormItem :label="t('automation.designer.maxCompletionTokens')">
              <ElInputNumber
                v-model="selectedDefinition.config.maxCompletionTokens"
                :min="1"
                :max="32768"
                @change="touch"
              />
            </ElFormItem>
            <div class="form-grid">
              <ElFormItem :label="t('automation.designer.minConfidence')">
                <ElInputNumber
                  v-model="selectedDefinition.config.minConfidence"
                  :min="0"
                  :max="1"
                  :step="0.05"
                  :precision="2"
                  @change="touch"
                />
              </ElFormItem>
              <ElFormItem :label="t('automation.designer.confidenceField')">
                <ElInput
                  v-model="selectedDefinition.config.confidenceField"
                  :placeholder="t('automation.designer.confidenceFieldPlaceholder')"
                  @change="touch"
                />
              </ElFormItem>
            </div>
            <div class="field-help">{{ t('automation.designer.llmOutputHelp') }}</div>
          </template>
          <template v-else-if="selectedDefinition.type === 'wait_event'">
            <ElFormItem :label="t('automation.designer.approvalProviderId')">
              <ElInputNumber
                v-model="selectedDefinition.config.approvalProviderId"
                :min="1"
                :placeholder="t('automation.designer.approvalProviderPlaceholder')"
                controls-position="right"
                @change="touch"
              />
              <div class="field-help">{{ t('automation.designer.approvalProviderHelp') }}</div>
            </ElFormItem>
            <ElFormItem :label="t('automation.designer.correlationPath')">
              <ElInput
                v-model="selectedDefinition.config.correlationKeyPath"
                placeholder="workflow.input.businessId"
                @change="touch"
              />
              <div class="field-help">{{ t('automation.designer.correlationPathHelp') }}</div>
            </ElFormItem>
            <ElFormItem :label="t('automation.designer.approvalTimeout')">
              <ElInput v-model="selectedDefinition.config.approvalTimeout" placeholder="PT24H" @change="touch" />
            </ElFormItem>
            <ElFormItem :label="t('automation.designer.timeoutTarget')">
              <ElSelect
                v-model="selectedDefinition.config.timeoutTarget"
                filterable
                :placeholder="t('automation.designer.timeoutTargetPlaceholder')"
                @change="touch"
              >
                <ElOption
                  v-for="node in nodes.filter(
                    item => item.id !== selectedDefinition?.id && item.data.definition.type !== 'start'
                  )"
                  :key="node.id"
                  :label="`${node.data.definition.name} (${node.id})`"
                  :value="node.id"
                />
              </ElSelect>
              <div class="field-help">{{ t('automation.designer.timeoutTargetHelp') }}</div>
            </ElFormItem>
          </template>
          <ElCollapse class="advanced-config">
            <ElCollapseItem name="advanced" :title="t('automation.designer.advancedConfig')">
              <ElTabs v-model="advancedTab" stretch class="advanced-json-tabs">
                <ElTabPane :label="t('automation.designer.nodeConfig')" name="config">
                  <ConfigCodeEditor
                    v-model="advancedJson.config"
                    :rows="12"
                    expected-root="object"
                    :example="selectedDefinition.type === 'transform' ? transformConfigExample : ''"
                    :disabled="readonly"
                  />
                  <div class="json-actions">
                    <ElButton type="primary" :disabled="readonly" @click="applyAdvancedJson('config')">
                      {{ t('automation.designer.applyJson') }}
                    </ElButton>
                  </div>
                </ElTabPane>
                <ElTabPane :label="t('automation.designer.inputSchema')" name="inputSchema">
                  <ConfigCodeEditor
                    v-model="advancedJson.inputSchema"
                    :rows="12"
                    expected-root="object"
                    :example="inputSchemaExample"
                    :disabled="readonly"
                  />
                  <div class="json-hint">{{ t('automation.designer.inputSchemaHelp') }}</div>
                  <div class="json-actions">
                    <ElButton type="primary" :disabled="readonly" @click="applyAdvancedJson('inputSchema')">
                      {{ t('automation.designer.applyJson') }}
                    </ElButton>
                  </div>
                </ElTabPane>
                <ElTabPane :label="t('automation.designer.inputMapping')" name="inputMapping">
                  <ConfigCodeEditor
                    v-model="advancedJson.inputMapping"
                    :rows="12"
                    expected-root="array"
                    :example="inputMappingExample"
                    :disabled="readonly"
                  />
                  <div class="json-hint">{{ t('automation.designer.inputMappingHelp') }}</div>
                  <div class="json-actions">
                    <ElButton type="primary" :disabled="readonly" @click="applyAdvancedJson('inputMapping')">
                      {{ t('automation.designer.applyJson') }}
                    </ElButton>
                  </div>
                </ElTabPane>
                <ElTabPane :label="t('automation.designer.outputSchema')" name="outputSchema">
                  <ConfigCodeEditor
                    v-model="advancedJson.outputSchema"
                    :rows="12"
                    expected-root="object"
                    :example="outputSchemaExample"
                    :disabled="readonly"
                  />
                  <div class="json-hint">{{ t('automation.designer.outputSchemaHelp') }}</div>
                  <div class="json-actions">
                    <ElButton type="primary" :disabled="readonly" @click="applyAdvancedJson('outputSchema')">
                      {{ t('automation.designer.applyJson') }}
                    </ElButton>
                  </div>
                </ElTabPane>
                <ElTabPane :label="t('automation.designer.outputMapping')" name="outputMapping">
                  <ConfigCodeEditor
                    v-model="advancedJson.outputMapping"
                    :rows="12"
                    expected-root="array"
                    :example="outputMappingExample"
                    :disabled="readonly"
                  />
                  <div class="json-hint">{{ t('automation.designer.outputMappingHelp') }}</div>
                  <div class="json-actions">
                    <ElButton type="primary" :disabled="readonly" @click="applyAdvancedJson('outputMapping')">
                      {{ t('automation.designer.applyJson') }}
                    </ElButton>
                  </div>
                </ElTabPane>
              </ElTabs>
            </ElCollapseItem>
          </ElCollapse>
          <ElDivider content-position="left">{{ t('automation.designer.executionPolicy') }}</ElDivider>
          <div class="form-grid">
            <ElFormItem :label="t('automation.designer.retries')">
              <ElInputNumber
                v-model="selectedDefinition.executionPolicy.maxRetries"
                :min="0"
                :max="10"
                :placeholder="t('automation.designer.maxRetriesPlaceholder')"
                @change="touch"
              />
            </ElFormItem>
            <ElFormItem :label="t('automation.designer.timeoutMs')">
              <ElInputNumber
                v-model="selectedDefinition.executionPolicy.timeoutMs"
                :min="100"
                :max="3600000"
                :step="1000"
                :placeholder="t('automation.designer.timeoutPlaceholder')"
                @change="touch"
              />
            </ElFormItem>
          </div>
          <ElFormItem :label="t('automation.designer.retryDelay')">
            <ElInput v-model="selectedDefinition.executionPolicy.retryDelay" placeholder="PT10S" @change="touch" />
            <div class="field-help">{{ t('automation.designer.executionPolicyHelp') }}</div>
          </ElFormItem>
          <ElFormItem :label="t('automation.designer.failurePolicy')">
            <ElSelect
              v-model="selectedDefinition.executionPolicy.failurePolicy"
              :placeholder="t('automation.designer.failurePolicyPlaceholder')"
              @change="touch"
            >
              <ElOption :label="t('automation.designer.failureOptions.fail')" value="FAIL_WORKFLOW" />
              <ElOption :label="t('automation.designer.failureOptions.branch')" value="ERROR_BRANCH" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem
            v-if="selectedDefinition.executionPolicy.failurePolicy === 'ERROR_BRANCH'"
            :label="t('automation.designer.failureTarget')"
          >
            <ElSelect
              v-model="selectedDefinition.executionPolicy.failureTarget"
              filterable
              :placeholder="t('automation.designer.failureTargetPlaceholder')"
              @change="touch"
            >
              <ElOption
                v-for="node in nodes.filter(item => item.id !== selectedDefinition?.id)"
                :key="node.id"
                :label="node.data.definition.name"
                :value="node.id"
              />
            </ElSelect>
          </ElFormItem>
        </ElForm>
      </div>
      <div v-else-if="selectedEdgeDefinition" class="property-scroll">
        <ElForm label-position="top" size="small" :disabled="readonly">
          <ElFormItem :label="t('automation.designer.source')">
            <ElInput :model-value="selectedEdgeDefinition.source" disabled />
          </ElFormItem>
          <ElFormItem :label="t('automation.designer.target')">
            <ElInput :model-value="selectedEdgeDefinition.target" disabled />
          </ElFormItem>
          <ElFormItem :label="t('automation.designer.condition')">
            <ElInput
              v-model="selectedEdgeDefinition.condition"
              placeholder="workflow.input.amount > 0"
              @change="touch"
            />
            <div class="field-help">{{ t('automation.designer.conditionHelp') }}</div>
          </ElFormItem>
          <ElFormItem>
            <ElCheckbox v-model="selectedEdgeDefinition.defaultBranch" @change="touch">
              {{ t('automation.designer.defaultBranch') }}
            </ElCheckbox>
          </ElFormItem>
        </ElForm>
      </div>
      <div v-else class="property-scroll workflow-settings">
        <ElAlert type="info" :closable="false" :title="t('automation.designer.workflowSettingsHint')" show-icon />
        <ElTabs v-model="workflowTab" stretch class="workflow-json-tabs">
          <ElTabPane :label="t('automation.designer.workflowInputSchema')" name="inputSchema">
            <ConfigCodeEditor
              v-model="workflowJson.inputSchema"
              :rows="14"
              expected-root="object"
              :example="inputSchemaExample"
              :disabled="readonly"
            />
            <div class="json-hint">{{ t('automation.designer.workflowInputHelp') }}</div>
            <ElButton type="primary" :disabled="readonly" @click="applyWorkflowJson('inputSchema')">
              {{ t('automation.designer.applyJson') }}
            </ElButton>
          </ElTabPane>
          <ElTabPane :label="t('automation.designer.workflowVariablesSchema')" name="variablesSchema">
            <ConfigCodeEditor
              v-model="workflowJson.variablesSchema"
              :rows="14"
              expected-root="object"
              :disabled="readonly"
            />
            <div class="json-hint">{{ t('automation.designer.workflowVariablesHelp') }}</div>
            <ElButton type="primary" :disabled="readonly" @click="applyWorkflowJson('variablesSchema')">
              {{ t('automation.designer.applyJson') }}
            </ElButton>
          </ElTabPane>
          <ElTabPane :label="t('automation.designer.workflowOutputSchema')" name="outputSchema">
            <ConfigCodeEditor
              v-model="workflowJson.outputSchema"
              :rows="14"
              expected-root="object"
              :example="outputSchemaExample"
              :disabled="readonly"
            />
            <div class="json-hint">{{ t('automation.designer.workflowOutputHelp') }}</div>
            <ElButton type="primary" :disabled="readonly" @click="applyWorkflowJson('outputSchema')">
              {{ t('automation.designer.applyJson') }}
            </ElButton>
          </ElTabPane>
          <ElTabPane :label="t('automation.designer.finalOutput')" name="finalOutput">
            <ConfigCodeEditor
              v-model="workflowJson.finalOutput"
              :rows="14"
              expected-root="array"
              :example="finalOutputExample"
              :disabled="readonly"
            />
            <div class="json-hint">{{ t('automation.designer.finalOutputHelp') }}</div>
            <ElButton type="primary" :disabled="readonly" @click="applyWorkflowJson('finalOutput')">
              {{ t('automation.designer.applyJson') }}
            </ElButton>
          </ElTabPane>
          <ElTabPane :label="t('automation.designer.resourceBindings')" name="resourceBindings">
            <ConfigCodeEditor
              v-model="workflowJson.resourceBindings"
              :rows="14"
              expected-root="array"
              :disabled="readonly"
            />
            <div class="json-hint">{{ t('automation.designer.resourceBindingsHelp') }}</div>
            <ElButton type="primary" :disabled="readonly" @click="applyWorkflowJson('resourceBindings')">
              {{ t('automation.designer.applyJson') }}
            </ElButton>
          </ElTabPane>
        </ElTabs>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.workflow-designer {
  display: grid;
  grid-template-columns: 224px minmax(0, 1fr) 292px;
  height: 100%;
  min-height: 560px;
  background: #f4f6f8;
  border: 1px solid #dfe3e8;
}
.designer-left,
.designer-right {
  min-width: 0;
  background: #fff;
  overflow: hidden;
}
.designer-left {
  border-right: 1px solid #e5e8eb;
}
.designer-right {
  border-left: 1px solid #e5e8eb;
}
.panel-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 44px;
  border-bottom: 1px solid #e7eaee;
}
.panel-tabs button {
  border: 0;
  background: transparent;
  color: #68707a;
  font-size: 13px;
  cursor: pointer;
}
.panel-tabs button.active {
  color: #176b87;
  box-shadow: inset 0 -2px #176b87;
  font-weight: 600;
}
.palette-scroll,
.variable-tree,
.property-scroll {
  height: calc(100% - 44px);
  overflow: auto;
}
.palette-section {
  padding: 14px 12px 4px;
}
.palette-title {
  margin-bottom: 9px;
  color: #7a828c;
  font-size: 12px;
  font-weight: 600;
}
.palette-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
}
.palette-item {
  display: flex;
  min-width: 0;
  height: 66px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  background: #fff;
  color: #3f4750;
  font-size: 12px;
  cursor: grab;
}
.palette-item:hover {
  border-color: #7aa6b7;
  background: #f7fbfc;
}
.palette-item:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.palette-icon {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border-radius: 5px;
  font-size: 17px;
}
.variable-tree {
  padding: 10px 6px;
}
.variable-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: #4d5660;
  font-size: 12px;
  cursor: pointer;
}
.variable-row:disabled {
  color: #303840;
  cursor: default;
  font-weight: 600;
}
.designer-canvas {
  position: relative;
  min-width: 0;
  overflow: hidden;
}
.canvas-toolbar {
  position: absolute;
  z-index: 5;
  top: 10px;
  left: 50%;
  display: flex;
  height: 38px;
  align-items: center;
  padding: 0 8px;
  border: 1px solid #dfe4e8;
  border-radius: 6px;
  background: rgb(255 255 255 / 96%);
  box-shadow: 0 4px 14px rgb(28 39 49 / 10%);
  transform: translateX(-50%);
}
.toolbar-separator {
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: #e1e5e8;
}
.canvas-count {
  margin: 0 7px;
  color: #7a828a;
  font-size: 12px;
  white-space: nowrap;
}
.automation-flow {
  width: 100%;
  height: 100%;
}
.workflow-node {
  --node-tone: #495057;
  display: flex;
  width: 174px;
  height: 58px;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border: 1px solid #d8dde2;
  border-left: 4px solid var(--node-tone);
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 2px 6px rgb(32 42 50 / 8%);
}
.workflow-node.selected {
  border-color: var(--node-tone);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--node-tone) 20%, transparent);
}
.workflow-node.invalid {
  outline: 2px solid #d14343;
}
.node-icon {
  display: grid;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 5px;
  background: color-mix(in srgb, var(--node-tone) 10%, white);
  color: var(--node-tone);
  font-size: 18px;
}
.node-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}
.node-copy strong,
.node-copy span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.node-copy strong {
  color: #2d343b;
  font-size: 13px;
  font-weight: 600;
}
.node-copy span {
  color: #8a929b;
  font-size: 11px;
}
.property-header {
  display: flex;
  height: 44px;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid #e7eaee;
  color: #343c44;
  font-size: 13px;
  font-weight: 600;
}
.property-scroll {
  padding: 14px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 10px;
}
.advanced-config {
  margin-bottom: 12px;
}
.json-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}
.field-help,
.json-hint {
  width: 100%;
  color: var(--el-text-color-secondary);
  font-size: 11px;
  line-height: 1.55;
}
.field-help {
  margin-top: 5px;
}
.json-hint {
  margin-top: 7px;
}
.advanced-json-tabs :deep(.el-tabs__item) {
  padding: 0 8px;
  font-size: 12px;
}
.workflow-settings {
  height: calc(100% - 44px);
  overflow-y: auto;
}
.workflow-settings :deep(.el-alert) {
  margin-bottom: 10px;
}
.workflow-json-tabs :deep(.el-tabs__item) {
  padding: 0 7px;
  font-size: 11px;
}
.workflow-json-tabs :deep(.el-tab-pane > .el-button) {
  width: 100%;
  margin-top: 10px;
}
.empty-property {
  display: flex;
  height: calc(100% - 44px);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #9aa1a8;
  font-size: 12px;
}
.empty-property :deep(svg) {
  font-size: 28px;
}
:deep(.vue-flow__handle) {
  width: 8px;
  height: 8px;
  border: 2px solid #fff;
  background: var(--node-tone);
}
:deep(.vue-flow__edge.selected .vue-flow__edge-path) {
  stroke: #176b87;
  stroke-width: 2.5;
}
:deep(.vue-flow__minimap) {
  border: 1px solid #dde2e6;
  border-radius: 5px;
  background: #fff;
}
:deep(.el-form-item) {
  margin-bottom: 13px;
}
:deep(.el-form-item__label) {
  color: #68717a;
  font-size: 12px;
}
:deep(.el-input-number) {
  width: 100%;
}
@media (max-width: 1100px) {
  .workflow-designer {
    grid-template-columns: 190px minmax(480px, 1fr) 260px;
    overflow-x: auto;
  }
}
</style>
