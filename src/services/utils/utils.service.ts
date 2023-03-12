import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {
  public static removePropertiesFromObj(obj1, obj2): Record<string, unknown> {
    const newObj = { ...obj1 };

    for (const key in obj2) {
      delete newObj[key];
    }
    return newObj;
  }
}
