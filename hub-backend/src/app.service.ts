import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getOK(): string {
    return 'OK';
  }
}
