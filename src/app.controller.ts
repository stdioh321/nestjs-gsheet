import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

@Controller('/healthcheck')
export class AppController {
  @ApiResponse({
    status: 200,
    schema: { example: 'ok' },
  })
  @Get('')
  public healthcheck() {
    return 'ok';
  }
}
