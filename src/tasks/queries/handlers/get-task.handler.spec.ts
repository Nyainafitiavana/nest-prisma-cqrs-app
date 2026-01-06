import { GetTaskQuery } from '../impl/get-task.query';
import { GetTaskHandler } from './get-task.handler';
import { Task } from '../../../../generated/prisma/client';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('GetTaskHandler', () => {
  let handler: GetTaskHandler;
  let prismaService: { task: { findUnique: jest.Mock } };

  const mockTask = (id: string): Task => ({
    id,
    title: `Task ${id}`,
    description: 'Description',
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    prismaService = { task: { findUnique: jest.fn() } };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetTaskHandler,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    handler = moduleRef.get<GetTaskHandler>(GetTaskHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return task when found', async () => {
      const task = mockTask('1');
      prismaService.task.findUnique.mockResolvedValue(task);

      const result = await handler.execute(new GetTaskQuery('1'));

      expect(result).toEqual(task);
      expect(prismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException when task not found', async () => {
      prismaService.task.findUnique.mockResolvedValue(null);

      await expect(handler.execute(new GetTaskQuery('1'))).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should have correct error message when task not found', async () => {
      prismaService.task.findUnique.mockResolvedValue(null);

      try {
        await handler.execute(new GetTaskQuery('1'));
        // Si on arrive ici, le test doit échouer
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        // Vérification de type avec guard
        if (error instanceof NotFoundException) {
          expect(error.message).toBe('Task with ID 1 not found');
          expect(error.getStatus()).toBe(404);
        } else {
          fail('Expected NotFoundException but got ');
        }
      }
    });

    it('should have correct error message with different ID', async () => {
      const taskId = 'non-existent-id';
      prismaService.task.findUnique.mockResolvedValue(null);

      try {
        await handler.execute(new GetTaskQuery(taskId));
        fail('Expected NotFoundException to be thrown');
      } catch (error) {
        if (error instanceof NotFoundException) {
          expect(error.message).toBe(`Task with ID ${taskId} not found`);
          expect(error.getStatus()).toBe(404);
        } else {
          fail('Expected NotFoundException');
        }
      }
    });

    it('should propagate Prisma errors', async () => {
      const error = new Error('DB error');
      prismaService.task.findUnique.mockRejectedValue(error);

      await expect(handler.execute(new GetTaskQuery('1'))).rejects.toThrow(
        'DB error',
      );
    });

    it('should handle different task IDs correctly', async () => {
      const taskId = 'test-123';
      const task = mockTask(taskId);
      prismaService.task.findUnique.mockResolvedValue(task);

      const result = await handler.execute(new GetTaskQuery(taskId));

      expect(result).toEqual(task);
      expect(prismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: taskId },
      });
    });

    it('should handle empty string ID', async () => {
      prismaService.task.findUnique.mockResolvedValue(null);

      await expect(handler.execute(new GetTaskQuery(''))).rejects.toThrow(
        NotFoundException,
      );
      expect(prismaService.task.findUnique).toHaveBeenCalledWith({
        where: { id: '' },
      });
    });
  });
});
