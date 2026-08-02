declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare namespace Docs {
  /** 文档语言 */
  type Locale = 'zh-CN' | 'en-US';

  /** 单篇文档定义 */
  interface PageDef {
    /** 页面唯一标识，用于路由 query 与侧边栏选中 */
    key: string;
    /** 内容文件相对路径（不含语言目录），如 rag/skill.md */
    file: string;
    /** 中文标题 */
    zhTitle: string;
    /** 英文标题 */
    enTitle: string;
  }

  /** 模块定义 */
  interface ModuleDef {
    /** 模块唯一标识 */
    key: string;
    /** 模块中文标题 */
    zhTitle: string;
    /** 模块英文标题 */
    enTitle: string;
    /** 模块图标（Iconify） */
    icon: string;
    /** 模块下的页面 */
    pages: Docs.PageDef[];
  }

  /** 页内目录条目 */
  interface TocItem {
    id: string;
    text: string;
    level: number;
  }
}
