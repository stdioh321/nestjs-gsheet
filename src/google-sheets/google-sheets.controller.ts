import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { google } from 'googleapis';
import { SheetParamsForm } from '../dto/sheet-params.form';
import { GoogleSheetsService } from './google-sheets.service';

@Controller('google-sheets')
export class GoogleSheetsController {
  public constructor(private googleSheetsService: GoogleSheetsService) { }
  @Get('')
  async getRows(
    @Query() sheetParams: SheetParamsForm,
    @Query() query: Record<string, any>,
  ): Promise<any[]> {
    const { projectId, sheet } = sheetParams;

    const filters = GoogleSheetsService.removeItensFromObj(query, sheetParams);

    const fieltedData = await this.googleSheetsService.getFiltered(
      projectId,
      sheet,
      filters,
      true,
    );
    return fieltedData;
  }
  @Post('')
  async addRow(
    @Query() sheetParams: SheetParamsForm,
    @Body() body,
  ): Promise<any> {
    const { projectId, sheet } = sheetParams;
    return this.googleSheetsService.addRow(projectId, sheet, body);
  }
}
