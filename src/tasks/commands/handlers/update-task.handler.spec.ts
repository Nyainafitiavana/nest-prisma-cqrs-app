// src/tasks/commands/handlers/update-task.handler.spec.ts
import { Test } from '@nestjs/testing';
import { UpdateTaskHandler } from './update-task.handler';
import { UpdateTaskCommand } from '../impl/update-task.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryBus } from '@nestjs/cqrs';
import { GetTaskQuery } from '../../queries/impl/get-task.query';
import { MESSAGE } from '../../../utils/constant';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { ExecuteResponse } from '../../../utils/custom.interface';
import { Task } from '../../../../generated/prisma/client';
import { UpdateTaskDto } from '../../dto/update-task.dto';

describe('UpdateTaskHandler', () => {
  let handler: UpdateTaskHandler;
  let prismaService: { task: { update: jest.Mock } };
  let queryBus: { execute: jest.Mock };

  beforeEach(async () => {
    // Créer les mocks
    prismaService = {
      task: {
        update: jest.fn(),
      },
    };

    queryBus = {
      execute: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UpdateTaskHandler,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: QueryBus,
          useValue: queryBus,
        },
      ],
    }).compile();

    handler = moduleRef.get<UpdateTaskHandler>(UpdateTaskHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update all fields of a task successfully', async () => {
      // Arrange
      const mockTask: Task = {
        id: 'task-123',
        title: 'Original Title',
        description: 'Original Description',
        status: 'PENDING',
        createdAt: new Date('2024-01-15T10:00:00.000Z'),
        updatedAt: new Date('2024-01-15T10:00:00.000Z'),
      };

      const data: UpdateTaskDto = {
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'COMPLETED',
      };

      const command = new UpdateTaskCommand('task-123', data);

      const updatedTask: Task = {
        ...mockTask,
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'COMPLETED',
        updatedAt: new Date('2024-01-15T11:00:00.000Z'),
      };

      const expectedResponse: ExecuteResponse = {
        message: MESSAGE.OK,
        statusCode: HttpStatus.OK,
      };

      // Mock la requête pour trouver la tâche
      queryBus.execute.mockResolvedValue(mockTask);

      // Mock la mise à jour
      prismaService.task.update.mockResolvedValue(updatedTask);

      // Act
      const result = await handler.execute(command);

      // Assert
      // Vérifie que la tâche a été recherchée
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetTaskQuery('task-123'),
      );

      // Vérifie que la tâche a été mise à jour avec les bonnes données
      expect(prismaService.task.update).toHaveBeenCalledTimes(1);
      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        data: {
          title: 'Updated Title',
          description: 'Updated Description',
          status: 'COMPLETED',
        },
      });

      // Vérifie la réponse
      expect(result).toEqual(expectedResponse);
    });

    it('should update only title field', async () => {
      // Arrange
      const mockTask: Task = {
        id: 'task-123',
        title: 'Original Title',
        description: 'Original Description',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const data: UpdateTaskDto = {
        title: 'New Title',
        description: undefined,
        status: undefined,
      };

      const command = new UpdateTaskCommand('task-123', data);

      queryBus.execute.mockResolvedValue(mockTask);
      prismaService.task.update.mockResolvedValue({
        ...mockTask,
        title: 'New Title',
      });

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        data: {
          title: 'New Title',
          // description et status ne sont pas inclus car undefined
        },
      });
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe(MESSAGE.OK);
    });

    it('should update only description field', async () => {
      // Arrange
      const mockTask: Task = {
        id: 'task-123',
        title: 'Original Title',
        description: 'Original Description',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const data: UpdateTaskDto = {
        title: undefined,
        description: 'New Description',
        status: undefined,
      };

      const command = new UpdateTaskCommand('task-123', data);

      queryBus.execute.mockResolvedValue(mockTask);
      prismaService.task.update.mockResolvedValue({
        ...mockTask,
        description: 'New Description',
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        data: {
          description: 'New Description',
          // title et status ne sont pas inclus car undefined
        },
      });
    });

    it('should update only status field', async () => {
      // Arrange
      const mockTask: Task = {
        id: 'task-123',
        title: 'Original Title',
        description: 'Original Description',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const data: UpdateTaskDto = {
        title: undefined,
        description: undefined,
        status: 'IN_PROGRESS',
      };

      const command = new UpdateTaskCommand('task-123', data);

      queryBus.execute.mockResolvedValue(mockTask);
      prismaService.task.update.mockResolvedValue({
        ...mockTask,
        status: 'IN_PROGRESS',
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        data: {
          status: 'IN_PROGRESS',
          // title et description ne sont pas inclus car undefined
        },
      });
    });

    it('should handle empty string description (set to null)', async () => {
      // Arrange
      const mockTask: Task = {
        id: 'task-123',
        title: 'Original Title',
        description: 'Original Description',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Note : Votre handler vérifie "description !== undefined"
      // Donc une chaîne vide "" sera incluse dans la mise à jour
      const data: UpdateTaskDto = {
        title: undefined,
        description: '',
        status: undefined,
      };
      const command = new UpdateTaskCommand('task-123', data);

      queryBus.execute.mockResolvedValue(mockTask);
      prismaService.task.update.mockResolvedValue({
        ...mockTask,
        description: '',
      });

      // Act
      await handler.execute(command);

      // Assert
      expect(prismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-123' },
        data: {
          description: '', // Chaîne vide incluse
        },
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      const data: UpdateTaskDto = {
        title: 'New Title',
        description: 'New Description',
        status: 'COMPLETED',
      };

      // Arrange
      const command = new UpdateTaskCommand('non-existent-id', data);

      // Mock la requête pour LANCER une exception comme le ferait le vrai GetTaskHandler
      const notFoundError = new NotFoundException(
        `Task with ID non-existent-id not found`,
      );
      queryBus.execute.mockRejectedValue(notFoundError); // Utilisez mockRejectedValue, pas mockResolvedValue

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(NotFoundException);

      await expect(handler.execute(command)).rejects.toThrow(
        'Task with ID non-existent-id not found',
      );

      // Vérifie que update n'a pas été appelé
      expect(prismaService.task.update).not.toHaveBeenCalled();

      // Vérifie que la requête a bien été faite
      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetTaskQuery));
    });

    it('should handle Prisma update errors', async () => {
      // Arrange
      const mockTask: Task = {
        id: 'task-123',
        title: 'Original Title',
        description: 'Original Description',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const data: UpdateTaskDto = {
        title: 'New Title',
        description: 'New Description',
        status: 'COMPLETED',
      };

      const command = new UpdateTaskCommand('task-123', data);

      const prismaError = new Error('Database constraint violation');

      queryBus.execute.mockResolvedValue(mockTask);
      prismaService.task.update.mockRejectedValue(prismaError);

      // Act & Assert
      await expect(handler.execute(command)).rejects.toThrow(
        'Database constraint violation',
      );

      // Vérifie que les appels ont bien été faits
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(prismaService.task.update).toHaveBeenCalledTimes(1);
    });

    it('should handle different status values', async () => {
      // Arrange
      const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      const mockTask: Task = {
        id: 'task-123',
        title: 'Task',
        description: 'Description',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      for (const status of statuses) {
        jest.clearAllMocks();

        const data: UpdateTaskDto = {
          title: undefined,
          description: undefined,
          status: status,
        };

        const command = new UpdateTaskCommand('task-123', data);

        queryBus.execute.mockResolvedValue(mockTask);
        prismaService.task.update.mockResolvedValue({
          ...mockTask,
          status,
        });

        // Act
        const result = await handler.execute(command);

        // Assert
        expect(prismaService.task.update).toHaveBeenCalledWith({
          where: { id: 'task-123' },
          data: { status },
        });
        expect(result.statusCode).toBe(HttpStatus.OK);
      }
    });
  });

  describe('command validation', () => {
    it('should create command with all fields', () => {
      const data: UpdateTaskDto = {
        title: 'Title',
        description: 'Desc',
        status: 'COMPLETED',
      };
      const command = new UpdateTaskCommand('123', data);
      expect(command.id).toBe('123');
      expect(command.updateTaskDto.title).toBe('Title');
      expect(command.updateTaskDto.description).toBe('Desc');
      expect(command.updateTaskDto.status).toBe('COMPLETED');
    });

    it('should create command with partial fields', () => {
      const data: UpdateTaskDto = {
        title: undefined,
        description: 'New Description',
        status: undefined,
      };
      const command = new UpdateTaskCommand('123', data);
      expect(command.id).toBe('123');
      expect(command.updateTaskDto.title).toBeUndefined();
      expect(command.updateTaskDto.description).toBe('New Description');
      expect(command.updateTaskDto.status).toBeUndefined();
    });
  });

  describe('response format', () => {
    it('should return proper ExecuteResponse format', async () => {
      // Arrange
      const mockTask: Task = {
        id: 'task-123',
        title: 'Task',
        description: 'Description',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const data: UpdateTaskDto = {
        title: 'New Title',
      };

      const command = new UpdateTaskCommand('task-123', data);

      queryBus.execute.mockResolvedValue(mockTask);
      prismaService.task.update.mockResolvedValue(mockTask);

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('statusCode');
      expect(typeof result.message).toBe('string');
      expect(typeof result.statusCode).toBe('number');
      expect(result.statusCode).toBe(HttpStatus.OK);
    });
  });
});
