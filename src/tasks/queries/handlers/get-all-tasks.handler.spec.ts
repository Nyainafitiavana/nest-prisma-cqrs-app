import { Test } from '@nestjs/testing';
import { GetAllTasksHandler } from './get-all-tasks.handler';
import { GetAllTasksQuery } from '../impl/get-all-tasks.query';
import { PrismaService } from '../../../prisma/prisma.service';
import Helper from '../../../utils/helper';
import { Paginate } from '../../../utils/custom.interface';
import { Task } from '../../../../generated/prisma/client';

describe('GetAllTasksHandler', () => {
  let handler: GetAllTasksHandler;
  let prismaService: {
    task: { findMany: jest.Mock; count: jest.Mock };
    $transaction: jest.Mock;
  };
  let helper: { calculateOffset: jest.Mock };

  // Helper pour créer des tâches de test
  const createMockTask = (
    id: string,
    title: string,
    description: string,
  ): Task => ({
    id,
    title,
    description,
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Helper pour exécuter un test avec des paramètres donnés
  const executeTest = async (
    query: GetAllTasksQuery,
    mockTasks: Task[],
    totalRows: number,
    mockOffset?: number,
  ): Promise<Paginate<Task[]>> => {
    if (mockOffset !== undefined) {
      helper.calculateOffset.mockReturnValue(mockOffset);
    }

    prismaService.$transaction.mockResolvedValue([mockTasks, totalRows]);

    return handler.execute(query);
  };

  beforeEach(async () => {
    // Créer les mocks
    prismaService = {
      task: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    helper = {
      calculateOffset: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        GetAllTasksHandler,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: Helper,
          useValue: helper,
        },
      ],
    }).compile();

    handler = moduleRef.get<GetAllTasksHandler>(GetAllTasksHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    describe('sans pagination ni recherche', () => {
      it('should return all tasks', async () => {
        // Arrange
        const mockTasks = [
          createMockTask('1', 'Task 1', 'Description 1'),
          createMockTask('2', 'Task 2', 'Description 2'),
        ];

        const query = new GetAllTasksQuery(null, null, '');
        const expectedResult: Paginate<Task[]> = {
          data: mockTasks,
          totalRows: 2,
          page: 1,
        };

        // Act
        const result = await executeTest(query, mockTasks, 2);

        // Assert
        expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
        expect(result).toEqual(expectedResult);
        expect(helper.calculateOffset).not.toHaveBeenCalled();
      });
    });

    describe('avec pagination', () => {
      const testCases = [
        {
          name: 'page 2 avec limit 10',
          limit: 10,
          page: 2,
          expectedOffset: 10,
          totalRows: 25,
          expectedPage: 2,
        },
        {
          name: 'page 1 avec limit 10',
          limit: 10,
          page: 1,
          expectedOffset: 0,
          totalRows: 15,
          expectedPage: 1,
        },
        {
          name: 'page 3 avec limit 25',
          limit: 25,
          page: 3,
          expectedOffset: 50,
          totalRows: 100,
          expectedPage: 3,
        },
      ];

      testCases.forEach(
        ({ name, limit, page, expectedOffset, totalRows, expectedPage }) => {
          it(`should handle ${name}`, async () => {
            // Arrange
            const mockTasks = [createMockTask('1', 'Task 1', 'Description 1')];
            const query = new GetAllTasksQuery(limit, page, '');
            const expectedResult: Paginate<Task[]> = {
              data: mockTasks,
              totalRows,
              page: expectedPage,
            };

            // Act
            const result = await executeTest(
              query,
              mockTasks,
              totalRows,
              expectedOffset,
            );

            // Assert
            expect(helper.calculateOffset).toHaveBeenCalledWith(limit, page);
            expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
            expect(result).toEqual(expectedResult);
          });
        },
      );
    });

    describe('avec recherche par mot-clé', () => {
      const searchTestCases = [
        {
          name: 'dans le titre',
          value: 'important',
          mockTasks: () => [
            createMockTask('1', 'Important Task', 'Description'),
          ],
        },
        {
          name: 'dans la description',
          value: 'important',
          mockTasks: () => [
            createMockTask('1', 'Task', 'Very important description'),
          ],
        },
        {
          name: 'insensible à la casse',
          value: 'task',
          mockTasks: () => [
            {
              id: '1',
              title: 'TASK IN UPPERCASE',
              description: 'description in lowercase',
              status: 'PENDING',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ];

      searchTestCases.forEach(({ name, value, mockTasks }) => {
        it(`should search ${name}`, async () => {
          // Arrange
          const tasks = mockTasks();
          const query = new GetAllTasksQuery(null, null, value);
          const expectedResult: Paginate<Task[]> = {
            data: tasks,
            totalRows: 1,
            page: 1,
          };

          // Act
          const result = await executeTest(query, tasks, 1);

          // Assert
          expect(prismaService.$transaction).toHaveBeenCalledTimes(1);
          expect(result).toEqual(expectedResult);
        });
      });
    });

    describe('cas particuliers', () => {
      it('should handle empty result set', async () => {
        // Arrange
        const query = new GetAllTasksQuery(null, null, 'nonexistent');
        const expectedResult: Paginate<Task[]> = {
          data: [],
          totalRows: 0,
          page: 1,
        };

        // Act
        const result = await executeTest(query, [], 0);

        // Assert
        expect(result).toEqual(expectedResult);
        expect(result.data).toHaveLength(0);
        expect(result.totalRows).toBe(0);
      });

      it('should handle Prisma errors gracefully', async () => {
        // Arrange
        const query = new GetAllTasksQuery(null, null, '');
        const prismaError = new Error('Database connection failed');

        // Mock une erreur dans la transaction
        prismaService.$transaction.mockRejectedValue(prismaError);

        // Act & Assert
        await expect(handler.execute(query)).rejects.toThrow(
          'Database connection failed',
        );
      });

      it('should use default ordering by id ascending', async () => {
        // Arrange
        const mockTasks = [
          createMockTask('1', 'Task A', 'Description'),
          createMockTask('2', 'Task B', 'Description'),
        ];

        const query = new GetAllTasksQuery(null, null, '');
        const expectedResult: Paginate<Task[]> = {
          data: mockTasks,
          totalRows: 2,
          page: 1,
        };

        // Act
        const result = await executeTest(query, mockTasks, 2);

        // Assert
        expect(result.data[0].id).toBe('1');
        expect(result.data[1].id).toBe('2');
        expect(result).toEqual(expectedResult);
      });
    });
  });

  describe('calculateOffset helper', () => {
    it('should call helper with correct parameters', async () => {
      // Arrange
      const mockTasks = [createMockTask('1', 'Task', 'Description')];
      const query = new GetAllTasksQuery(25, 3, '');

      // Mock le helper
      helper.calculateOffset.mockReturnValue(50);

      // Mock la transaction
      prismaService.$transaction.mockResolvedValue([mockTasks, 100]);

      // Act
      await handler.execute(query);

      // Assert
      expect(helper.calculateOffset).toHaveBeenCalledTimes(1);
      expect(helper.calculateOffset).toHaveBeenCalledWith(25, 3);
    });

    it('should not call helper when no pagination', async () => {
      // Arrange
      const mockTasks = [createMockTask('1', 'Task', 'Description')];
      const query = new GetAllTasksQuery(null, null, '');

      // Mock la transaction
      prismaService.$transaction.mockResolvedValue([mockTasks, 1]);

      // Act
      await handler.execute(query);

      // Assert
      expect(helper.calculateOffset).not.toHaveBeenCalled();
    });
  });

  describe('query parameters', () => {
    const parameterTestCases = [
      {
        name: 'with all parameters',
        limit: 10,
        page: 2,
        value: 'search term',
      },
      {
        name: 'with only value',
        limit: null,
        page: null,
        value: 'search',
      },
      {
        name: 'with only pagination',
        limit: 20,
        page: 1,
        value: '',
      },
    ];

    parameterTestCases.forEach(({ name, limit, page, value }) => {
      it(`should handle GetAllTasksQuery ${name}`, () => {
        // Act
        const query = new GetAllTasksQuery(limit, page, value);

        // Assert
        expect(query.limit).toBe(limit);
        expect(query.page).toBe(page);
        expect(query.value).toBe(value);
      });
    });
  });
});
