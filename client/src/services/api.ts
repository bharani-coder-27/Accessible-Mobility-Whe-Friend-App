import axios from "axios";
//import { API_URL } from "@env";

export default axios.create({
  baseURL: "http://172.100.137.168:8801/api",
});
