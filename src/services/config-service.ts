import axios, { AxiosInstance } from "axios";
import Axios from "axios";

export default class ConfigService {
  readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: "/api/config"
    });
  }

  async getConfig(): Promise<any> {
    const response = await this.axiosInstance.get("/");
    return response.data;
  }

  async getCountryStateList(): Promise<any> {
    const response = await Axios.get(
      "https://m.media-amazon.com/images/G/01/HVH-CandidateApplication/jobs/countries-and-states.json"
    );
    return response.data;
  }
}
