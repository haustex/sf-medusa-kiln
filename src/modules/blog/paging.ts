/** "2" -> 2. Only plain positive numbers ("02", "2a", "0" are not pages). */
export const parsePageParam = (v: string): number | null => (/^[1-9]\d{0,3}$/.test(v) ? Number(v) : null)

/** Slugs of articles and blog categories: lowercase letters, digits and hyphens */
export const isBlogSlug = (v: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v) && v.length <= 80
