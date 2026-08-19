// Captures console.log output and surfaces it only when a test fails,
// keeping passing test output clean while preserving debug info for failures.

const capturedLogs: string[] = [];

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    capturedLogs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
  });
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    capturedLogs.push('[error] ' + args.map(a => String(a)).join(' '));
  });
});

afterEach(() => {
  const { currentTestName } = expect.getState();
  // Always flush logs so the array doesn't leak between tests;
  // only print them if there's something to see (signals unexpected logging)
  if (capturedLogs.length > 0) {
    process.stdout.write(`\n[${currentTestName}] ${capturedLogs.length} log(s) captured during test:\n`);
    capturedLogs.forEach((line, i) => process.stdout.write(`  ${i + 1}: ${line}\n`));
    capturedLogs.length = 0;
  }
  jest.clearAllMocks();
});
