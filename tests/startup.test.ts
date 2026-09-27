import { spawn } from 'node:child_process';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { describe, expect, test } from 'vitest';
import { useMongoMemoryServer } from './support/mongo.ts';

async function runStartup(uri?: string) {
  const env: NodeJS.ProcessEnv = { ...process.env, PORT: '0' };
  delete env.MONGODB_URI;
  if (uri !== undefined) env.MONGODB_URI = uri;

  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: process.cwd(),
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return new Promise<{ output: string; exitCode: number | null }>(
    (resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error(`Startup did not finish: ${output}`));
      }, 10_000);

      child.stdout.on('data', (chunk: Buffer) => {
        output += chunk.toString();
        if (output.includes('Server is running on port 0')) child.kill();
      });
      child.stderr.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });
      child.once('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.once('close', (exitCode) => {
        clearTimeout(timeout);
        resolve({ output, exitCode });
      });
    }
  );
}

describe('server startup', () => {
  const mongo = useMongoMemoryServer();

  test('connects before accepting HTTP requests', async () => {
    const result = await runStartup(mongo.uri);
    expect(result.output).toContain('MongoDB connected');
    expect(result.output).toContain('Server is running on port 0');
    expect(result.output.indexOf('MongoDB connected')).toBeLessThan(
      result.output.indexOf('Server is running on port 0')
    );
  });

  test.each([undefined, 'not-a-mongodb-uri'])(
    'does not listen when MONGODB_URI is %s',
    async (uri) => {
      const result = await runStartup(uri);
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain(
        `"reason":"${uri === undefined ? 'missing_uri' : 'invalid_uri'}"`
      );
      expect(result.output).not.toContain('Server is running');
      expect(result.output).not.toContain(uri ?? 'undefined');
    }
  );

  test('reports rejected credentials without exposing the URI or password', async () => {
    const server = await MongoMemoryServer.create({
      auth: {
        enable: true,
        customRootName: 'testuser',
        customRootPwd: 'correct-password',
      },
    });
    try {
      const uri = new URL(server.getUri());
      uri.username = 'testuser';
      uri.password = 'wrong-password';
      uri.searchParams.set('authSource', 'admin');

      const result = await runStartup(uri.toString());
      expect(result.exitCode).toBe(1);
      expect(result.output).toContain('"reason":"authentication_failed"');
      expect(result.output).not.toContain('Server is running');
      expect(result.output).not.toContain('wrong-password');
      expect(result.output).not.toContain(uri.toString());
    } finally {
      await server.stop();
    }
  });
});
