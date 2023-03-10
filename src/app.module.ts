import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GoogleSheetsController } from './google-sheets/google-sheets.controller';
import { GoogleSheetsService } from './google-sheets/google-sheets.service';

@Module({
  imports: [],
  controllers: [AppController, GoogleSheetsController],
  providers: [AppService, GoogleSheetsService],
})
export class AppModule {}
