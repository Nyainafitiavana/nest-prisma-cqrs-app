import { Test } from '@nestjs/testing';
import { DeleteTaskHandler } from './delete-task.handler';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueryBus } from '@nestjs/cqrs';
import { GetTaskQuery } from '../../queries/impl/get-task.query';
import { NotFoundException } from '@nestjs/common';
import { ExecuteResponse } from '../../../utils/custom.interface';
import { MESSAGE } from '../../../utils/constant';
import { HttpStatus } from '@nestjs/common';
import { DeleteTaskCommand } from '../impl/delete-task.command';

describe('DeleteTaskHandler', () => {
  let handler: DeleteTaskHandler;
  let prismaService: { task: { delete: jest.Mock } };
  let queryBus: { execute: jest.Mock };

  // Mock data
  const mockExistingTask = {
    id: 'existing-id',
    title: 'Existing Task',
    description: 'Existing Description',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Setup mocks
    prismaService = {
      task: {
        delete: jest.fn(),
      },
    };

    queryBus = {
      execute: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        DeleteTaskHandler,
        { provide: PrismaService, useValue: prismaService },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    handler = moduleRef.get<DeleteTaskHandler>(DeleteTaskHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('when task exists', () => {
      it('should delete task and return success response', async () => {
        // Arrange
        const command = new DeleteTaskCommand('existing-id');

        // Le GetTaskQuery retourne la tâche (pas d'exception).
        queryBus.execute.mockResolvedValue(mockExistingTask);
        prismaService.task.delete.mockResolvedValue(mockExistingTask);

        // Act
        const result: ExecuteResponse = await handler.execute(command);

        // Assert
        expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetTaskQuery));
        expect(queryBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'existing-id' }),
        );

        expect(prismaService.task.delete).toHaveBeenCalledWith({
          where: { id: 'existing-id' },
        });

        expect(result).toEqual({
          message: MESSAGE.OK,
          statusCode: HttpStatus.OK,
        });
      });

      it('should delete task with different ID', async () => {
        // Arrange
        const taskId = 'another-task-id';
        const command = new DeleteTaskCommand(taskId);

        const anotherTask = {
          ...mockExistingTask,
          id: taskId,
          title: 'Another Task',
        };

        queryBus.execute.mockResolvedValue(anotherTask);
        prismaService.task.delete.mockResolvedValue(anotherTask);

        // Act
        const result: ExecuteResponse = await handler.execute(command);

        // Assert
        expect(queryBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({ id: taskId }),
        );

        expect(prismaService.task.delete).toHaveBeenCalledWith({
          where: { id: taskId },
        });

        expect(result.statusCode).toBe(HttpStatus.OK);
        expect(result.message).toBe(MESSAGE.OK);
      });
    });

    describe('when task does not exist', () => {
      it('should throw NotFoundException when GetTaskQuery throws', async () => {
        // Arrange
        const command = new DeleteTaskCommand('non-existent-id');

        // Le GetTaskQuery lance une exception
        const notFoundError = new NotFoundException(
          'Task with ID non-existent-id not found',
        );
        queryBus.execute.mockRejectedValue(notFoundError);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(
          NotFoundException,
        );

        await expect(handler.execute(command)).rejects.toThrow(
          'Task with ID non-existent-id not found',
        );

        // Vérifie que delete n'a pas été appelé
        expect(prismaService.task.delete).not.toHaveBeenCalled();

        // Vérifie que la requête a bien été faite
        expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetTaskQuery));
      });
    });

    describe('error handling', () => {
      it('should propagate database errors from delete operation', async () => {
        // Arrange
        const command = new DeleteTaskCommand('existing-id');
        const dbError = new Error('Database constraint violation');

        queryBus.execute.mockResolvedValue(mockExistingTask);
        prismaService.task.delete.mockRejectedValue(dbError);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(
          'Database constraint violation',
        );

        // Vérifie que GetTaskQuery a été appelé
        expect(queryBus.execute).toHaveBeenCalled();
      });

      it('should propagate errors from GetTaskQuery', async () => {
        // Arrange
        const command = new DeleteTaskCommand('existing-id');
        const queryError = new Error('Query bus error');

        queryBus.execute.mockRejectedValue(queryError);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(
          'Query bus error',
        );

        expect(prismaService.task.delete).not.toHaveBeenCalled();
      });

      it('should handle Prisma known errors (e.g., record not found)', async () => {
        // Arrange
        const command = new DeleteTaskCommand('existing-id');
        const prismaError = {
          code: 'P2025',
          message: 'Record to delete does not exist.',
          meta: { cause: 'Task not found' },
        };

        queryBus.execute.mockResolvedValue(mockExistingTask);
        prismaService.task.delete.mockRejectedValue(prismaError);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toEqual(prismaError);
      });
    });

    describe('edge cases', () => {
      it('should handle empty string ID', async () => {
        // Arrange
        const command = new DeleteTaskCommand('');
        const notFoundError = new NotFoundException('Task with ID  not found');

        queryBus.execute.mockRejectedValue(notFoundError);

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(
          NotFoundException,
        );

        expect(queryBus.execute).toHaveBeenCalledWith(
          expect.objectContaining({ id: '' }),
        );
      });

      it('should handle null ID (if allowed by TypeScript)', async () => {
        // Note : Ce test dépend de si votre TypeScript permet null pour l'ID
        // Arrange
        const command = new DeleteTaskCommand('null');

        queryBus.execute.mockRejectedValue(
          new NotFoundException('Task with ID null not found'),
        );

        // Act & Assert
        await expect(handler.execute(command)).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('verification of handler logic', () => {
      it('should always call GetTaskQuery before delete', async () => {
        // Arrange
        const command = new DeleteTaskCommand('test-id');

        queryBus.execute.mockResolvedValue(mockExistingTask);
        prismaService.task.delete.mockResolvedValue(mockExistingTask);

        // Act
        await handler.execute(command);

        // Assert — vérifie l'ordre des appels
        const queryBusCallOrder = queryBus.execute.mock.invocationCallOrder[0];
        const deleteCallOrder =
          prismaService.task.delete.mock.invocationCallOrder[0];

        expect(queryBusCallOrder).toBeLessThan(deleteCallOrder);
      });

      it('should not call delete if GetTaskQuery throws', async () => {
        // Arrange
        const command = new DeleteTaskCommand('test-id');

        // Créez une erreur proprement
        const notFoundError = new NotFoundException('Task not found');

        queryBus.execute.mockRejectedValue(notFoundError);

        // Act & Assert
        try {
          await handler.execute(command);
          // Si on arrive ici, c'est une erreur — on devrait avoir une exception
          fail('Expected NotFoundException to be thrown');
        } catch (error) {
          // Vérifiez que c'est bien l'exception attendue
          expect(error).toBe(notFoundError);
        }

        // Assert que delete n'a pas été appelé
        expect(prismaService.task.delete).not.toHaveBeenCalled();
      });
    });
  });
});
