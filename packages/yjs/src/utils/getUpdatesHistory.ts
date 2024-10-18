export async function getUpdatesHistory(channelName: string, apiKey: string) {
  try {
    const response = await fetch(`https://io.superviz.com/yjs/${channelName}:yjs-provider`, {
      headers: {
        'sv-api-key': apiKey,
      },
    });

    if (response.status !== 200) {
      return [];
    }

    const updates: { events: { update: { type: string; data: [] } }[] } = await response.json();
    return updates.events.map((data) => new Uint8Array(data.update.data));
  } catch (err) {
    return [];
  }
}
