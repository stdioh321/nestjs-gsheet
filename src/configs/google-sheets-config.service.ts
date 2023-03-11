import { Injectable } from '@nestjs/common';
import { google, sheets_v4 } from 'googleapis';
import { GeneratedAPIs } from 'googleapis/build/src/apis';
@Injectable()
export class GoogleSheetsConfigService {
  public async getSheets(): Promise<sheets_v4.Sheets> {
    const auth = await google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      keyFile: 'google_credentials.json',
    });

    return google.sheets({ version: 'v4', auth });
  }
}
