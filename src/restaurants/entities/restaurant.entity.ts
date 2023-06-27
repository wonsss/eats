import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
  @Field((returns) => Number)
  @PrimaryGeneratedColumn()
  id: number;

  @Field((returns) => String)
  @Column()
  @IsString()
  @Length(5, 10)
  name: string;

  @Field((returns) => Boolean, { defaultValue: true })
  @Column({ default: true })
  @IsOptional()
  @IsBoolean()
  isGood?: boolean;

  @Field((returns) => String)
  @Column()
  @IsString()
  address: string;

  @Field((returns) => String)
  @Column()
  @IsString()
  ownerName: string;

  @Field((returns) => String)
  @Column()
  categoryName: string;
}
