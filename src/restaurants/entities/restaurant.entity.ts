import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@ObjectType()
@Entity()
export class Restaurant {
  @Field((returns) => Number)
  @PrimaryGeneratedColumn()
  id: number;

  @Field((returns) => String)
  @Column()
  name: string;

  @Field((returns) => Boolean, { nullable: true })
  @Column()
  isGood?: boolean;

  @Field((returns) => String)
  @Column()
  address: string;

  @Field((returns) => String)
  @Column()
  ownerName: string;
}
