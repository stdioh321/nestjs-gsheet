import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SheetParamsForm } from '../dto/sheet-params.form';
import { GoogleSheetsService } from './google-sheets.service';
import { DIRECTION, OrderBodyForm } from '../dto/order-body.form';

@Controller('google-sheets')
export class GoogleSheetsController {
  public constructor(private googleSheetsService: GoogleSheetsService) {}
  @Get('')
  async getRows(
    @Query() sheetParams: SheetParamsForm,
    @Query() query: Record<string, any>,
    @Body() body: OrderBodyForm,
  ): Promise<any[]> {
    const { projectId, sheet } = sheetParams;

    const filters = GoogleSheetsService.removeItensFromObj(query, sheetParams);
    const fieltedData = await this.googleSheetsService.getFiltered(
      projectId,
      sheet,
      filters,
      true,
    );
    if (fieltedData.length < 1)
      throw new NotFoundException('Nenhum registro encontrado');
    if (body.order)
      return this.googleSheetsService.orderRows(body, fieltedData);
    return fieltedData;
  }

  @Post('')
  async addRow(
    @Query() sheetParams: SheetParamsForm,
    @Body() body,
  ): Promise<any> {
    const { projectId, sheet } = sheetParams;
    return await this.googleSheetsService.addRow(projectId, sheet, body);
  }

  @Put('')
  async updateRow(
    @Query() sheetParams: SheetParamsForm,
    @Body() body,
    @Query() query: Record<string, any>,
  ): Promise<any> {
    const { projectId, sheet } = sheetParams;
    const filters = GoogleSheetsService.removeItensFromObj(query, sheetParams);

    return await this.googleSheetsService.updateRow(
      projectId,
      sheet,
      filters,
      body,
    );
  }
}
