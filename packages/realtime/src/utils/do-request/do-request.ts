export async function doRequest<T = any>(
  url: string,
  method: string,
  body: any,
  customHeaders = {},
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
    body: body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    throw response;
  }

  try {
    const data = await response.json();

    return data;
  } catch (error) {
    return { ok: response.ok } as T;
  }
}
