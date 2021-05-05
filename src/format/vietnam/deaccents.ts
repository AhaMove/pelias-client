import { flow, replace } from "lodash/fp"

const deaccents = flow([
  replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a"),
  replace(/[èéẹẻẽêềếệểễ]/g, "e"),
  replace(/[ìíịỉĩ]/g, "i"),
  replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o"),
  replace(/[ùúụủũưừứựửữ]/g, "u"),
  replace(/[ỳýỵỷỹ]/g, "y"),
  replace(/đ/g, "d"),
  replace(/[ÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴ]/g, "A"),
  replace(/[ÈÉẸẺẼÊỀẾỆỂỄ]/g, "E"),
  replace(/[ÌÍỊỈĨ]/g, "I"),
  replace(/[ÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠ]/g, "O"),
  replace(/[ÙÚỤỦŨƯỪỨỰỬỮ]/g, "U"),
  replace(/[ỲÝỴỶỸ]/g, "Y"),
  replace(/Đ/g, "D"),
])

export default deaccents
