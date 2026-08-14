import { request } from '../request';

const KNOWLEDGE_IMPORT_TIMEOUT_MS = 10 * 60 * 1000;

export interface DirectUploadTicket {
  uploadId: string;
  uploadUrl: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresAt: string;
  fileName: string;
  fileSize: number;
}

export interface FileUploadResult {
  fileId: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: string;
  duplicate: boolean;
}

export function fetchGetFilePage(params?: {
  fileName?: string;
  fileType?: string;
  status?: string;
  current?: number;
  size?: number;
}) {
  return request<{ records: any[]; total: number }>({
    url: '/document/file/page',
    method: 'get',
    params
  });
}

export function fetchInitiateDocumentDirectUpload(data: {
  files: Array<{ fileName: string; fileSize: number; contentType: string }>;
  year?: string;
  docType?: string;
  department?: string;
  departmentId?: number;
  post?: string;
  postId?: number;
  aclMode: string;
  allowedDepts: number[];
  allowedPosts: number[];
  allowedUsers: number[];
}) {
  return request<DirectUploadTicket[]>({ url: '/document/file/direct-upload/initiate', method: 'post', data });
}

export function fetchCompleteDocumentDirectUpload(uploadId: string) {
  return request<FileUploadResult>({ url: `/document/file/direct-upload/${uploadId}/complete`, method: 'post' });
}

export function fetchCancelDocumentDirectUpload(uploadId: string) {
  return request<void>({ url: `/document/file/direct-upload/${uploadId}`, method: 'delete' });
}

export function fetchDocumentAclOptions() {
  return request<{
    departments: Array<{ id: number; name: string; parentId?: number | null }>;
    posts: Array<{ id: number; name: string; departmentId: number }>;
    users: Array<{ id: number; name: string }>;
  }>({ url: '/document/acl/options', method: 'get' });
}

export function fetchGetFileAcl(fileId: number) {
  return request<Array<{ subjectType: string; subjectId: number }>>({
    url: `/document/files/${fileId}/acl`,
    method: 'get'
  });
}

export function fetchUpdateFileAcl(
  fileId: number,
  data: { aclMode: string; aclList: Array<{ subjectType: string; subjectId: number }> }
) {
  return request({ url: `/document/files/${fileId}/acl`, method: 'put', data });
}

export function fetchBatchUpdateFileAcl(
  fileIds: number[],
  data: { aclMode: string; aclList: Array<{ subjectType: string; subjectId: number }> }
) {
  return request({ url: '/document/files/batch-acl', method: 'post', data: { fileIds, ...data } });
}

export function fetchGetFileDetail(id: number) {
  return request<any>({ url: `/document/file/${id}`, method: 'get' });
}

export function fetchDeleteFile(id: number) {
  return request({ url: `/document/file/${id}`, method: 'delete' });
}

export function fetchDownloadFile(id: number) {
  return request<string>({ url: `/document/file/${id}/download`, method: 'get' });
}

export function fetchGetBatchPage(params?: { current?: number; size?: number }) {
  return request<{ records: any[]; total: number }>({
    url: '/document/batch/page',
    method: 'get',
    params
  });
}

export function fetchGetBatchDetail(id: number) {
  return request<any[]>({ url: `/document/batch/${id}`, method: 'get' });
}

export function fetchGetBatchProgress(id: number) {
  return request<any>({ url: `/document/batch/${id}/progress`, method: 'get' });
}

export function fetchDeleteBatch(id: number) {
  return request({ url: `/document/batch/${id}`, method: 'delete' });
}

export function fetchGetParsePage(params?: {
  fileName?: string;
  status?: string;
  processStatus?: string;
  current?: number;
  size?: number;
}) {
  return request<{ records: any[]; total: number }>({
    url: '/document/parse/page',
    method: 'get',
    params
  });
}

export function fetchSubmitParse(fileId: number, force?: boolean) {
  return request<number>({ url: '/document/parse', method: 'post', data: { fileId, force } });
}

export function fetchBatchParse(fileIds: number[], force?: boolean) {
  return request({ url: '/document/parse/batch', method: 'post', data: { fileIds, force } });
}

export function fetchGetParseDetail(id: number) {
  return request<any>({ url: `/document/parse/${id}`, method: 'get' });
}

export function fetchGetParseContent(id: number) {
  return request<string>({ url: `/document/parse/${id}/content`, method: 'get' });
}

export function fetchRetryParse(id: number) {
  return request({ url: `/document/parse/${id}/retry`, method: 'post' });
}

export function fetchDeleteParse(id: number) {
  return request({ url: `/document/parse/${id}`, method: 'delete' });
}

export function fetchParseCheck(fileIds: number[]) {
  return request<{
    direct: Array<{ id: number; fileName: string; status: string }>;
    needConfirm: Array<{ id: number; fileName: string; status: string; hasProcess: boolean; hasChunks: boolean }>;
  }>({
    url: '/document/file/parse-check',
    method: 'get',
    params: { fileIds: fileIds.join(',') }
  });
}

export function fetchGetProcessPage(params?: { fileName?: string; status?: string; current?: number; size?: number }) {
  return request<{ records: any[]; total: number }>({ url: '/document/process/page', method: 'get', params });
}

export function fetchStartProcess(parseTaskId: number, force?: boolean) {
  return request<any>({ url: '/document/process', method: 'post', data: { parseTaskId, force } });
}

export function fetchBatchStartProcess(parseTaskIds: number[], force?: boolean) {
  return request({ url: '/document/process/batch', method: 'post', data: { parseTaskIds, force } });
}

export function fetchGetProcessProgress(processId: number) {
  return request<any>({ url: `/document/process/${processId}/progress`, method: 'get' });
}

export function fetchGetProcessResult(processId: number) {
  return request<any>({ url: `/document/process/${processId}/result`, method: 'get' });
}

export function fetchUpdateChunk(processId: number, chunkId: number, data: any) {
  return request({ url: `/document/process/${processId}/chunk/${chunkId}`, method: 'put', data });
}

export function fetchRetryProcess(processId: number) {
  return request({ url: `/document/process/${processId}/retry`, method: 'post' });
}

export function fetchImportToEs(processId: number) {
  return request({
    url: `/document/process/${processId}/import`,
    method: 'post',
    timeout: KNOWLEDGE_IMPORT_TIMEOUT_MS
  });
}

export function fetchDeleteProcess(processId: number) {
  return request({ url: `/document/process/${processId}`, method: 'delete' });
}

export function fetchUnindexFile(fileId: number) {
  return request({ url: `/document/process/file/${fileId}/unindex`, method: 'post' });
}

export function fetchGetEsDataPage(params?: {
  keyword?: string;
  department?: string;
  securityLevel?: string;
  year?: string;
  docType?: string;
  current?: number;
  size?: number;
}) {
  return request<any>({ url: '/document/kb/data/page', method: 'get', params });
}

export function fetchGetKbStats() {
  return request<any>({ url: '/document/kb/stats', method: 'get' });
}
