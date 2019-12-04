/****************** 导入 ******************/
import * as PIXI from '../pixijs/pixi';
import Util from "./util";
import Fs from './fs';
/****************** 导出 ******************/

export default class Loader {
  /**
   * @description 下载状态
   */

  /**
   * @description 等待下载的任务，先进先下
   */

  /**
   * @description 图片资源缓存
   */

  /**
   * @description 资源下载监听
   */

  /**
   * @description 下载进度回调,由外部重载
   */

  /**
   * @description 添加下载任务
   * @param arr ["url","images/xxx.png",....]
   * @param successCallback 下载完成的回调
   */
  static add(arr, successCallback, process) {
    if (Loader.status === Loader.LOADSTATUS.loading) {
      return Loader.wait.push(new Waiter(arr, successCallback, process));
    }

    new Waiter(arr, successCallback, process).start();
  }
  /**
   * @description 下载下一批资源
   */


  static next() {
    let next = Loader.wait.shift();

    if (Loader.status === Loader.LOADSTATUS.free && next) {
      next.start();
    }
  }
  /**
   * @description 更新图片资源
   * @param res 
   */


  static addResource(k, res) {
    Loader.resources[k] = res;
  }
  /**
   * @description 设置资源监听
   * @param name 函数名字
   * @param func 函数
   */


  static addResListener(name, func) {
    Loader.resListener[name] = func;
  }
  /**
   * @description 分发资源到各个模块，暂时只有json
   */


  static distributeResource(res) {
    Loader.resListener.registWC(res);
    Loader.resListener.registCfg(res);
    Loader.resListener.addSpineData(res); // Loader.resListener.addDragonData(res);

    Loader.resListener.registMusic(res);
    Loader.resListener.createSpriteSheets(res);
  }

}
/****************** 本地 ******************/

Loader.LOADSTATUS = {
  free: 0,
  // 空闲
  loading: 1 // 加载中

};
Loader.status = Loader.LOADSTATUS.free;
Loader.wait = [];
Loader.resources = {};
Loader.resListener = {};

Loader.process = r => {
  console.log(`load progress：${r}`);
};

const loader = PIXI.loader;
const fs = window.wx ? window.wx.getFileSystemManager() : () => {}; //图片资源后缀

var Image; //资源下载类，每批资源都通过该类封装下载

(function (Image) {
  Image[Image[".png"] = 1] = ".png";
  Image[Image[".jpg"] = 2] = ".jpg";
})(Image || (Image = {}));

class Waiter {
  constructor(arr, callback, process) {
    this.text = [];
    this.images = [];
    this.callback = null;
    this.total = 0;
    this.loaded = 0;
    this.resource = {};
    this.list = [];
    this._process = void 0;
    this.list = arr;
    this.callback = callback;
    this._process = process;
  }
  /**
   * @description 找出
   * @param res 
   */


  findImg(res) {
    let suffix;

    for (let k in res) {
      suffix = Util.fileSuffix(k);

      if (Image[suffix]) {
        this.images.push(k);
      } else {
        this.text.push(k);
      }
    }
  }

  start() {
    const _this = this;

    Loader.status = Loader.LOADSTATUS.loading;
    this.resource = Fs.read(this.list, () => {
      _this.downloaded();
    }, r => {
      _this.process();
    });
    this.findImg(this.resource);
    this.total = this.images.length * 2 + this.text.length;
  }

  process() {
    this.loaded += 1;

    if (this._process) {
      this._process(this.loaded / this.total);
    } else {
      Loader.process(this.loaded / this.total);
    }
  }

  downloaded() {
    for (let i = 0, len = this.images.length; i < len; i++) {
      // loader.add(this.images[i],Fs.fs.createImg(this.images[i],this.resource[this.images[i]]));
      Loader.addResource(this.images[i], {
        name: this.images[i],
        texture: PIXI.Texture.fromImage(Fs.fs.createImg(this.images[i], this.resource[this.images[i]]))
      });
      delete this.resource[this.images[i]];
      this.process();
    } // loader.on("progress", ()=>{
    // 	_this.process();
    // })
    // .load((ld,res)=>{
    // 	console.log(res);
    // 	Loader.addResource(res);


    this.complete(); // });
  }

  complete() {
    if (this.loaded === this.total) {
      Loader.status = Loader.LOADSTATUS.free;
      loader.reset();
      Loader.distributeResource(this.resource);
      this.callback && this.callback();
      Loader.next();
    }
  }

}