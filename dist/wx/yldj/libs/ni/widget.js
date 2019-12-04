/**
 * @description 组件管理
 */

/****************** 导入 ******************/
import Util from "./util";
import Loader from "./loader";
/****************** 导出 ******************/

export default class Widget {
  constructor(url, props) {
    this.url = void 0;
    this.cfg = void 0;
    this.props = void 0;
    this.elements = new Map();

    if (!this.url) {
      this.url = url;
    }

    this.cfg = Util.copy(Widget.cfgCache.get(this.url));
    this.setProps(props);
  }

  //设置props
  setProps(props) {
    this.props = props;
  } //组件被添加到场景,渲染周期内调用，谨慎使用

  /**
   * 
   * @param o 渲染对象
   */


  added(o) {} //组件被销毁


  destory() {} //组件扩展类缓存


  /**
   * @description 注册组件
   * @param name 组件名
   * @param w 组件类
   */
  static registW(name, w) {
    Widget.wCache.set(name, w);
  }
  /**
   * @description 注册组件配置
   * @param cfgs 组件配置
   */


  static registWC(cfgs) {
    for (let k in cfgs) {
      if (k.indexOf(Widget.cfgDir) == 0) {
        Widget.cfgCache.set(k.replace(".json", "").replace(/\//g, "-"), JSON.parse(cfgs[k]));
        delete cfgs[k];
      }
    }
  }
  /**
   * @description 查找组件配置
   * @param name 组件名字("app-ui-player")
   */


  static findWC(name) {
    return Util.copy(Widget.cfgCache.get(name));
  }
  /**
   * @description 创建组件
   * @param name 组件名
   */


  static factory(name, wName, prop) {
    let w = Widget.wCache.get(wName) || Widget;
    return new w(name, prop);
  }

}
Widget.cfgDir = "app/ui/";
Widget.wCache = new Map();
Widget.cfgCache = new Map();
;
/****************** 立即执行 ******************/
//绑定资源监听

Loader.addResListener("registWC", Widget.registWC);