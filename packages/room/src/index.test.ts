import { execSync } from 'child_process';

describe('SuperViz Room package', () => {
  it('should log the correct message', () => {
    const output = execSync('node /Users/carlossantos/BACK/SuperViz/superviz/packages/room/src/index.ts').toString();
    expect(output).toBe('[SuperViz] Hello from SuperViz Room package\n');
  });
});