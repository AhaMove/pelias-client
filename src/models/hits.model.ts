import { ResponseModel } from "./response.model.js";

export interface HitsModel<T> {
  hits: {
    hits: Array<ResponseModel<T>>;
  };
}
