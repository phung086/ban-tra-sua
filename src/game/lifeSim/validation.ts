/** T1-03: authored episode data is validated before gameplay integration. */
export type EpisodeValidation = { ok: true; errors: [] } | { ok: false; errors: string[] };
export function validateEpisode(value: unknown): EpisodeValidation {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { ok: false, errors: ['episode: expected object'] };
  return { ok: true, errors: [] };
}
