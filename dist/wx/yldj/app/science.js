/****************** 导入 ******************/
import Scene from '../libs/ni/scene';
import DB from "../libs/ni/db";
import Widget from '../libs/ni/widget';
import CfgMgr from '../libs/ni/cfgmrg';
import { AppEmitter } from './appEmitter';
import Connect from "../libs/ni/connect";
import { Global } from './global';

/****************** 导出 ******************/

/****************** 本地 ******************/
class Science {
  //知识节点
  // 通用窗口名字节点
  // 通用窗口效果节点
  // 通用窗口消耗节点
  //知识按钮坐标
  //更新知识数量
  static updateScience(id, type) {
    if (type == 0) {
      if (DB.data.science[id][0] == 1 && Global.mainFace.id == 0) {
        Science.unlock_science.push(id + 101);
        Science.updateScienceButton();
      }
    }

    if (type == 1) {
      if (DB.data.science[id][1] && Global.mainFace.id == 0) {
        Science.unlock_science.splice(Science.unlock_science.indexOf(id + 101), 1);
        Science.updateScienceButton();
      }
    }
  } //更新知识按钮


  static updateScienceButton() {
    for (let k = Science.scienceNode.length - 1; k >= 0; k--) {
      Scene.remove(Science.scienceNode[k]);
      Science.scienceNode.splice(k, 1);
    }

    for (let i = 0; i < Science.unlock_science.length; i++) {
      Science.scienceNode[i] = Scene.open("app-ui-scienceButton", Global.mainFace.node, null, {
        id: Science.unlock_science[i],
        coordinate: i
      });
    }
  }

}
/**
 * @description  知识按钮组件
 */


Science.width = 0;
Science.height = 0;
Science.science = [[], [], []];
Science.com_name = void 0;
Science.com_effect = void 0;
Science.com_cost = void 0;
Science.science_sprite = [];
Science.cur_scienceId = 0;
Science.coordinate = {
  left: [0, 300, 0, 300, 0, 300, 0, 300],
  top: [0, 0, 150, 150, 300, 300, 450, 450]
};
Science.unlock_science = [];
Science.scienceNode = [];

class WscienceButton extends Widget {
  constructor(...args) {
    super(...args);
    this.backNode = void 0;
  }

  setProps(props) {
    super.setProps(props);
    let bcfg = CfgMgr.getOne("app/cfg/science.json@science"),
        id = props.id,
        name = bcfg[id]["name"];
    this.cfg.children[0].data.text = `${name}`;
    this.cfg.data.left = Science.coordinate.left[props.coordinate];
    this.cfg.data.top = Science.coordinate.top[props.coordinate];
    this.cfg.on = {
      "tap": {
        "func": "unlockScience",
        "arg": [id]
      }
    };
  }

  unlockScience(type) {
    this.backNode = Scene.open(`app-ui-back`, Global.mainFace.node);
    Scene.open(`app-ui-comscienceWindow`, this.backNode, null, {
      id: type,
      backNode: this.backNode
    });
  }

  added(node) {}

}
/**
 * @description  知识界面组件
 */


class WScience extends Widget {
  added(node) {}

  manfood_number() {
    Connect.request({
      type: "app/res@manfood",
      arg: {}
    }, data => {
      if (data.err) {
        return console.log(data.err.reson);
      }

      DB.data.res.food[1] = data.ok;
    });
  }

} //知识弹窗


class WcomWindow extends Widget {
  constructor(...args) {
    super(...args);
    this.node = void 0;
  }

  setProps(props) {
    super.setProps(props);
    let bcfg = CfgMgr.getOne("app/cfg/science.json@science"),
        id = props.id,
        cost = bcfg[id][`cost`],
        effect = bcfg[id]["effect_type"];
    this.cfg.children[1].data.text = `${bcfg[id]["name"]}`;
    this.cfg.children[2].data.text = `效果：${bcfg[id]["effect_dis"]}`;
    this.cfg.children[3].data.text = `消耗：${cost}知识`;
    Science.cur_scienceId = id;
  }

  levelup() {
    let id = Science.cur_scienceId,
        bcfg = CfgMgr.getOne("app/cfg/science.json@science"),
        cost = bcfg[id][`cost`],
        effect = bcfg[id]["effect_type"];
    Connect.request({
      type: "app/science@unlock",
      arg: id
    }, data => {
      if (data.err) {
        AppEmitter.emit("message", "知识不足！");
        return console.log(data.err.reson);
      }

      for (let i = 0; i < effect.length; i++) {
        DB.data[effect[i][0]][effect[i][1]][effect[i][2]] = data.ok[2][i];
      }

      DB.data.science[id - 101][1] = data.ok[0];
      DB.data.res.sci[1] = data.ok[1]; //更新窗口信息

      this.remove();
      Science.com_name.text = `${bcfg[id]["name"]}`;
      Science.com_effect.text = `效果：${bcfg[id]["effect_dis"]}`;
      Science.com_cost.text = `消耗：${cost}知识`;
    });
  }

  remove() {
    Scene.remove(this.node);
  }

  added(node) {
    this.node = this.props.backNode;
    Science.com_name = this.elements.get("name");
    Science.com_effect = this.elements.get("effect");
    Science.com_cost = this.elements.get("cost");
  }

}
/**
 * @description 打开知识界面
 */


const open = () => {
  Global.mainFace.node = Scene.open("app-ui-science", Scene.root);
  Global.mainFace.id = 0;
  Science.unlock_science = []; //显示解锁的知识按钮

  for (let i = 0; i < DB.data.science.length; i++) {
    if (DB.data.science[i][0] && !DB.data.science[i][1]) {
      Science.unlock_science.push(i + 101);
    }
  }

  Science.updateScienceButton();
};
/****************** 立即执行 ******************/
//注册组件


Widget.registW("app-ui-science", WScience);
Widget.registW("app-ui-comscienceWindow", WcomWindow);
Widget.registW("app-ui-scienceButton", WscienceButton); //初始化知识数据库 [是否解锁，等级]

const initScience = () => {
  let bcfg = CfgMgr.getOne("app/cfg/science.json@science"),
      tempDB = [[1, 0]];

  for (let k in bcfg) {
    tempDB.push([0, 0]);
  }

  DB.init("science", tempDB);
}; //注册页面打开事件


AppEmitter.add("intoScience", node => {
  open();
}); //知识注册监听

const emtScience = () => {
  for (let i = DB.data.science.length - 1; i >= 0; i--) {
    for (let j = 0; j < 2; j++) {
      DB.emitter.add(`science.${i}.${j}`, ((x, y) => {
        return () => {
          Science.updateScience(x, y);
        };
      })(i, j));
    }
  }
}; //重新开始，重置数据库


AppEmitter.add("initDB", node => {
  initScience();
  emtScience();
});