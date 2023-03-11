import { Test, TestingModule } from '@nestjs/testing';
import { GoogleSheetsConfigService } from './google-sheets-config.service';


describe('GoogleSheetsConfigService', () => {
  let service: GoogleSheetsConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleSheetsConfigService],
    }).compile();

    service = module.get<GoogleSheetsConfigService>(GoogleSheetsConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
