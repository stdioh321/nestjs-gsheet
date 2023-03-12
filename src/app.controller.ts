import { Controller, Get } from '@nestjs/common';

@Controller('/healthcheck')
export class AppController {
  @Get('')
  public healthcheck() {
    return 'ok';
  }
}
