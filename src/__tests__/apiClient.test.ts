import { apiClient } from '../api/client';

describe('apiClient request headers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('posts record search requests with range and categoryIds in the body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await apiClient.getRecords({
      range: 'month',
      categoryIds: ['food', 'transport'],
    } as any);

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/records/search',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          range: 'month',
          categoryIds: ['food', 'transport'],
        }),
      }),
    );
  });

  it('does not send content-type for delete requests without a body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await apiClient.deleteRecord('record-123');

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/records/record-123',
      expect.objectContaining({
        method: 'DELETE',
      }),
    );

    const [, init] = fetchSpy.mock.calls[0] ?? [];
    expect(init?.headers).not.toHaveProperty('Content-Type');
  });
});
