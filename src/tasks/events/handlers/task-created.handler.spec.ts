// Version finale la plus simple
import { TaskCreatedEvent } from '../impl/task-created.event';
import { TaskCreatedHandler } from './task-created.handler';

describe('TaskCreatedHandler', () => {
  let handler: TaskCreatedHandler;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    handler = new TaskCreatedHandler();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log when task is created', () => {
    const event = new TaskCreatedEvent('123', 'My Task', new Date());

    handler.handle(event);

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Task créée: 123 - My Task'),
    );
  });
});
