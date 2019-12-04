/****************** 导入 ******************/
import Loader from "./loader";
import Util from "./util";
import Fs from "./fs";
import Emitter from "./emitter";
/****************** 导出 ******************/

export default class Music {
  //音乐缓存表
  //背景音乐

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
    if (Music.table[path] && Music.table[path].PLAYING_STATE == Music.table[path].playbackState) {
      Music.table[path].stop();
    }

    let m = createBufferSource(path);

    if (loop) {
      Music.bgm = path;

      if (!m) {
        return;
      }

      m.loop = loop;
    }

    try {
      m.start();
      Music.table[path] = m;
    } catch (e) {
      console.log(e);
    }
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

Music.buffs = {};
Music.table = {};
Music.bgm = "";

class Source {
  constructor() {
    this.audio = void 0;
    this._buffer = void 0;
    this._loop = void 0;
    this._src = void 0;
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
    Music.buffs[k] = buff || Fs.fs.createImg(k);

    if (Music.bgm && Music.bgm == k && !Music.table[k]) {
      Music.play(k, true);
    }
  });
};

const createBufferSource = k => {
  if (!Music.buffs[k]) {
    return;
  }

  let a = autioCtx.createBufferSource();
  a.buffer = Music.buffs[k];
  a.connect && a.connect(autioCtx.destination);
  return a;
};
/****************** 立即执行 ******************/
//绑定资源监听


Loader.addResListener("registMusic", Music.registMusic);
Emitter.global.add("hide", () => {
  if (Music.bgm) {
    Music.stop(Music.bgm);
  }
});
Emitter.global.add("show", () => {
  if (Music.bgm) {
    Music.play(Music.bgm, true);
  }
});