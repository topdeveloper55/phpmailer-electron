/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { URL } from 'url';
import path from 'path';
import axios from 'axios';
import qs from 'qs';

export let resolveHtmlPath: (htmlFileName: string) => string;

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 1212;
  resolveHtmlPath = (htmlFileName: string) => {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  };
} else {
  resolveHtmlPath = (htmlFileName: string) => {
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
  };
}

export const sendEmailPerServer = async (
  event: any,
  server: string,
  server_num: number,
  emails: string[]
): void => {
  for (let i = 0; i < emails.length; i++) {
    axios
      .post(
        server,
        qs.stringify({
          action: 'score',
          senderEmail: 'support@nagoya-boushi.org',
          senderName: 'David',
          attachment: '',
          replyTo: '',
          subject: 'Mail Testing',
          messageLetter: 'Hello, How are you?',
          emailList: emails[i],
          messageType: '1',
          charset: 'UTF-8',
          encode: '8bit',
          action: 'send',
        })
      )
      .then((res) => {
        event.reply('sending-success', server_num);
      })
      .catch((error) => {
        event.reply('sending-error', server_num);
      });
  }
};
