import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { SheetParamsForm } from '../dto/sheet-params.form';
import { GoogleSheetsService } from './google-sheets.service';
import { UtilsService } from '../services/utils/utils.service';
import {
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiQuery,
  ApiQueryOptions,
  ApiResponse,
} from '@nestjs/swagger';

const swaggerApiQuery: ApiQueryOptions = {
  name: 'query',
  required: false,
  schema: {
    type: 'object',
    description: 'filters',
    additionalProperties: {
      type: 'string',
    },
    example: {
      phone: '>=1',
      price: '<2',
    },
  },
  style: 'form',
  explode: true,
};
const swaggerApiExample200Response = [
  {
    phone: '4',
    name: 'David Brown',
    price: '2',
    email: 'david.brown@email.com',
    createdAt: '2022-01-03T08:00:00Z',
    updatedAt: '2022-01-03T09:30:00Z',
    __row_number: 9,
  },
  {
    phone: '5',
    name: 'Nome alterado',
    price: '2.1',
    email: 'sara.kim@email.com',
    createdAt: '2022-01-04T12:00:00Z',
    updatedAt: '2022-01-04T14:00:00Z',
    __row_number: 10,
  },
];
@Controller('google-sheets')
export class GoogleSheetsController {
  public constructor(private googleSheetsService: GoogleSheetsService) { }

  @ApiOperation({ summary: 'Get filtered rows' })
  @ApiQuery(swaggerApiQuery)
  @ApiResponse({
    status: 200,
    description: 'Items found',
    isArray: true,
    schema: {
      example: swaggerApiExample200Response,
    },
  })
  @ApiResponse({
    status: 400,
    description: 'SpreedsheetId or Sheet name not found',
  })
  @ApiResponse({
    status: 404,
    description: 'Items not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  @ApiHeader({
    name: 'sort',
    example: 'phone,asc',
    description:
      'Sort (asc|desc) the result based on one field, Ex.: {FIELD_NAME},{asc|desc}',
    required: false,
    schema: {
      default: '',
      example: 'phone,desc',
      pattern: '^.+,(asc|desc)$',
      description: 'Ex.: {FIELD_NAME},{asc|desc}',
    },
  })
  @Get('')
  async getRows(
    @Query() sheetParams: SheetParamsForm,
    @Query() query: Record<string, any>,
    @Headers() headers,
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
    const fieldDirection = UtilsService.getFieldAndDirection(headers.sort);
    return fieldDirection
      ? this.googleSheetsService.orderRows(fieldDirection, fieltedData)
      : fieltedData;
  }

  @ApiResponse({
    status: 400,
    description:
      'SpreedsheetId or Sheet name not found | Body does not correspond to headers',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  @ApiResponse({
    status: 201,
    description: 'Item created',
    schema: {
      example: {
        phone: '123456789',
        name: 'Mario',
        price: '10.3',
        email: 'mario@teste.com',
        createdAt: '1990-01-10',
        updatedAt: '2001-01-01',
        __row_number: 12,
      },
    },
  })
  @ApiBody({
    required: true,
    description: 'Body of the new row',
    schema: {
      example: {
        phone: '123456789',
        name: 'Mario',
        price: '10.3',
      },
    },
  })
  @ApiOperation({ summary: 'Add row' })
  @Post('')
  async addRow(@Query() sheetParams: SheetParamsForm, @Body() body) {
    const { projectId, sheet } = sheetParams;
    return await this.googleSheetsService.addRow(projectId, sheet, body);
  }

  @Put('')
  @ApiOperation({ summary: 'Update filtered rows' })
  @ApiQuery(swaggerApiQuery)
  @ApiResponse({
    status: 400,
    description: 'SpreedsheetId or Sheet name not found | No filter provided',
  })
  @ApiResponse({
    status: 404,
    description: 'Items not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  @ApiResponse({
    status: 200,
    description: 'Items updated',
    isArray: true,
    schema: {
      example: swaggerApiExample200Response,
    },
  })
  @ApiBody({
    required: true,
    description: 'Body of the updated row',
    schema: {
      example: {
        phone: '123456789',
        name: 'Mario',
        price: '10.3',
      },
    },
  })
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
  @ApiOperation({ summary: 'Delete filtered rows' })
  @ApiQuery(swaggerApiQuery)
  @ApiResponse({
    status: 400,
    description: 'SpreedsheetId or Sheet name not found',
  })
  @ApiResponse({
    status: 404,
    description: 'Items not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  @ApiResponse({
    status: 200,
    description: 'Items deleted',
    isArray: true,
    schema: {
      example: swaggerApiExample200Response,
    },
  })
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
