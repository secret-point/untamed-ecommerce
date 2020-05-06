import { axiosHelper } from "./../helpers/axios-helper";
import { AxiosInstance } from "axios";
import {
  CreateApplicationRequest,
  UpdateNonFcraRequest
} from "../@types/candidate-application-service-requests";
export default class CandidateApplicationService {
  private readonly axiosInstance: AxiosInstance;
  constructor() {
    this.axiosInstance = axiosHelper("/api/candidate-application");
  }

  async getApplication(applicationId: string) {
    const response = await this.axiosInstance.get(
      `/applications/${applicationId}`,
      {
        headers: {
          "Cache-Control": "no-cache"
        }
      }
    );
    return response.data;
  }

  async createApplication(payload: CreateApplicationRequest) {
    const response = await this.axiosInstance.post(
      "/createApplication",
      payload
    );
    return response.data;
  }

  async updateNonFcraQuestions(
    applicationId: string,
    payload: UpdateNonFcraRequest
  ) {
    const response = await this.axiosInstance.put(
      `/updateNonFcraQuestions/${applicationId}`,
      payload,
      {
        headers: {
          "Cache-Control": "no-cache"
        }
      }
    );
    return response.data;
  }
}
