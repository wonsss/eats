import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType({ isAbstract: true }) // @InputType은 graphQL에 argument로 전달할 수 있는 특수한 유형의 객체이다. Mutation이 객체를 argument로 받고 싶은 경우 사용한다. InputType을 사용하면 다음과 같이 요청해야 한다.
@ObjectType() // GraphQL 스키마의에서 대부분의 정의는 object type이다. object type은 애플리케이션 클라이언트가 상호 작용해야 하는 도메인 객체를 나타낸다.
@Entity() // Entity는 데이터베이스 테이블과 일치하는 클래스이다. Entity는 데이터베이스에서 데이터를 저장하고 검색하는 데 사용된다.
export class Category extends CoreEntity {
  @Field((returns) => String)
  @Column()
  @IsString()
  @Length(5, 10)
  name: string;

  @Field((type) => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field((type) => [Restaurant])
  @OneToMany((type) => Restaurant, (restaurant) => restaurant.category)
  restaurants: Restaurant[];
}
