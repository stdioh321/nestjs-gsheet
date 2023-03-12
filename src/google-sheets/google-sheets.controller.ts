import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SheetParamsForm } from '../dto/sheet-params.form';
import { GoogleSheetsService } from './google-sheets.service';
import { OrderBodyForm } from '../dto/order-body.form';
import { UtilsService } from '../services/utils/utils.service';
import { ConfigService } from '@nestjs/config';

@Controller('google-sheets')
export class GoogleSheetsController {
  public constructor(
    private googleSheetsService: GoogleSheetsService,
    private configService: ConfigService,
  ) { }
  @Get('')
  async getRows(
    @Query() sheetParams: SheetParamsForm,
    @Query() query: Record<string, any>,
    @Body() body: OrderBodyForm,
  ) {
    const { projectId, sheet } = sheetParams;

    const filters = UtilsService.removePropertiesFromObj(query, sheetParams);
    const fieltedData = await this.googleSheetsService.getFilteredRows(
      projectId,
      sheet,
      filters,
      true,
    );
    if (fieltedData.length < 1)
      throw new NotFoundException('Nenhum registro encontrado');
    return body.order
      ? this.googleSheetsService.orderRows(body, fieltedData)
      : fieltedData;
  }

  @Post('')
  async addRow(@Query() sheetParams: SheetParamsForm, @Body() body) {
    const { projectId, sheet } = sheetParams;
    return await this.googleSheetsService.addRow(projectId, sheet, body);
  }

  @Put('')
  async updateRows(
    @Query() sheetParams: SheetParamsForm,
    @Body() body,
    @Query() query: Record<string, any>,
  ) {
    const { projectId, sheet } = sheetParams;
    const filters = UtilsService.removePropertiesFromObj(query, sheetParams);

    return await this.googleSheetsService.updateRows(
      projectId,
      sheet,
      filters,
      body,
    );
  }
  @Delete('')
  async deleteRows(
    @Query() sheetParams: SheetParamsForm,
    @Query() query: Record<string, any>,
  ) {
    const { projectId, sheet } = sheetParams;
    const filters = UtilsService.removePropertiesFromObj(query, sheetParams);

    return await this.googleSheetsService.deleteRows(projectId, sheet, filters);
  }
}
