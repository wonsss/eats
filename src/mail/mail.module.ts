import { Global, Module } from '@nestjs/common';
import { MailModuleOptions } from './mail.interface';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailService } from './mail.service';

@Module({})
@Global()
export class MailModule {
  static forRoot(options: MailModuleOptions) {
    return {
      module: MailModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: options,
        },
        MailService,
      ],
      exports: [MailService],
    };
  }
}
