import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { CreateTaskCommand } from '../impl/create-task.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { TaskCreatedEvent } from '../../events/impl/task-created.event';

@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<CreateTaskCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus, // Inject EventBus
  ) {}

  async execute(command: CreateTaskCommand) {
    const { title, description } = command;

    const task = await this.prisma.task.create({
      data: {
        title,
        description,
        status: 'PENDING',
      },
    });

    // Émettre l'événement
    this.eventBus.publish(
      new TaskCreatedEvent(task.id, task.title, task.createdAt),
    );

    return task;
  }
}
