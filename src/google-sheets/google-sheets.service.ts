import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { GoogleSheetsConfigService } from '../configs/google-sheets-config.service';
import { sheets_v4 } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private _sheets = null;
  public constructor(
    private googleSheetsConfigService: GoogleSheetsConfigService,
  ) { }

  public getSheetsInstance() {
    if (this._sheets) return this._sheets;
    this._sheets = this.googleSheetsConfigService.getSheets();
    return this._sheets;
  }
  public async getAllRaw(spreadsheetId: string, range: string) {
    const sheets = await this.getSheetsInstance();
    return (
      await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      })
    ).data.values;
  }
  public async getAll(spreadsheetId: string, range: string) {
    const raw = await this.getAllRaw(spreadsheetId, range);
    return this.convertRawToArray(raw);
  }
  public async getFiltered(
    spreadsheetId: string,
    range: string,
    filters = {},
    showRowNumber = false,
  ) {
    const all = await this.getAll(spreadsheetId, range);
    const filteredData = all.reduce((acc, it, idx) => {
      for (const [key, value] of Object.entries(filters)) {
        if (it[key] !== value.toString()) return acc;
      }
      return [
        ...acc,
        {
          ...it,
          ...(showRowNumber && {
            __row_number: idx + 2,
          }),
        },
      ];
    }, []);

    return filteredData;
  }

  public async addRow(
    spreadsheetId: string,
    range: string,
    data: Record<string, unknown>,
  ) {
    const headers = await this.getHeaders(spreadsheetId, range);
    const newRow = [];

    for (const h of headers) {
      if (h in data) newRow.push(data[h]);
      else newRow.push('');
    }
    if (newRow.every((it) => !it))
      throw new HttpException('Nenhum item foi inserido', 406);

    if ((await this.appendToSheet(spreadsheetId, range, newRow)) !== true)
      throw new HttpException('Não foi possivel salvar o item', 500);

    return true;
  }

  private async appendToSheet(
    spreadsheetId: string,
    range: string,
    newRow: any[],
  ): Promise<boolean> {
    const sheets = await this.getSheetsInstance();
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: `${range}`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [newRow],
      },
    });
    return result?.data?.updates?.updatedRows === 1 ? true : false;
  }

  public async getHeaders(spreadsheetId: string, range: string) {
    const sheets = await this.getSheetsInstance();
    const raw = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: `${range}!1:1`,
    });
    return raw.data.values[0];
  }

  public convertRawToArray(raw: any[]): any[] {
    const [headers, ...body] = raw;

    const result = body.map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [header, row[index] || '']),
      ),
    );
    return result;
  }

  public static removeItensFromObj(obj1, obj2) {
    const newObj = { ...obj1 };

    for (const key in obj2) {
      delete newObj[key];
    }
    return newObj;
  }
}
