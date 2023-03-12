import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GoogleSheetsController } from './google-sheets/google-sheets.controller';
import { GoogleSheetsConfigService } from './configs/google-sheets-config.service';
import { GoogleSheetsService } from './google-sheets/google-sheets.service';
import { UtilsService } from './services/utils/utils.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './configs/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: getEnvFilename(),
      load: [configuration],
    }),
  ],
  controllers: [AppController, GoogleSheetsController],
  providers: [
    AppService,
    GoogleSheetsService,
    GoogleSheetsConfigService,
    UtilsService,
  ],
})
export class AppModule {}

function getEnvFilename() {
  return `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ``}`;
}
