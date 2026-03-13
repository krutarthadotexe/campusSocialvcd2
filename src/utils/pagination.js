export function encodeCursor(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export function decodeCursor(cursor) {
  if (!cursor) {
    return null;
  }

  return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
}

export function buildCursorMeta(items, limit, getCursorPayload) {
  const hasMore = items.length > limit;
  const slicedItems = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? encodeCursor(getCursorPayload(slicedItems.at(-1))) : null;

  return {
    items: slicedItems,
    meta: {
      nextCursor,
      hasMore
    }
  };
}
