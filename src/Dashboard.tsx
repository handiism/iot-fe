import {
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
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

const columns: Cell[] = [
  { key: "id", label: "ID" },
  { key: "status", label: "Status" },
  { key: "timestamp", label: "Timestamp" },
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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  client.onMessageArrived = (message: Message) => {
    if (message.payloadString === "on") {
      setStatus(true);
    } else {
      setStatus(false);
    }
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  useEffect(() => {
    const lamp: Lamp = {
      id: lamps.length === 0 ? 1 : lamps.length + 1,
      status: status,
      timestamp: new Date(),
    };
    setLamps([...lamps, lamp]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="w-screen h-screen grid grid-cols-2 gap-4">
      <div className="grid h-screen place-items-center text-center">
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
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
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
                          {row.timestamp.toString()}
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
