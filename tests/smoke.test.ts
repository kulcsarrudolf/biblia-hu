import { readFileSync } from 'fs';
import { join } from 'path';
import { VERSION } from '../src';

describe('package entry point', () => {
  it('exports VERSION matching package.json', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));
    expect(VERSION).toBe(pkg.version);
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
