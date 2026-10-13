/** Subscribe before fetching, then resync after every socket join. */
export function connectRoom({ subscribe, fetchSnapshot, receive, fail, syncing }) {
  let closed = false;
  let latestRequest = 0;
  let receivedBroadcasts = 0;
  const refresh = async () => {
    const request = ++latestRequest;
    const broadcastsAtStart = receivedBroadcasts;
    try {
      const payload = await fetchSnapshot();
      if (!closed) receive(payload);
    } catch (error) {
      if (!closed && request === latestRequest && broadcastsAtStart === receivedBroadcasts) fail(error.message);
    }
  };
  const unsubscribe = subscribe(
    (payload) => { if (!closed) { receivedBroadcasts += 1; receive(payload); } },
    (status) => {
      if (closed) return;
      if (status === 'SUBSCRIBED') refresh();
      else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) syncing();
    },
  );
  refresh();
  return {
    refresh,
    close() { closed = true; unsubscribe(); },
  };
}
