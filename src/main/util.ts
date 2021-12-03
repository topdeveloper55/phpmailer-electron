/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { IpcMainEvent } from 'electron';
import { URL } from 'url';
import path from 'path';
import axios from 'axios';
import qs from 'qs';
//import FormData from 'form-data';

const config = {
  headers: {
    'Content-Type': 'multipart/form-data',
    'Accept-Encoding': 'gzip, deflate',
  },
};

//let formData: FormData = new FormData();

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

const createFormData = (ranStatus: boolean): void => {
  //formData = new FormData();
  if (ranStatus) {
    senEmail = ranSenEmaStatus
      ? senEmails[Math.floor(Math.random() * senEmails.length)]
      : senEmails[0];
    senName = ranNamStatus
      ? names[Math.floor(Math.random() * names.length)]
      : names[0];
    subject = ranSubStatus
      ? subjects[Math.floor(Math.random() * subjects.length)]
      : subjects[0];
  }
  // formData.append('senderEmail', senEmail);
  // formData.append('senderName', senName);
  // formData.append('subject', subject);
  // formData.append('attachment', attachment, fileName);
  // formData.append('replyTo', '');
  // formData.append('messageLetter', message);
  // formData.append('messageType', '1');
  // formData.append('charset', 'UTF-8');
  // formData.append('encode', '8bit');
  // formData.append('action', 'send');
};

export const sendEmailPerServer = async (
  event: IpcMainEvent,
  serverNum: number,
  from: number,
  to: number
): Promise<void> => {
  let emails = emailList.slice(from, to).join('\r\n');
  createFormData(from % couPerReplace < 10);
  //formData.append('emailList', emails);
  try {
    let res = await axios.post(
      serverList[serverNum],
      qs.stringify({
        senderEmail: senEmail,
        senderName: senName,
        subject: subject,
        messageLetter: message,
        emailList: emails,
        messageType: '1',
        charset: 'UTF-8',
        encode: '8bit',
        action: 'send',
      }),
      config
    );
    if (res)
      event.reply('sending-success', {
        serverNum: serverNum,
        count: to - from,
      });
  } catch (err) {
    for (let i = from; i < to; i += 1) {
      failedEmails.push(emailList[i]);
    }
    //serverList.splice(serverNum, 1);
    event.reply('sending-error', {
      serverNum: serverNum,
      count: to - from,
    });
  }
};

export const serverTesting = async (
  event: IpcMainEvent,
  serverUri: string
): Promise<void> => {
  try {
    let res = await axios.post(
      serverUri,
      qs.stringify({
        senderEmail: 'support@nagoya-boushi.org',
        senderName: 'test',
        subject: 'Server Testing',
        messageLetter: `Mailer Server Url: ${serverUri}`,
        emailList: 'davidmacedo595@gmail.com',
        messageType: '1',
        charset: 'UTF-8',
        encode: '8bit',
        action: 'send',
      })
    );
    serverList.push(serverUri);
    event.reply('server-upload', {
      successLength: serverList.length,
      failedLength: failedCount,
      data: serverList,
    });
  } catch (err) {
    failedCount += 1;
    event.reply('server-upload', {
      successLength: serverList.length,
      failedLength: failedCount,
      data: serverList,
    });
  }
};
/**
 * Forms data
 */
