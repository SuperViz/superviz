import { execSync } from 'child_process';

describe('SuperViz Room package', () => {
  it('should log the correct message', () => {
    const output = execSync('node ./src/index.ts').toString();
    expect(output).toBe('[SuperViz] Hello from SuperViz Room package\n');
  });
});