export function groupFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const groupIdStr = localStorage.getItem("groupId");
  const headers = new Headers(options.headers);
  if (groupIdStr) {
    headers.set("x-group-id", groupIdStr);
  }
  return fetch(url, { ...options, headers });
}
