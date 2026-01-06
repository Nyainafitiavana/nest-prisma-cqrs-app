import { Module, Type } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ICommandHandler, IQueryHandler, IEventHandler } from '@nestjs/cqrs';
import { TasksController } from './tasks.controller';
import { PrismaService } from '../prisma/prisma.service';

// Command Handlers
import { CreateTaskHandler } from './commands/handlers/create-task.handler';
import { UpdateTaskHandler } from './commands/handlers/update-task.handler';
import { DeleteTaskHandler } from './commands/handlers/delete-task.handler';

// Query Handlers
import { GetTaskHandler } from './queries/handlers/get-task.handler';
import { GetAllTasksHandler } from './queries/handlers/get-all-tasks.handler';

// Event Handlers
import { TaskCreatedHandler } from './events/handlers/task-created.handler';
import Helper from '../utils/helper';

// Types explicites
export const CommandHandlers: Array<Type<ICommandHandler>> = [
  CreateTaskHandler,
  UpdateTaskHandler,
  DeleteTaskHandler,
];

export const QueryHandlers: Array<Type<IQueryHandler>> = [
  GetTaskHandler,
  GetAllTasksHandler,
];

export const EventHandlers: Array<Type<IEventHandler>> = [TaskCreatedHandler];

@Module({
  imports: [CqrsModule],
  controllers: [TasksController],
  providers: [
    PrismaService,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    Helper,
  ],
})
export class TasksModule {}
