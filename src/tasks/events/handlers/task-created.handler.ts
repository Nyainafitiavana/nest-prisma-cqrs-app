import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TaskCreatedEvent } from '../impl/task-created.event';

@EventsHandler(TaskCreatedEvent)
export class TaskCreatedHandler implements IEventHandler<TaskCreatedEvent> {
  handle(event: TaskCreatedEvent) {
    console.log(`Task créée: ${event.taskId} - ${event.title}`);
    // Ici vous pourriez:
    // - Envoyer un email
    // - Mettre à jour un cache
    // - Notifier d'autres services
    // - Mettre à jour une vue dénormalisée
  }
}
