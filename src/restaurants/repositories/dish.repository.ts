import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Dish } from '../entities/dish.entity';

@Injectable()
export class DishRepository extends Repository<Dish> {
  constructor(private dataSource: DataSource) {
    super(Dish, dataSource.createEntityManager());
  }
}
