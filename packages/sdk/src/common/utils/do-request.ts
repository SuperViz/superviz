export default async (url: string, method: string, body: any, customHeaders = {}) => {
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
    return response.ok;
  }
};
