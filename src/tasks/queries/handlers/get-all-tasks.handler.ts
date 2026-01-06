import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllTasksQuery } from '../impl/get-all-tasks.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { Paginate } from '../../../utils/custom.interface';
import { Prisma, Task } from '../../../../generated/prisma/client';
import Helper from '../../../utils/helper';

@QueryHandler(GetAllTasksQuery)
export class GetAllTasksHandler implements IQueryHandler<GetAllTasksQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helper: Helper,
  ) {}

  async execute(params: GetAllTasksQuery): Promise<Paginate<Task[]>> {
    const { limit, page, value } = params;

    const query: Prisma.TaskFindManyArgs = {
      select: {
        id: true,
        title: true,
        description: true,
      },
      orderBy: { id: 'asc' },
      where: value
        ? {
            OR: [
              { title: { contains: value, mode: 'insensitive' } },
              { description: { contains: value, mode: 'insensitive' } },
            ],
          }
        : undefined,
    };

    if (limit && page) {
      const offset: number = this.helper.calculateOffset(limit, page);
      query.take = limit;
      query.skip = offset;
    }

    const [data, count] = await this.prisma.$transaction([
      this.prisma.task.findMany(query),
      this.prisma.task.count({ where: query.where }),
    ]);

    return { data: data, totalRows: count, page: page ?? 1 };
  }
}
