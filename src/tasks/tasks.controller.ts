import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  HttpStatus,
  Res,
  Next,
  Req,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateTaskCommand } from './commands/impl/create-task.command';
import { UpdateTaskCommand } from './commands/impl/update-task.command';
import { GetAllTasksQuery } from './queries/impl/get-all-tasks.query';
import { GetTaskQuery } from './queries/impl/get-task.query';
import { DeleteTaskCommand } from './commands/impl/delete-task.command';
import express from 'express';
import { ExecuteResponse, Paginate } from '../utils/custom.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from '../../generated/prisma/client';
import { UpdateTaskDto } from './dto/update-task.dto';
import Helper, { QueryParams } from '../utils/helper';

@Controller('/api/tasks')
export class TasksController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly helper: Helper,
  ) {}

  @Post()
  async create(
    @Res() res: express.Response,
    @Next() next: express.NextFunction,
    @Body() createTaskDto: CreateTaskDto,
  ): Promise<void> {
    try {
      const create: ExecuteResponse = await this.commandBus.execute(
        new CreateTaskCommand(createTaskDto.title, createTaskDto.description),
      );

      res.status(HttpStatus.OK).json(create);
    } catch (error) {
      next(error);
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Res() res: express.Response,
    @Next() next: express.NextFunction,
  ): Promise<void> {
    try {
      const update: ExecuteResponse = await this.commandBus.execute(
        new UpdateTaskCommand(id, updateTaskDto),
      );

      res.status(HttpStatus.OK).json(update);
    } catch (error) {
      next(error);
    }
  }

  @Get()
  async findAll(
    @Res() res: express.Response,
    @Next() next: express.NextFunction,
    @Req() req: express.Request,
  ): Promise<void> {
    try {
      const queryParams: QueryParams = this.helper.buildQueryParams(req);

      const data: Paginate<Task[]> = await this.queryBus.execute(
        new GetAllTasksQuery(
          queryParams.limit,
          queryParams.page,
          queryParams.value,
        ),
      );

      res.status(HttpStatus.OK).json(data);
    } catch (error) {
      next(error);
    }
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Res() res: express.Response,
    @Next() next: express.NextFunction,
  ): Promise<void> {
    try {
      const task: Task = await this.queryBus.execute(new GetTaskQuery(id));

      res.status(HttpStatus.OK).json(task);
    } catch (error) {
      next(error);
    }
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Res() res: express.Response,
    @Next() next: express.NextFunction,
  ): Promise<void> {
    try {
      const deleted: ExecuteResponse = await this.commandBus.execute(
        new DeleteTaskCommand(id),
      );
      res.status(HttpStatus.OK).json(deleted);
    } catch (error) {
      next(error);
    }
  }
}
