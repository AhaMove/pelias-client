import { ResponseModel } from "./response.model";
export interface HitsModel<T> {
    hits: {
        hits: Array<ResponseModel<T>>;
    };
}
