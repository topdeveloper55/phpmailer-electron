import { useState, useEffect, ChangeEvent } from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { IpcMainEvent } from 'electron';
import {
  Container,
  Box,
  Grid,
  Typography,
  Button,
  Input,
  Paper,
  Divider,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Slider,
} from '@mui/material';
import { Pagination } from '@mui/lab';
import { UplSerData, ResponseData } from '../type';

const themeDark = createTheme({
  palette: {
    background: {
      default: '#ffffff',
    },
    text: {
      primary: '#000000',
    },
  },
});

const Hello = () => {
  const [ecount, setEcount] = useState(0);
  const [scount, setScount] = useState(0);
  const [sfcount, setSfcount] = useState(0);
  const [stcount, setStcount] = useState(0);
  const [usedCount, setUsedCount] = useState(0);
  const [namCount, setNamCount] = useState(0);
  const [subCount, setSubCount] = useState(0);
  const [senEmailsCount, setSenEmailsCount] = useState(0);
  const [mesTitle, setMesTitle] = useState('');
  const [attTitle, setAttTitle] = useState('');
  const [ranNamStatus, setRanNamStatus] = useState(false);
  const [ranSubStatus, setRanSubStatus] = useState(false);
  const [ranSenEmaStatus, setRanSenEmaStatus] = useState(false);
  const [limit, setLimit] = useState(100);
  const [couPerReplace, setCouPerReplace] = useState(1000);
  const [sendEnable, setSendEnable] = useState(false);
  const [successStatus, setSuccessStatus] = useState<number[]>([]);
  const [errorStatus, setErrorStatus] = useState<number[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [servers, setServers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (
      ecount &&
      scount &&
      usedCount &&
      usedCount <= scount &&
      namCount &&
      senEmailsCount &&
      subCount &&
      mesTitle &&
      limit * usedCount >= ecount
    )
      setSendEnable(true);
    else setSendEnable(false);
  }, [
    limit,
    ecount,
    scount,
    usedCount,
    namCount,
    senEmailsCount,
    subCount,
    mesTitle,
  ]);

  useEffect(() => {
    if (ecount && totalCount + failedCount === ecount) {
      setFinished(true);
    }
  }, [totalCount, failedCount, ecount]);

  const emailUpload = (): void => {
    window.electron.ipcRenderer.on(
      'email-upload',
      (event: IpcMainEvent, args: number) => {
        setEcount(args);
      }
    );
    window.electron.ipcRenderer.send('email-upload');
  };

  const serverUpload = (): void => {
    window.electron.ipcRenderer.on(
      'server-upload',
      (event: IpcMainEvent, args: UplSerData) => {
        setScount(args.successLength);
        setSfcount(args.failedLength);
        setServers(args.data);
      }
    );
    window.electron.ipcRenderer.on(
      'total-server',
      (event: IpcMainEvent, args: number) => {
        setStcount(args);
      }
    );
    window.electron.ipcRenderer.send('server-upload');
  };

  const namesUpload = (): void => {
    window.electron.ipcRenderer.on(
      'names-upload',
      (event: IpcMainEvent, args: number) => {
        setNamCount(args);
      }
    );
    window.electron.ipcRenderer.send('names-upload');
  };

  const subjectsUpload = (): void => {
    window.electron.ipcRenderer.on(
      'subjects-upload',
      (event: IpcMainEvent, args: number) => {
        setSubCount(args);
      }
    );
    window.electron.ipcRenderer.send('subjects-upload');
  };

  const senEmailsUpload = (): void => {
    window.electron.ipcRenderer.on(
      'senEmails-upload',
      (event: IpcMainEvent, args: number) => {
        setSenEmailsCount(args);
      }
    );
    window.electron.ipcRenderer.send('senEmails-upload');
  };

  const messageUpload = (): void => {
    window.electron.ipcRenderer.on(
      'message-upload',
      (event: IpcMainEvent, args: string) => {
        setMesTitle(args);
      }
    );
    window.electron.ipcRenderer.send('message-upload');
  };

  const attachementUpload = (): void => {
    window.electron.ipcRenderer.on(
      'attachement-upload',
      (event: IpcMainEvent, args: string) => {
        setAttTitle(args);
      }
    );
    window.electron.ipcRenderer.send('attachement-upload');
  };

  const handleSend = (): void => {
    setFinished(false);
    const successMails: number[] = [];
    const failedMails: number[] = [];
    let tCount = 0;
    let fCount = 0;
    for (let i = 0; i < usedCount; i += 1) {
      successMails.push(0);
      failedMails.push(0);
    }
    setSuccessStatus(successMails);
    setErrorStatus(failedMails);
    window.electron.ipcRenderer.send('send-action', {
      ranNamStatus,
      ranSenEmaStatus,
      ranSubStatus,
      usedCount,
      limit,
      couPerReplace,
    });
    window.electron.ipcRenderer.on(
      'sending-success',
      (event: IpcMainEvent, args: ResponseData): void => {
        successMails[args.serverNum] += args.count;
        tCount += args.count;
        setTotalCount(tCount);
        setSuccessStatus(successMails);
      }
    );
    window.electron.ipcRenderer.on(
      'sending-error',
      (event: IpcMainEvent, args: ResponseData): void => {
        failedMails[args.serverNum] += args.count;
        fCount += args.count;
        setFailedCount(fCount);
        setErrorStatus(failedMails);
      }
    );
  };

  const handleResend = (): void => {
    setEcount(failedCount);
    setTotalCount(0);
    setFailedCount(0);
    const buf = new Set(servers);
    for (let i = 0; i < errorStatus.length; i += 1) {
      if (errorStatus[i] > 0) buf.delete(servers[i]);
    }
    const bufArr = Array.from(buf);
    setServers(bufArr);
    window.electron.ipcRenderer.send('resend', bufArr);
    handleSend();
  };

  const handleClear = (): void => {
    setEcount(0);
    setScount(0);
    setSfcount(0);
    setStcount(0);
    setUsedCount(0);
    setNamCount(0);
    setSubCount(0);
    setSenEmailsCount(0);
    setMesTitle('');
    setAttTitle('');
    setRanNamStatus(false);
    setRanSubStatus(false);
    setRanSenEmaStatus(false);
    setLimit(100);
    setCouPerReplace(1000);
    setSendEnable(false);
    setSuccessStatus([]);
    setErrorStatus([]);
    setTotalCount(0);
    setFailedCount(0);
    setServers([]);
    setFinished(false);
    window.electron.ipcRenderer.send('clear-all');
  };

  const handlePagination = (event: ChangeEvent, num: string): void => {
    setPage(num - 1);
  };

  return (
    <ThemeProvider theme={themeDark}>
      <CssBaseline />
      <Container maxWidth="none" sx={{ p: 2 }}>
        <Grid container>
          <Grid item xs={4}>
            <Paper elevation={5} sx={{ mr: 2 }}>
              <Box px={2} py={1}>
                <Box display="flex" alignItems="center" marginBottom="10px">
                  <Button
                    color="success"
                    size="small"
                    variant="contained"
                    sx={{ marginRight: '20px', width: '190px' }}
                    onClick={emailUpload}
                  >
                    EmailList
                  </Button>
                  <Typography>{ecount} emails</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Button
                    color="success"
                    size="small"
                    variant="contained"
                    sx={{ marginRight: '20px', width: '190px' }}
                    onClick={serverUpload}
                  >
                    ServerList
                  </Button>
                  {stcount === scount + sfcount ? (
                    <Typography>
                      Working/not({stcount}):{scount}/{sfcount}
                    </Typography>
                  ) : (
                    <CircularProgress
                      variant="determinate"
                      value={((scount + sfcount) * 100) / stcount}
                    />
                  )}
                </Box>
              </Box>
              <Divider />

              <Box p={1} textAlign="center">
                <Typography>Shipping Setup:</Typography>
              </Box>
              <Divider />

              <Box p={1}>
                <Box p={1} pt={0} display="flex" alignContent="space-between">
                  <Button
                    color="success"
                    size="small"
                    variant="contained"
                    sx={{ marginRight: '20px', width: '190px' }}
                    onClick={namesUpload}
                  >
                    {namCount > 0 ? `${namCount} names` : 'Names'}
                  </Button>
                  <FormControlLabel
                    label="Randomize"
                    control={
                      <Checkbox
                        size="small"
                        onChange={(event: any) =>
                          setRanNamStatus(event.target.checked)
                        }
                      />
                    }
                  />
                </Box>
                <Box p={1} pt={0} display="flex" alignContent="space-between">
                  <Button
                    color="success"
                    size="small"
                    variant="contained"
                    sx={{ marginRight: '20px', width: '190px' }}
                    onClick={senEmailsUpload}
                  >
                    {senEmailsCount > 0
                      ? `${senEmailsCount} emails`
                      : 'Sender Emails'}
                  </Button>
                  <FormControlLabel
                    label="Randomize"
                    control={
                      <Checkbox
                        size="small"
                        onChange={(event: any) =>
                          setRanSenEmaStatus(event.target.checked)
                        }
                      />
                    }
                  />
                </Box>
                <Box p={1} pt={0} display="flex" alignContent="space-between">
                  <Button
                    color="success"
                    size="small"
                    variant="contained"
                    sx={{ marginRight: '20px', width: '190px' }}
                    onClick={subjectsUpload}
                  >
                    {subCount > 0 ? `${subCount} subjects` : 'Subjects'}
                  </Button>
                  <FormControlLabel
                    label="Randomize"
                    control={
                      <Checkbox
                        size="small"
                        onChange={(event: any) =>
                          setRanSubStatus(event.target.checked)
                        }
                      />
                    }
                  />
                </Box>
                <Box p={1} pt={0} display="flex" alignItems="center">
                  <Button
                    color="success"
                    size="small"
                    variant="contained"
                    sx={{ marginRight: '20px', width: '190px' }}
                    onClick={messageUpload}
                  >
                    messageLetter
                  </Button>
                  <Typography>{mesTitle}</Typography>
                </Box>
                <Box p={1} pt={0} display="flex" alignItems="center">
                  <Button
                    color="success"
                    size="small"
                    variant="contained"
                    sx={{ marginRight: '20px', width: '190px' }}
                    onClick={attachementUpload}
                  >
                    Attachement
                  </Button>
                  <Typography>{attTitle}</Typography>
                </Box>
              </Box>
              <Divider />

              <Box p={1} textAlign="center">
                <Typography>Server Options:</Typography>
              </Box>
              <Divider />

              <Box p={1}>
                <Box p={1} pt={0} display="flex" alignContent="space-between">
                  <Typography sx={{ marginRight: '20px' }}>Count:</Typography>
                  <Input
                    sx={{ border: '2px solid green' }}
                    placeholder="count of used servers"
                    onChange={(event: any): void =>
                      setUsedCount(Number(event.target.value))
                    }
                  />
                </Box>
                <Box p={1} pt={0} display="flex" alignContent="space-between">
                  <Typography sx={{ marginRight: '20px' }}>Limit:</Typography>
                  <Slider
                    sx={{ marginRight: '20px' }}
                    value={limit}
                    onChange={(event: any, value: number): void =>
                      setLimit(value)
                    }
                    aria-labelledby="input-slider"
                  />
                  <Typography>{limit}</Typography>
                </Box>
              </Box>

              <Box p={2} display="flex" alignContent="space-around">
                <Button
                  sx={{ marginRight: '20px' }}
                  color="primary"
                  size="medium"
                  variant="contained"
                  disabled={!sendEnable}
                  onClick={handleSend}
                >
                  Send
                </Button>
                <Input
                  placeholder="emails per replace"
                  sx={{ border: '2px solid green' }}
                  value={couPerReplace}
                  onCheck={(event: any): void =>
                    setCouPerReplace(Number(event.target.value))
                  }
                />
              </Box>
              {finished && (
                <Box
                  px={2}
                  display="flex"
                  alignContent="space-between"
                  textAlign="center"
                >
                  <Typography
                    variant="h4"
                    color="red"
                    sx={{ marginRight: '20px' }}
                  >
                    Finished
                  </Typography>
                  <Button
                    color="warning"
                    variant="contained"
                    onClick={handleClear}
                  >
                    Clear All
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={8}>
            <Paper elevation={5}>
              <Box p={2}>
                <Box display="flex" justifyContent="space-around">
                  <Button
                    variant="contained"
                    color="warning"
                    onClick={handleResend}
                  >
                    Resend
                  </Button>
                  <Typography variant="h6">
                    Total Servers: {scount}
                    <span style={{ color: 'red' }}>({usedCount} used)</span>
                  </Typography>
                  <Typography variant="h6">
                    Proceed:{' '}
                    <span color="red">
                      {totalCount}({failedCount} failed)
                    </span>
                  </Typography>
                  <CircularProgress
                    variant="determinate"
                    value={
                      totalCount > 0
                        ? ((totalCount + failedCount) * 100) / ecount
                        : 0
                    }
                  />
                </Box>
              </Box>
              <Divider />

              <Box p={2} height={500} overflow="auto">
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Server number</TableCell>
                        <TableCell>Server URL</TableCell>
                        <TableCell align="right">Success count</TableCell>
                        <TableCell align="right">Failed count</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {successStatus
                        .slice(page * 15, (page + 1) * 15)
                        .map((item, i) => (
                          <TableRow
                            key={i}
                            sx={{
                              '&:last-child td, &:last-child th': { border: 0 },
                            }}
                          >
                            <TableCell component="th" scope="row">
                              Server {page * 15 + i}:
                            </TableCell>
                            <TableCell>{servers[page * 15 + i]}</TableCell>
                            <TableCell align="right">{item} success</TableCell>
                            <TableCell align="right">
                              {errorStatus[page * 15 + i]} failed
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
            <Pagination
              count={Math.floor(usedCount / 15) + 1}
              color="primary"
              onChange={handlePagination}
            />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Hello} />
      </Switch>
    </Router>
  );
}
