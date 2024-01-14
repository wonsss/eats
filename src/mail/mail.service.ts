import got from 'got';
import * as FormData from 'form-data';
import { Inject, Injectable } from '@nestjs/common';
import { CONFIG_OPTIONS } from 'src/common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interface';

export const SEND_EMAIL_MESSAGES = {
  VERIFY_EMAIL_REQUEST: '이메일을 인증해주세요',
  VERIFY_EMAIL_SUCCESS: '이메일 인증이 완료되었습니다',
};

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async sendEmail(subject: string, template: string, emailVars: EmailVar[]) {
    const form = new FormData();
    form.append('from', `Developer Marco <nextjws@gmail.com>`);
    form.append('to', `jangws@kakao.com`);
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));

    try {
      await got.post(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail(SEND_EMAIL_MESSAGES.VERIFY_EMAIL_REQUEST, 'verify-email', [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }

  sendVerificationSuccessEmail(email: string) {
    this.sendEmail(
      SEND_EMAIL_MESSAGES.VERIFY_EMAIL_SUCCESS,
      'letter-template',
      [{ key: 'firstname', value: email }],
    );
  }
}
