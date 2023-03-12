import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { GoogleSheetsConfigService } from '../configs/google-sheets-config.service';
import { RowDto } from '../dto/row.dto';
import {
  UtilsService,
  DIRECTION,
  FieldAndDirection,
} from '../services/utils/utils.service';

export const ROW_NUMBER = '__row_number';
export const OPERATOR_REGEX = /^(<=|>=|=|<|>|!)(.+)$/;
@Injectable()
export class GoogleSheetsService {
  private _sheets = null;
  public spreedsheetId = null;
  public sheetName = null;
  public constructor(
    private googleSheetsConfigService: GoogleSheetsConfigService,
  ) {}

  public async deleteRows(
    projectId: string,
    sheet: string,
    filters: Record<string, unknown>,
  ): Promise<RowDto[]> {
    const filtedRows = await this.getFilteredRows(
      projectId,
      sheet,
      filters,
      true,
    );
    if (filtedRows.length < 1)
      throw new NotFoundException('Nenhum registro encontrado');
    await this.handleDeleteRows(projectId, sheet, filtedRows);
    return filtedRows;
  }

  public async handleDeleteRows(
    projectId: string,
    sheet: string,
    filtedRows: RowDto[],
  ): Promise<boolean> {
    for (const row of filtedRows) {
      const range = `${sheet}!A${row.__row_number}:ZZZ${row.__row_number}`;
      await this.deleteOneRow(projectId, range);
    }
    return true;
  }

  public async deleteOneRow(projectId, range): Promise<boolean> {
    const result = await (
      await this.getSheetsValues()
    ).clear({
      spreadsheetId: projectId,
      range: range,
    });
    return result?.status === 200 ? true : false;
  }
  public async updateRows(
    projectId: string,
    sheet: string,
    filters: any,
    body: Record<string, any>,
  ): Promise<RowDto[]> {

    if (Object.keys(filters).length < 1)
      throw new BadRequestException('Nenhum filtro foi informado');

    const filtedRows = await this.getFilteredRows(
      projectId,
      sheet,
      filters,
      true,
    );

    if (filtedRows.length < 1)
      throw new NotFoundException('Nenhum registro encontrado');
    const headers = Object.keys(filtedRows[0]);

    const newData = headers.reduce((acc, h) => {
      const value = body[h];
      if (h in body && ![null, undefined].includes(value)) acc[h] = value;
      return acc;
    }, {});

    if (Object.keys(newData).length < 1)
      throw new BadRequestException(
        'Nenhum dado do body correspende aos cabeçalhos',
      );

    const updatedData = await this.handleUpdateFilteredRows(
      projectId,
      sheet,
      filtedRows,
      newData,
    );

    return updatedData;
  }

  public async handleUpdateFilteredRows(
    projectId: string,
    sheet: string,
    filtedRows: any[],
    newData: {},
  ) {
    const updatedData: RowDto[] = [];
    for (const currRow of filtedRows) {
      const rowUpdated = Object.assign(new RowDto(), currRow, newData);
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

  public async getAllRowsRaw(spreadsheetId: string, range: string) {
    try {
      const values = await (
        await this.getSheetsValues()
      ).get({
        spreadsheetId,
        range,
      });
      return values.data.values;
    } catch (error) {
      this.handleCommonExceptions(error);
    }
  }

  private handleCommonExceptions(error: any) {
    if (error?.message?.includes('Unable to parse range'))
      throw new BadRequestException('Sheet não encontrado');
    if (error?.message?.includes('Requested entity was not found.'))
      throw new BadRequestException('ProjectId não encontrado');
    throw new InternalServerErrorException(error?.message);
  }

  public async getAllRows(spreadsheetId: string, range: string) {
    const raw = await this.getAllRowsRaw(spreadsheetId, range);
    return this.convertRawToArray(raw);
  }
  public async getFilteredRows(
    spreadsheetId: string,
    range: string,
    filters = {},
    showRowNumber = true,
  ): Promise<RowDto[]> {
    const all = await this.getAllRows(spreadsheetId, range);
    const filteredData = all.reduce((acc, row, idx) => {
      for (const [key, value] of Object.entries(filters)) {
        const v = value.toString();
        if (!this.valueInFilter(row[key], v)) return acc;
      }

      return [
        ...acc,
        {
          ...row,
          ...(showRowNumber && {
            [ROW_NUMBER]: idx + 2,
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
  ): Promise<RowDto> {
    const headers = await this.getHeaders(spreadsheetId, range);
    const newRow = this.generateRowFromHeadersAndData(headers, data);

    if (newRow.every((it) => !it))
      throw new BadRequestException(
        'Nenhum dado do body correspende aos cabeçalhos',
      );

    const newRowNum = await this.appendOneRow(spreadsheetId, range, newRow);
    if (!newRowNum)
      throw new InternalServerErrorException('Não foi possivel salvar o item');

    const newRowObj = Object.assign(
      new RowDto(),
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
      this.handleCommonExceptions(error);
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

  public sortRows(
    fieldDirecction: FieldAndDirection,
    fieltedData: any[],
  ): RowDto[] {
    const sign = fieldDirecction.direction === DIRECTION.asc ? 1 : -1;

    return fieltedData.sort((a, b) => {
      const aVal: string | number =
        parseFloat(a[fieldDirecction.field]) || a[fieldDirecction.field] || '';
      const bVal: string | number =
        parseFloat(b[fieldDirecction.field]) || b[fieldDirecction.field] || '';

      if (typeof aVal == 'number' && typeof bVal == 'number') return (aVal - bVal) * sign;

      return aVal.toString().localeCompare(bVal.toString()) * sign;
    });
  }
  public valueInFilter(value: string, filterValue: string) {
    if (value === filterValue) return true;
    const [_, operator, content] = filterValue.match(OPERATOR_REGEX) || [];
    if (!operator || !content || !(operator in OPERATORSFN)) return false;

    const contentParsed: string | number = parseFloat(content) || content;
    const valueParsed: string | number = parseFloat(value) || value;

    const operatorFn = OPERATORSFN[operator];
    return operatorFn(valueParsed, contentParsed);
  }
}

export const OPERATORSFN = {
  '=': (a, b) => a === b,
  '!': (a, b) => a !== b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
};
