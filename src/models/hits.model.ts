import { ResponseModel } from "src/models/response.model";

export interface HitsModel<T> {
  hits: {
    hits: Array<ResponseModel<T>>;
  };
}
