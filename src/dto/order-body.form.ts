import { IsOptional, Matches } from 'class-validator';
const STR_REGEX_ORDER = '^(.+),(asc|desc)$';
export class OrderBodyForm {
  @Matches(STR_REGEX_ORDER)
  @IsOptional()
  order?: string;

  public getFieldAndDirection(): FieldAndDirection {
    const result = this.order.match(new RegExp(STR_REGEX_ORDER));
    const field = result[1];
    const direction = DIRECTION[result[2]];

    return {
      field,
      direction,
    };
  }
}

export interface FieldAndDirection {
  field: string;
  direction: DIRECTION;
}

export enum DIRECTION {
  asc = 'asc',
  desc = 'desc',
}
