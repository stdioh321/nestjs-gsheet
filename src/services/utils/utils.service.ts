import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
  public static removePropertiesFromObj(
    obj1: Record<string, unknown>,
    obj2: Record<string, unknown>,
  ): Record<string, unknown> {
    const newObj = { ...obj1 };

    for (const key in obj2) {
      delete newObj[key];
    }
    return newObj;
  }
}
