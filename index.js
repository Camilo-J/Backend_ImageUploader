import express from "express";
import cors from "cors";
import { upload } from "./app.js";
const app = express();

app.use(cors());
app.use(express.json());

app.post("/api/upload", async (req, res) => {
  //console.log(req);
  const response = await upload(req);
  res.send(response);
});

app.listen(8080, () => console.log("Server on port 3000"));
