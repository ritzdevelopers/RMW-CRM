export interface PageParams {
  page: number;
  pageSize: number;
  offset: number;
}

export function parsePagination(query: Record<string, any>): PageParams {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export interface Paginated<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export function paginate<T>(data: T[], total: number, p: PageParams): Paginated<T> {
  return {
    data,
    pagination: {
      page: p.page,
      pageSize: p.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / p.pageSize)),
    },
  };
}

/** Whitelist-based sort clause builder to prevent SQL injection on ORDER BY. */
export function buildSort(
  sortBy: string | undefined,
  order: string | undefined,
  allowed: Record<string, string>,
  fallback: string,
): string {
  const column = (sortBy && allowed[sortBy]) || fallback;
  const dir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return `${column} ${dir}`;
}
