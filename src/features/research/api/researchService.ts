export interface ResearchQuery {
  roundId?: string;
  categoryId?: string;
  bucketSize?: number;
}

function buildQuery(params: ResearchQuery & { type?: string } = {}) {
  const query = new URLSearchParams();
  if (params.roundId) query.set("roundId", params.roundId);
  if (params.categoryId) query.set("categoryId", params.categoryId);
  if (params.bucketSize !== undefined) query.set("bucketSize", String(params.bucketSize));
  if (params.type) query.set("type", params.type);
  const text = query.toString();
  return text ? `?${text}` : "";
}

export const researchService = {
  exportPath: (eventId: string, params?: ResearchQuery) =>
    `/api/v1/research/events/${eventId}/export${buildQuery(params)}`,
  exportUrl: (eventId: string, params?: ResearchQuery) =>
    `/api/v1/research/events/${eventId}/export${buildQuery(params)}`,
};
