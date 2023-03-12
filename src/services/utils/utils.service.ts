import { Injectable } from '@nestjs/common';
const STR_REGEX_ORDER = '^(.+),(asc|desc)$';
@Injectable()
export class UtilsService {
  public static removePropertiesFromObj(obj1, obj2): Record<string, unknown> {
    const newObj = { ...obj1 };

    for (const key in obj2) {
      delete newObj[key];
    }
    return newObj;
  }
  public static getFieldAndDirection(
    sortStr: string,
  ): FieldAndDirection | null {
    const result = sortStr?.match(new RegExp(STR_REGEX_ORDER));
    if (!result) return null;
    const [field, direction] = result.slice(1);
    return {
      field,
      direction: DIRECTION[direction],
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
