import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Restaurant {
  @Field((returns) => String)
  name: string;

  @Field((returns) => Boolean, { nullable: true })
  isGood?: boolean;

  @Field((returns) => String)
  address: string;

  @Field((returns) => String)
  ownerName: string;
}
