import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, sheets_v4 } from 'googleapis';

@Injectable()
export class GoogleSheetsConfigService {
  public constructor(private configService: ConfigService) {}

  public async getSheets(): Promise<sheets_v4.Sheets> {
    const credentials = {
      private_key: this.configService
        .get('google.privateKey')
        .replace(/\\n/g, '\n'),
      client_email: this.configService.get('google.clientEmail'),
      client_id: this.configService.get('google.clientId'),
    };
    const auth = await google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      // keyFile: 'google_credentials.json',
      credentials: credentials,
    });

    return google.sheets({ version: 'v4', auth });
  }
}
