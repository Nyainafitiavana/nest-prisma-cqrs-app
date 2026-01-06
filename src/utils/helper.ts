import express from 'express';

export type QueryParams = {
  limit: number | null;
  page: number | null;
  value: string | null;
};

export default class Helper {
  calculateOffset(limit: number, page?: number): number {
    if (!page || page <= 1) {
      return 0;
    }
    return (page - 1) * limit;
  }

  buildQueryParams(req: express.Request): QueryParams {
    const limit: number | null = req.query.limit
      ? Number(req.query.limit)
      : null;
    const page: number | null = req.query.page ? Number(req.query.page) : null;
    const value: string = req.query.value ? (req.query.value as string) : '';

    return { limit: limit, page: page, value: value };
  }
}
