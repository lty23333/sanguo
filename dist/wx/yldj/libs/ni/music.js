/****************** 导入 ******************/
import Loader from "./loader";
import Util from "./util";
import Fs from "./fs";
/****************** 导出 ******************/

export default class Music {
  //音乐缓存表
  static table = {}; //背景音乐

  static bgm = "";
  /**
   * @description 初始化配置表
   * @param data 配置数据{"audio/xx":decodeAudioData}
   */

  static registMusic(data) {
    for (let k in data) {
      if (Util.fileSuffix(k) == ".mp3") {
        decodeAudioData(k, data[k]);
        delete data[k];
      }
    }
  }
  /**
   * @description 播放音乐
   */


  static play(path, loop) {
    let m = Music.table[path];

    if (loop) {
      m.loop = loop;
      Music.bgm = path;
    }

    m.start();
  }
  /**
   * @description 暂停音乐
   */


  static stop(path) {
    Music.table[path].stop(0);
  }

}
/****************** 本地 ******************/

/**
 * @description 兼容微信
 */

class Source {
  constructor() {
    this.audio = window.wx.createInnerAudioContext();
  }

  get buffer() {
    return this._buffer;
  }

  set buffer(val) {
    if (this._buffer === val) {
      return;
    }

    this._buffer = val;
    this.audio.src = val;
  }

  get loop() {
    return this._loop;
  }

  set loop(val) {
    if (this._loop === val) {
      return;
    }

    this._loop = val;

    if (val) {
      this.audio.autoplay = true;
      this.audio.loop = true;
    }
  }

  start() {
    this.audio.play();
  }

  stop() {
    this.audio.stop();
  }

  pause() {
    this.audio.pause();
  }

}

class WxAudio {
  constructor() {}

  decodeAudioData(data, callback) {
    callback();
  }

  createBufferSource() {
    return new Source();
  }

}

const autioCtx = new (window.AudioContext || window.webkitAudioContext || WxAudio)();
/**
 * @description 解析音乐资源
 * @param k "app/autio/xx.mp3"
 * @param data ArrayBuffer
 */

const decodeAudioData = (k, data) => {
  autioCtx.decodeAudioData(data, buff => {
    let a = autioCtx.createBufferSource();
    a.buffer = buff || Fs.fs.createImg(k);
    Music.table[k] = a;
  });
};
/****************** 立即执行 ******************/
//绑定资源监听


Loader.addResListener("registMusic", Music.registMusic);