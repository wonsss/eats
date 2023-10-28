import got from 'got';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { MailModuleOptions } from './mail.interface';

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {
    this.sendEmail('메일 발송 테스트', 'test')
      .then(() => {
        console.log('Message sent');
      })
      .catch((error) => {
        console.log(error.response.body);
      });
  }

  private async sendEmail(subject: string, content: string) {
    const form = new FormData();
    form.append('from', `Developer Marco <nextjws@gmail.com>`);
    form.append('to', `jangws@kakao.com`);
    form.append('subject', subject);
    form.append('text', content);
    const response = await got(
      `https://api.mailgun.net/v3/${this.options.domain}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(
            `api:${this.options.apiKey}`,
          ).toString('base64')}`,
        },
        body: form,
      },
    );
    console.log(response.body);
  }
}
