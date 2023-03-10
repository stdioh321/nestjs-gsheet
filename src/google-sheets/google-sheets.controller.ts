import { Controller, Get, Query } from '@nestjs/common';
import { google } from 'googleapis';
import { SheetParamsForm } from '../dto/sheet-params.form';

@Controller('google-sheets')
export class GoogleSheetsController {
  @Get('')
  async getSheet(@Query() sheetParams: SheetParamsForm): Promise<any[]> {
    const auth = await google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      keyFile: 'google_credentials.json',
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = sheetParams.projectId;
    const range = sheetParams.sheet;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    const headers = rows[0];
    const body = rows.slice(1);
    const result = body.map((row) => Object.fromEntries(row.map((it,idx)=>{
      return [headers[idx], it]
    })));
    return result;
  }
}
