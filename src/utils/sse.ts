export interface SseEvent {
  event: string;
  data: string;
}

export function incompleteChatStreamMessage(
  content: string,
  terminalEventReceived: boolean,
  interruptedMessage: string
) {
  if (terminalEventReceived) return null;
  const existing = content.trim();
  return existing ? `${existing}\n${interruptedMessage}` : interruptedMessage;
}

export function createSseParser(onEvent: (event: SseEvent) => void) {
  let buffer = '';
  let eventName = '';
  let dataLines: string[] = [];

  function dispatch() {
    if (dataLines.length) {
      onEvent({ event: eventName || 'message', data: dataLines.join('\n') });
    }
    eventName = '';
    dataLines = [];
  }

  function processLine(rawLine: string) {
    const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;
    if (!line) {
      dispatch();
      return;
    }
    if (line.startsWith(':')) return;

    const separator = line.indexOf(':');
    const field = separator >= 0 ? line.slice(0, separator) : line;
    let value = separator >= 0 ? line.slice(separator + 1) : '';
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') eventName = value;
    if (field === 'data') dataLines.push(value);
  }

  return {
    push(chunk: string) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      lines.forEach(processLine);
    },
    finish() {
      if (buffer) processLine(buffer);
      buffer = '';
      dispatch();
    }
  };
}
