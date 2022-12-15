import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import Switch from "@mui/material/Switch";
import { useEffect, useState } from "react";
import Lamp, { Cell } from "./Data";
import { Client, Message } from "paho-mqtt";
import { nanoid } from "nanoid";
import axios from "axios";

const columns: Cell[] = [
  { key: "id", label: "ID" },
  { key: "status", label: "Status" },
  { key: "time", label: "Timestamp" },
];

const broker = process.env.REACT_APP_MQTT_BROKER_HOSTNAME || "";
const topic = process.env.REACT_APP_MQTT_TOPIC || "";
const webSocketPort = Number(process.env.REACT_APP_MQTT_WEB_SOCKET_PORT) || 0;

const client = new Client(broker, webSocketPort, `client_${nanoid(4)}`);

client.connect({
  onSuccess: () => {
    client.subscribe(topic);
  },
});

export default function Dashboard() {
  const [lamps, setLamps] = useState<Lamp[]>([]);
  const [status, setStatus] = useState<boolean>(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
  }>({
    open: false,
    message: "",
  });

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  useEffect(() => {
    document.title = "IoT Smart Lamp";
    axios
      .get<Lamp[]>("http://127.0.0.1:3001/lamp")
      .then((res) => {
        if (res.data.length === 0) {
          setStatus(false);
        } else {
          setStatus(res.data[res.data.length - 1].status);
        }
      })
      .catch((e) => {
        setStatus(false);
      });
  });

  client.onMessageArrived = (message: Message) => {
    const nextStatus = message.payloadString === "on" ? true : false;

    if (status !== nextStatus) {
      axios
        .post(`http://127.0.0.1:3001/lamp/${message.payloadString}`)
        .then(() => {
          if (message.payloadString === "on") {
            setStatus(true);
          } else {
            setStatus(false);
          }
        })
        .catch(() =>
          setSnackbar({
            open: true,
            message: "Unable to process request",
          })
        );
    }
  };

  useEffect(() => {
    axios
      .get<Lamp[]>("http://127.0.0.1:3001/lamp")
      .then((res) => {
        setLamps(res.data);
      })
      .catch(() =>
        setSnackbar({
          open: true,
          message: "Unable to process request",
        })
      );
  }, [status]);

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const onClose = () => {
    setSnackbar({
      open: false,
      message: "",
    });
  };

  return (
    <div className="w-screen h-screen grid grid-cols-2 gap-4">
      <Snackbar
        anchorOrigin={{
          horizontal: "center",
          vertical: "bottom",
        }}
        autoHideDuration={2000}
        open={snackbar.open}
        onClose={onClose}
        message={snackbar.message}
      />
      <div className="grid h-screen">
        <h1 className="text-center font-medium text-5xl m-5">IoT Smart Lamp</h1>
        <div className="place-items-center text-center">
          <FormControl>
            <FormLabel>
              <span className="font-black">Status</span>
            </FormLabel>
            <FormControlLabel
              control={<Switch size="medium" checked={status} />}
              label={status ? "On" : "Off"}
              disabled
              labelPlacement="bottom"
            />
          </FormControl>
        </div>
      </div>
      <div className="h-screen p-4">
        <Paper className="w-full overflow-hidden h-full">
          <TableContainer>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.key} align={"center"}>
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {lamps
                  .sort((a, b) => {
                    return (
                      new Date(b.time).getTime() - new Date(a.time).getTime()
                    );
                  })
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => {
                    return (
                      <TableRow key={row.id}>
                        <TableCell component={"th"} scope="row" align="center">
                          {row.id}
                        </TableCell>
                        <TableCell component={"th"} scope="row" align="center">
                          {row.status ? "On" : "Off"}
                        </TableCell>
                        <TableCell component={"th"} scope="row" align="center">
                          {new Date(row.time).toString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          {lamps.length > 10 && (
            <TablePagination
              rowsPerPageOptions={[10]}
              component="div"
              count={lamps.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </Paper>
      </div>
    </div>
  );
}
