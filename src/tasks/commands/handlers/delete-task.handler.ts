import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { DeleteTaskCommand } from '../impl/delete-task.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { ExecuteResponse } from '../../../utils/custom.interface';
import { HttpStatus } from '@nestjs/common';
import { MESSAGE } from '../../../utils/constant';
import { GetTaskQuery } from '../../queries/impl/get-task.query';

@CommandHandler(DeleteTaskCommand)
export class DeleteTaskHandler implements ICommandHandler<DeleteTaskCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: DeleteTaskCommand): Promise<ExecuteResponse> {
    //Find if task exist
    await this.queryBus.execute(new GetTaskQuery(command.id));

    await this.prisma.task.delete({
      where: { id: command.id },
    });

    return { message: MESSAGE.OK, statusCode: HttpStatus.OK };
  }
}
