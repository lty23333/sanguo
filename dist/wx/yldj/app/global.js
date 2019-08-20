/****************** 导入 ******************/

/****************** 导出 ******************/
export class Global {
  //当前主界面信息
  static mainFace = {
    id: 2,
    node: null
  };
  static color = ["#adbbd9", "#99FF33", "#3399FF", "#660099", "#FF9900", "#FF3300"];
}
export function rand(number) {
  return Math.ceil(Math.random() * number);
}
;