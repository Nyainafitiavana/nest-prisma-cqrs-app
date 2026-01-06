export class GetAllTasksQuery {
  constructor(
    public readonly limit: number | null,
    public readonly page: number | null,
    public readonly value: string | null,
  ) {}
}
