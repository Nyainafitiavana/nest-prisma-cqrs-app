import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTaskQuery } from '../impl/get-task.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { Task } from '../../../../generated/prisma/client';

@QueryHandler(GetTaskQuery)
export class GetTaskHandler implements IQueryHandler<GetTaskQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTaskQuery): Promise<Task> {
    const task: Task | null = await this.prisma.task.findUnique({
      where: { id: query.id },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${query.id} not found`);
    }

    return task;
  }
}
