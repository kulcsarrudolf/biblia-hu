import { createServer, type Server } from 'http';
import { AddressInfo } from 'net';

import { clearCache, loadBook, DEFAULT_DATA_BASE_URL } from '../src/data/loader';
import { isBibliaError } from '../src/errors';
import { TRANSLATIONS } from '../src/translations';
import type { Translation } from '../src/types';

const RUF = TRANSLATIONS.RUF;

/**
 * A translation whose data directory does not exist, pointed at a port nothing
 * listens on, so both the local read and the fetch fallback fail.
 */
const UNAVAILABLE: Translation = {
  ...RUF,
  dataDir: 'nincs-ilyen-konyvtar',
};

/** Discard, port 9, refuses immediately instead of hanging. */
const UNREACHABLE_BASE_URL = 'http://127.0.0.1:9';

/** Starts a local stand in for the data host and returns its base url. */
const listen = (server: Server): Promise<string> =>
  new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo;
      resolve(`http://127.0.0.1:${port}`);
    });
  });

const close = (server: Server): Promise<void> =>
  new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });

describe('loadBook', () => {
  beforeEach(() => {
    clearCache();
  });

  afterAll(() => {
    clearCache();
  });

  it('reads a bundled book from disk', async () => {
    const genesis = await loadBook(RUF, 'GEN');

    expect(genesis).toHaveLength(50);
    expect(genesis[0].verses[0].text).toContain('Kezdetben teremtette Isten');
  });

  it('memoizes so repeated calls return the same instance', async () => {
    const first = await loadBook(RUF, 'RUT');
    const second = await loadBook(RUF, 'RUT');

    expect(second).toBe(first);
  });

  it('caches per book, so different books are different instances', async () => {
    const ruth = await loadBook(RUF, 'RUT');
    const jonah = await loadBook(RUF, 'JON');

    expect(jonah).not.toBe(ruth);
  });

  it('re-reads after clearCache', async () => {
    const first = await loadBook(RUF, 'PHM');
    clearCache();
    const second = await loadBook(RUF, 'PHM');

    expect(second).not.toBe(first);
    expect(second).toEqual(first);
  });

  it('rejects with DATA_UNAVAILABLE when neither disk nor network has the book', async () => {
    expect.assertions(3);

    try {
      await loadBook(UNAVAILABLE, 'GEN', { dataBaseUrl: UNREACHABLE_BASE_URL });
    } catch (error) {
      expect(isBibliaError(error)).toBe(true);
      expect((error as { code: string }).code).toBe('DATA_UNAVAILABLE');
      expect((error as Error).message).toContain('nincs-ilyen-konyvtar');
    }
  });

  it('does not cache a failed load', async () => {
    const first = loadBook(UNAVAILABLE, 'RUT', { dataBaseUrl: UNREACHABLE_BASE_URL });
    await expect(first).rejects.toThrow();

    const second = loadBook(UNAVAILABLE, 'RUT', { dataBaseUrl: UNREACHABLE_BASE_URL });
    await expect(second).rejects.toThrow();
    expect(second).not.toBe(first);
  });

  it('falls back to the base url when the file is not on disk', async () => {
    const paths: string[] = [];
    const server = createServer((request, response) => {
      paths.push(request.url ?? '');
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify([{ chapter: 1, verses: [{ verse: 1, text: 'Távoli.' }] }]));
    });
    const baseUrl = await listen(server);

    try {
      const data = await loadBook(UNAVAILABLE, 'OBA', { dataBaseUrl: baseUrl });

      expect(data).toEqual([{ chapter: 1, verses: [{ verse: 1, text: 'Távoli.' }] }]);
      expect(paths).toEqual(['/json/nincs-ilyen-konyvtar/OBA.json']);
    } finally {
      await close(server);
    }
  });

  it('treats a non 2xx response as unavailable', async () => {
    const server = createServer((_request, response) => {
      response.writeHead(404);
      response.end();
    });
    const baseUrl = await listen(server);

    try {
      await expect(loadBook(UNAVAILABLE, 'JON', { dataBaseUrl: baseUrl })).rejects.toThrow(
        'HTTP 404',
      );
    } finally {
      await close(server);
    }
  });

  it('defaults to the published raw.githubusercontent.com base url', () => {
    expect(DEFAULT_DATA_BASE_URL).toBe(
      'https://raw.githubusercontent.com/kulcsarrudolf/biblia-hu/main',
    );
  });
});
