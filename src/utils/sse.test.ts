import assert from 'node:assert/strict';
import test from 'node:test';
import { createSseParser, type SseEvent } from './sse';

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
