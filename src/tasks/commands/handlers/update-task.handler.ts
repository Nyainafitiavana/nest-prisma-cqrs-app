import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { UpdateTaskCommand } from '../impl/update-task.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExecuteResponse } from '../../../utils/custom.interface';
import { MESSAGE } from '../../../utils/constant';
import { HttpStatus } from '@nestjs/common';
import { GetTaskQuery } from '../../queries/impl/get-task.query';

@CommandHandler(UpdateTaskCommand)
export class UpdateTaskHandler implements ICommandHandler<UpdateTaskCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: UpdateTaskCommand): Promise<ExecuteResponse> {
    const { id, updateTaskDto } = command;
    const { title, description, status } = updateTaskDto;

    //Find if task exist
    await this.queryBus.execute(new GetTaskQuery(id));

    await this.prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
      },
    });

    return { message: MESSAGE.OK, statusCode: HttpStatus.OK };
  }
}
