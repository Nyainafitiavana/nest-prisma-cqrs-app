import { Test } from '@nestjs/testing';
import { CreateTaskHandler } from './create-task.handler';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaskCommand } from '../impl/create-task.command';
import { EventBus } from '@nestjs/cqrs';

// Interfaces pour les mocks
interface MockPrismaService {
  task: {
    create: jest.Mock;
  };
}

interface MockEventBus {
  publish: jest.Mock;
}

describe('CreateTaskHandler', () => {
  let handler: CreateTaskHandler;
  let prismaService: MockPrismaService;
  let eventBus: MockEventBus;

  beforeEach(async () => {
    // Créer les mocks typés
    const mockPrismaService: MockPrismaService = {
      task: {
        create: jest.fn(),
      },
    };

    const mockEventBus: MockEventBus = {
      publish: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CreateTaskHandler,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EventBus,
          useValue: mockEventBus, // <-- AJOUT IMPORTANT
        },
      ],
    }).compile();

    handler = moduleRef.get<CreateTaskHandler>(CreateTaskHandler);
    prismaService = moduleRef.get(PrismaService);
    eventBus = moduleRef.get(EventBus);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a task successfully and publish event', async () => {
    const mockTask = {
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      status: 'PENDING' as const,
      createdAt: new Date('2024-01-15T10:00:00.000Z'),
      updatedAt: new Date('2024-01-15T10:00:00.000Z'),
    };

    prismaService.task.create.mockResolvedValue(mockTask);

    const command = new CreateTaskCommand('Test Task', 'Test Description');
    const result = await handler.execute(command);

    // Vérifications
    expect(result).toEqual(mockTask);
    expect(prismaService.task.create).toHaveBeenCalledWith({
      data: {
        title: 'Test Task',
        description: 'Test Description',
        status: 'PENDING',
      },
    });

    // Vérifie que l'event a été publié
    expect(eventBus.publish).toHaveBeenCalledTimes(1);
    expect(eventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: '1',
        title: 'Test Task',
        createdAt: mockTask.createdAt,
      }),
    );
  });
});
