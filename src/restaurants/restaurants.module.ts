import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import {
  CategoryResolver,
  DishResolver,
  RestaurantsResolver,
} from './restaurants.resolver';
import { RestaurantService } from './restaurants.service';
import { CategoryRepository } from './repositories/category.repository';
import { DishRepository } from './repositories/dish.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Restaurant, Category])],
  providers: [
    RestaurantsResolver,
    RestaurantService,
    CategoryResolver,
    CategoryRepository,
    DishResolver,
    DishRepository,
  ],
})
export class RestaurantsModule {}
