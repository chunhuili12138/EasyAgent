export const DOC_TYPES = [
  '批复',
  '通知',
  '报告',
  '合同',
  '手册',
  '论文',
  '专利',
  '标准',
  '函',
  '纪要',
  '通报',
  '决定',
  '公告',
  '方案',
  '细则',
  '协议',
  '制度',
  '流程',
  '白皮书',
  '说明书',
  '操作手册',
  '其他'
] as const;

export const ACL_MODES = [
  { labelKey: 'page.manage.process.publicAccess', value: 'public' },
  { labelKey: 'page.manage.process.deptOnly', value: 'department' },
  { labelKey: 'page.manage.process.postOnly', value: 'post' },
  { labelKey: 'page.manage.process.userOnly', value: 'user' }
] as const;
