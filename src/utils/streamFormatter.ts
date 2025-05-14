export function streamToStdout(chunk: string): void {
  process.stdout.write(chunk);
}
