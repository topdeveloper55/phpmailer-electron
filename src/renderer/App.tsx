import { useState, useEffect } from 'react';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
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
} from '@mui/material';

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
  const [e_count, setE_count] = useState(0);
  const [s_count, setS_count] = useState(0);
  const [used_count, setUsed_count] = useState(0);
  const [send_enable, setSend_enable] = useState(false);
  const [successStatus, setSuccessStatus] = useState([]);
  const [errorStatus, setErrorStatus] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [servers, setServers] = useState([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (e_count && s_count && used_count && used_count <= s_count)
      setSend_enable(true);
    else setSend_enable(false);
  }, [e_count, s_count, used_count]);

  useEffect(() => {
    if (e_count && totalCount + failedCount === e_count) {
      setFinished(true);
    };
  }, [totalCount, failedCount]);

  const emailUpload = (): void => {
    window.electron.ipcRenderer.on('email-upload', (event, args) => {
      setE_count(args);
    });
    window.electron.ipcRenderer.send('email-upload');
  };

  const serverUpload = (): void => {
    window.electron.ipcRenderer.on('server-upload', (event, args) => {
      console.log('args: ', args);
      setS_count(args.length);
      setServers(args.data);
    });
    window.electron.ipcRenderer.send('server-upload');
  };

  const handleSend = (): void => {
    setFinished(false);
    let zeroArr = [];
    for (let i = 0; i < used_count; i++) {
      zeroArr.push(0);
    }
    let sArr = [...zeroArr];
    let eArr = [...zeroArr];
    let tCount = 0;
    let fCount = 0;
    setSuccessStatus(zeroArr);
    setErrorStatus(zeroArr);
    window.electron.ipcRenderer.send('send-action', used_count);
    window.electron.ipcRenderer.on('sending-success', (event, server_num) => {
      sArr = [...sArr];
      setTotalCount(++tCount);
      sArr[server_num] = 1 + sArr[server_num];
      setSuccessStatus(sArr);
    });
    window.electron.ipcRenderer.on('sending-error', (event, server_num) => {
      eArr = [...eArr];
      setFailedCount(++fCount);
      eArr[server_num]++;
      setErrorStatus(eArr);
    });
  };

  return (
    <ThemeProvider theme={themeDark}>
      <CssBaseline />
      <Container maxWidth="none" sx={{ p: 2 }}>
        <Grid container>
          <Grid item xs={4}>
            <Paper elevation={5} sx={{ mr: 2 }}>
              <Box p={2}>
                <Box display="flex" alignItems="center" marginBottom="20px">
                  <Typography marginRight="20px">Email List:</Typography>
                  <Button
                    color="success"
                    size="medium"
                    variant="contained"
                    sx={{ marginRight: '20px' }}
                    onClick={emailUpload}
                  >
                    Upload File
                  </Button>
                  <Typography>{e_count} emails</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Typography marginRight="20px">Server List:</Typography>
                  <Button
                    color="success"
                    size="medium"
                    variant="contained"
                    sx={{ marginRight: '20px' }}
                    onClick={serverUpload}
                  >
                    Upload File
                  </Button>
                  <Typography>{s_count} servers</Typography>
                </Box>
              </Box>
              <Divider />

              <Box p={1} textAlign="center">
                <Typography>Shipping Setup:</Typography>
              </Box>
              <Divider />

              <Box p={1}>
                <Typography>
                  How many servers do you want to use simultaneously?
                </Typography>
                <Box display="flex" alignItems="center" marginBottom="20px">
                  <Typography marginRight="20px">
                    Total Servers: {s_count}
                  </Typography>
                  <Input
                    placeholder="count of servers"
                    onChange={(ev) => setUsed_count(parseInt(ev.target.value))}
                  />
                </Box>
              </Box>
              <Divider />

              <Box p={3}>
                <Button
                  color="primary"
                  size="medium"
                  variant="contained"
                  disabled={!send_enable}
                  onClick={handleSend}
                >
                  Send
                </Button>
              </Box>
              {finished && (
                <Box textAlign="center">
                  <Typography variant="h3" color="red">
                    Finished
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={8}>
            <Paper elevation={5}>
              <Box p={2}>
                <Box display="flex" justifyContent="space-around">
                  <Typography variant="h6">Shpping Log</Typography>
                  <Typography variant="h6">
                    Total Servers: {s_count}
                    <span style={{ color: 'red' }}>({used_count} used)</span>
                  </Typography>
                  <Typography variant="h6">
                    Total emails sent:{' '}
                    <span style={{ color: 'red' }}>
                      {totalCount}({failedCount} failed)
                    </span>
                  </Typography>
                </Box>
              </Box>
              <Divider />

              <Box p={2} height={400} overflow="auto">
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
                      {successStatus.map((item, i) => (
                        <TableRow
                          key={i}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                          }}
                        >
                          <TableCell component="th" scope="row">
                            Server {i}:
                          </TableCell>
                          <TableCell>{servers[i]}</TableCell>
                          <TableCell align="right">{item} success</TableCell>
                          <TableCell align="right">{errorStatus[i]} failed</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
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
