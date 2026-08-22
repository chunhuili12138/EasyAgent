import assert from 'node:assert/strict';
import test from 'node:test';
import { type SseEvent, createSseParser, incompleteChatStreamMessage } from './sse';

test('parses Spring SseEmitter events without spaces after colons', () => {
  const events: SseEvent[] = [];
  const parser = createSseParser(event => events.push(event));

  parser.push('event:thinking\ndata:{"content":"searching"}\n\n');
  parser.push('event:token\ndata:{"content":"answer"}\n\n');
  parser.finish();

  assert.deepEqual(events, [
    { event: 'thinking', data: '{"content":"searching"}' },
    { event: 'token', data: '{"content":"answer"}' }
  ]);
});

test('handles chunk boundaries, CRLF, optional spaces and trailing events', () => {
  const events: SseEvent[] = [];
  const parser = createSseParser(event => events.push(event));

  parser.push('event: tok');
  parser.push('en\r\ndata: {"content":');
  parser.push('"part"}\r\n');
  parser.finish();

  assert.deepEqual(events, [{ event: 'token', data: '{"content":"part"}' }]);
});

test('dispatches done immediately when its event block is complete', () => {
  const events: SseEvent[] = [];
  const parser = createSseParser(event => events.push(event));

  parser.push('event:done\ndata:{"messageId":7}\n\n');

  assert.deepEqual(events, [{ event: 'done', data: '{"messageId":7}' }]);
});

test('does not silently accept a chat stream that closes without a terminal event', () => {
  assert.equal(incompleteChatStreamMessage('', false, '[连接已中断，未收到完整响应]'), '[连接已中断，未收到完整响应]');
  assert.equal(
    incompleteChatStreamMessage('已收到部分结果', false, '[连接已中断，响应未完整结束]'),
    '已收到部分结果\n[连接已中断，响应未完整结束]'
  );
  assert.equal(incompleteChatStreamMessage('完整结果', true, '[连接已中断]'), null);
});
