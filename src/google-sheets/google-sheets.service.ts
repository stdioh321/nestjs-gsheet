import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { GoogleSheetsConfigService } from '../configs/google-sheets-config.service';
import { DefaultRowDto } from '../dto/default-row.dto';
import { DIRECTION, OrderBodyForm } from '../dto/order-body.form';

@Injectable()
export class GoogleSheetsService {
  private _sheets = null;

  public constructor(
    private googleSheetsConfigService: GoogleSheetsConfigService,
  ) { }

  public async updateRow(
    projectId: string,
    sheet: string,
    filters: any,
    body: Record<string, any>,
  ): Promise<any> {
    const filtedRows = await this.getFiltered(projectId, sheet, filters, true);
    if (filtedRows.length < 1)
      throw new BadRequestException('Nenhum registro encontrado');
    const headers = Object.keys(filtedRows[0]);

    const newData = {};
    const updatedData = [];
    for (const h of headers) {
      if (h in body && ![null, undefined].includes(body[h]))
        newData[h] = body[h];
    }
    if (Object.keys(newData).length < 1)
      throw new BadRequestException(
        'Nenhum dado do body correspende aos cabeçalhos',
      );

    for (const currRow of filtedRows) {
      const rowUpdated = Object.assign(new DefaultRowDto(), currRow, newData);
      updatedData.push(rowUpdated);
      const { __row_number, ...data } = rowUpdated;
      const range = `${sheet}!A${__row_number}`;
      const currentValue = Object.values(data);
      await this.updateOneRow(projectId, range, currentValue);
    }

    return updatedData;
  }

  private async updateOneRow(
    projectId: string,
    range: string,
    currentValue: unknown[],
  ): Promise<boolean> {
    const sheets = await this.getSheetsInstance();
    const result = await (
      await sheets
    ).spreadsheets.values.update({
      spreadsheetId: projectId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [currentValue],
      },
    });
    return result?.data?.updatedRows > 0 ? true : false;
  }

  public async getSheetsInstance() {
    if (this._sheets) return this._sheets;
    this._sheets = await this.googleSheetsConfigService.getSheets();
    return this._sheets;
  }
  public async getSheetsValues() {
    return (await this.getSheetsInstance()).spreadsheets.values;
  }

  public async getAllRaw(spreadsheetId: string, range: string) {
    try {
      const values = await (
        await this.getSheetsValues()
      ).get({
        spreadsheetId,
        range,
      });
      return values.data.values;
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
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
  ): Promise<any[]> {
    const time1 = new Date().getTime()
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
    const newRow = this.generateRowFromHeadersAndData(headers, data);

    if (newRow.every((it) => !it))
      throw new BadRequestException(
        'Nenhum dado do body correspende aos cabeçalhos',
      );

    const newRowNum = await this.appendOneRow(spreadsheetId, range, newRow);
    if (!newRowNum)
      throw new HttpException('Não foi possivel salvar o item', 500);

    const newRowObj = Object.assign(
      new DefaultRowDto(),
      Object.fromEntries(headers.map((h, idx) => [h, newRow[idx]])),
    );

    newRowObj.__row_number = newRowNum;
    return newRowObj;
  }

  private async appendOneRow(
    spreadsheetId: string,
    range: string,
    newRow: any[],
  ): Promise<number> {
    try {
      const result = await (
        await this.getSheetsValues()
      ).append({
        spreadsheetId: spreadsheetId,
        range: `${range}`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [newRow],
        },
      });
      const regex = /(\d+)$/;
      const updatedRange: string = result?.data?.updates?.updatedRange;
      const rowNum = updatedRange?.match(regex)[0];

      return result?.data?.updates?.updatedRows > 0 ? Number(rowNum) : null;
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }

  public async getHeaders(spreadsheetId: string, range: string) {
    try {
      const raw = await (
        await this.getSheetsValues()
      ).get({
        spreadsheetId: spreadsheetId,
        range: `${range}!1:1`,
      });
      return raw.data.values[0];
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
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

  public generateRowFromHeadersAndData(
    headers: string[],
    data: Record<string, unknown>,
  ) {
    return headers.map((h) => data[h] ?? '');
  }
  public async doesSheetExist(
    spreadsheetId: string,
    sheetName: string,
  ): Promise<boolean> {
    try {
      const response = await (
        await this.getSheetsInstance()
      ).spreadsheets.get({
        spreadsheetId,
        includeGridData: false,
      });

      const sheet = response.data.sheets.find(
        (sheet) => sheet.properties.title === sheetName,
      );
      return Boolean(sheet);
    } catch (error) {
      return false;
    }
  }

  public orderRows(body: OrderBodyForm, fieltedData: any[]) {
    const { field, direction } = body.getFieldAndDirection();
    const sign = direction === DIRECTION.asc ? 1 : -1;

    return fieltedData.sort((a, b) => {
      if (a[field] < b[field]) {
        return -sign;
      }
      if (a[field] > b[field]) {
        return sign;
      }
      return 0;
    });
  }
}
