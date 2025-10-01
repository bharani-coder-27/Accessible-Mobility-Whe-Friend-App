import axios from "axios";
//import { API_URL } from "@env";

export default axios.create({
  baseURL: "http://10.24.183.189:8801/api",
});
