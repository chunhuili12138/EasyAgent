/**
 * 操作手册目录清单
 *
 * 新增文档页面的步骤：
 * 1. 在对应模块的 pages 中追加条目（key 唯一）。
 * 2. 创建内容文件 `content/zh-CN/<file>` 与 `content/en-US/<file>`（英文暂缺时页面会显示"编写中"占位）。
 * 3. 在 `src/locales/langs/{zh-cn,en-us}.ts` 的 route 中补充路由标题（可选）。
 */
export const docsManifest: Docs.ModuleDef[] = [
  {
    key: 'overview',
    zhTitle: '平台概述',
    enTitle: 'Overview',
    icon: 'mdi:home-outline',
    pages: [
      { key: 'overview', file: 'overview.md', zhTitle: '平台概述与使用流程', enTitle: 'Platform Overview & Workflow' }
    ]
  },
  {
    key: 'system',
    zhTitle: '账号与组织',
    enTitle: 'Account & Organization',
    icon: 'mdi:account-group-outline',
    pages: [
      { key: 'system-department', file: 'system/department.md', zhTitle: '部门管理', enTitle: 'Department Management' },
      { key: 'system-post', file: 'system/post.md', zhTitle: '岗位管理', enTitle: 'Post Management' },
      { key: 'system-user', file: 'system/user.md', zhTitle: '用户管理', enTitle: 'User Management' },
      { key: 'system-message', file: 'system/message.md', zhTitle: '消息通知', enTitle: 'Messages' }
    ]
  },
  {
    key: 'document',
    zhTitle: '文档处理',
    enTitle: 'Document Processing',
    icon: 'mdi:file-document-multiple-outline',
    pages: [
      { key: 'document-file', file: 'document/file.md', zhTitle: '文件管理', enTitle: 'File Management' },
      { key: 'document-parse', file: 'document/parse.md', zhTitle: '解析管理', enTitle: 'Parse Management' },
      { key: 'document-process', file: 'document/process.md', zhTitle: '数据处理', enTitle: 'Data Processing' },
      { key: 'document-kb', file: 'document/kb.md', zhTitle: '知识库', enTitle: 'Knowledge Base' }
    ]
  },
  {
    key: 'rag',
    zhTitle: 'Agent 管理',
    enTitle: 'Agent Management',
    icon: 'mdi:robot-industrial-outline',
    pages: [
      { key: 'rag-datasource', file: 'rag/datasource.md', zhTitle: '数据源管理', enTitle: 'Datasource Management' },
      { key: 'rag-tool', file: 'rag/tool.md', zhTitle: '工具管理', enTitle: 'API Tool Management' },
      { key: 'rag-mcp', file: 'rag/mcp.md', zhTitle: 'MCP 配置', enTitle: 'MCP Integration' },
      { key: 'rag-skill', file: 'rag/skill.md', zhTitle: 'Skill 管理', enTitle: 'Skill Management' },
      { key: 'rag-experience', file: 'rag/experience.md', zhTitle: '经验池', enTitle: 'Experience Pool' },
      { key: 'rag-bad-case', file: 'rag/bad-case.md', zhTitle: 'Bad Case 分析', enTitle: 'Bad Case Analysis' },
      { key: 'rag-audit', file: 'rag/audit.md', zhTitle: '操作审计', enTitle: 'Operation Audit' },
      { key: 'rag-sql-log', file: 'rag/sql-log.md', zhTitle: 'SQL 审计', enTitle: 'SQL Audit' }
    ]
  },
  {
    key: 'agent-workbench',
    zhTitle: 'Agent 工作台',
    enTitle: 'Agent Workbench',
    icon: 'mdi:robot-happy-outline',
    pages: [{ key: 'chat', file: 'chat.md', zhTitle: '智能会话', enTitle: 'Intelligent Chat' }]
  },
  {
    key: 'automation',
    zhTitle: '自动化中心',
    enTitle: 'Automation Center',
    icon: 'mdi:transit-connection-variant',
    pages: [
      { key: 'automation-workflow', file: 'automation/workflow.md', zhTitle: '工作流设计', enTitle: 'Workflow Design' },
      {
        key: 'automation-trigger',
        file: 'automation/trigger.md',
        zhTitle: '触发器管理',
        enTitle: 'Trigger Management'
      },
      { key: 'automation-run', file: 'automation/run.md', zhTitle: '运行实例', enTitle: 'Run Instances' },
      { key: 'automation-log', file: 'automation/log.md', zhTitle: '执行日志', enTitle: 'Execution Logs' },
      { key: 'automation-failure', file: 'automation/failure.md', zhTitle: '失败任务', enTitle: 'Failure Tasks' },
      { key: 'automation-event', file: 'automation/event.md', zhTitle: '事件记录', enTitle: 'Event Records' },
      { key: 'automation-statistics', file: 'automation/statistics.md', zhTitle: '运行统计', enTitle: 'Run Statistics' }
    ]
  }
];
