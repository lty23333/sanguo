/****************** 导入 ******************/
import Scene from '../libs/ni/scene';
import DB from "../libs/ni/db";
import Widget from '../libs/ni/widget';
import CfgMgr from '../libs/ni/cfgmrg';
import { AppEmitter } from './appEmitter';
import Connect from "../libs/ni/connect";
import { Global } from './global';
import { addNews } from './stage';
/****************** 导出 ******************/

/****************** 本地 ******************/

let buildNode; // 建筑渲染节点

class Build {
  //建筑节点
  // 资源节点
  // 通用窗口名字节点
  // 通用窗口效果节点
  // 通用窗口消耗节点
  //酒馆刷新费用节点
  //资源名
  //更新建筑数量
  static updateBuild(id, type) {
    if (type == 0) {
      if (DB.data.build[id][0] >= 1 && Global.mainFace.id == 2) {
        Build.build_sprite = Scene.open("app-ui-buildButton", Global.mainFace.node, null, {
          id: id + 1001
        });
      }
    }

    if (type == 1) {
      let bcfg = CfgMgr.getOne("app/cfg/build.json@build");

      if (bcfg != undefined && Global.mainFace.id == 2) {
        let name = bcfg[`${id + 1001}`]["name"];

        if (Build.build[id][0] != undefined) {
          Build.build[id][0].text = `${name}（${DB.data.build[id][1]}）`;
        }
      }
    }
  }

} //随机数生成


Build.width = 0;
Build.height = 0;
Build.build = [[], [], []];
Build.res = {
  food: [],
  wood: [],
  sci: [],
  gold: []
};
Build.com_name = void 0;
Build.com_effect = void 0;
Build.com_cost = void 0;
Build.hotel_update = void 0;
Build.res_name = ["food", "wood", "sci", "gold"];
Build.res_Cname = ["粮食", "木材", "黄金", "知识"];
Build.army_Cname = ["步兵", "骑兵", "弓兵"];
Build.build_sprite = [];
Build.cur_buildId = 0;
Build.phero = [80, 15, 4, 0.8, 0.2, 0];
Build.heroNode = [];
Build.goodsNode = [];
Build.shopGoods = [];
Build.shopCost = [];
Build.totalNode = void 0;

function rnd(seed) {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280.0;
}

;
/**
 * @description  建筑按钮组件
 */

class WbuildButton extends Widget {
  constructor(...args) {
    super(...args);
    this.backNode = void 0;
  }

  setProps(props) {
    super.setProps(props);
    let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
        id = props.id,
        name = bcfg[id]["name"];
    this.cfg.children[1].data.text = `${bcfg[id]["name"]}(${DB.data.build[id - 1001][1]})`;
    this.cfg.data.left = bcfg[id]["left"];
    this.cfg.data.top = bcfg[id]["top"];
    this.cfg.on = {
      "tap": {
        "func": "addBuild",
        "arg": [id]
      }
    };
  }

  addBuild(type) {
    this.backNode = Scene.open(`app-ui-back`, Global.mainFace.node); //如果是酒馆，则特殊处理

    if (type == 1009) {
      Connect.request({
        type: "app/hero@choose",
        arg: 2
      }, data => {
        if (data.err) {
          return console.log(data.err.reson);
        } else {
          Scene.open(`app-ui-hotel`, this.backNode, null, {
            id: 1009,
            backNode: this.backNode
          });

          for (let i = 0; i < data.ok[0].length; i++) {
            Build.heroNode[i] = Scene.open(`app-ui-hero`, this.backNode, null, {
              id: data.ok[0][i],
              backNode: this.backNode,
              left: 40 + i * 230
            });
          }
        }
      });
    } else if (type == 1014) {
      Scene.open(`app-ui-shop`, this.backNode, null, {
        id: 1014
      });

      for (let i = 0; i < 6; i++) {
        Build.goodsNode[i] = Scene.open(`app-ui-shop_goods`, this.backNode, null, {
          id: i
        });
      }
    } else {
      Scene.open(`app-ui-combuildWindow`, this.backNode, null, {
        id: type,
        backNode: this.backNode
      });
    }
  }

  added(node) {
    Build.build[node.widget.props.id - 1001] = [];
    Build.build[node.widget.props.id - 1001][0] = this.elements.get("button_add");
  }

}
/**
 * @description  建筑界面组件
 */


class WBuild extends Widget {
  added(node) {
    Build.totalNode = this.elements.get("build_number");
  }

  manfood_number() {
    Connect.request({
      type: "app/res@manfood",
      arg: {}
    }, data => {
      if (data.err) {
        return console.log(data.err.reson);
      }

      DB.data.res.food[1] = data.ok;
      AppEmitter.emit("message", "粮食+2");
    });
  }

} //市场资源弹窗


class Wgoods extends Widget {
  constructor(...args) {
    super(...args);
    this.node = void 0;
  }

  setProps(props) {
    super.setProps(props);
    let goods = [["黄金", "粮食"], ["黄金", "木材"], ["黄金", "知识"], ["粮食", "黄金"], ["木材", "黄金"], ["知识", "黄金"]],
        id = props.id;
    this.cfg.children[1].data.text = `${Math.ceil(DB.data.shop.price[id] * DB.data.shop.number[0])}${goods[id][1]}`;
    this.cfg.children[2].data.text = `${DB.data.shop.number[0]}${goods[id][0]}`;
    this.cfg.on = {
      "tap": {
        "func": "buy",
        "arg": [id]
      }
    };
    this.cfg.data.left = 105 + id % 3 * 190;
    this.cfg.data.top = id < 3 ? 440 : 620;
  }

  buy(id) {
    let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
        goods = [["黄金", "粮食"], ["黄金", "木材"], ["黄金", "知识"], ["粮食", "黄金"], ["木材", "黄金"], ["知识", "黄金"]],
        goods2 = [["gold", "food"], ["gold", "wood"], ["gold", "sic"], ["food", "gold"], ["wood", "gold"], ["sic", "gold"]];
    Connect.request({
      type: "app/shop@buy",
      arg: id
    }, data => {
      if (data.err == 1) {
        AppEmitter.emit("message", `${goods[id][0]}不足!`);
        return console.log(data.err.reson);
      } else {
        DB.data.res[goods2[id][0]] = data.ok[0];
        DB.data.res[goods2[id][1]] = data.ok[1];
        DB.data.shop.price[id] = data.ok[2];
        Build.shopGoods[id].text = `${Math.ceil(DB.data.shop.price[id] * DB.data.shop.number[0])}${goods[id][1]}`;
        Build.shopCost[id].text = `${DB.data.shop.number[0]}${goods[id][0]}`;
        AppEmitter.emit("message", `已购买${goods[id[1]]}`);
      }
    });
  }

  remove() {
    Scene.remove(this.node);
  }

  added(node) {
    this.node = node;
    Build.shopGoods[node.widget.props.id] = this.elements.get("goods");
    Build.shopCost[node.widget.props.id] = this.elements.get("cost");
  }

} //市场弹窗


class Wshop extends Widget {
  constructor(...args) {
    super(...args);
    this.node = void 0;
  }

  setProps(props) {
    super.setProps(props);
    let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
        id = 1014,
        bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
        cost = bcfg2[DB.data.build[id - 1001][1] + 1][`a${id}`] * bcfg[id]["cost_number1"],
        cost_name = bcfg[id]["cost_type1"];
    this.cfg.children[1].data.text = `${bcfg[id]["name"]}(${DB.data.build[id - 1001][1]})`;
    this.cfg.children[8].data.text = `${bcfg[id]["effect_dis"].replace("{{effect_number}}", bcfg[id]["effect_number"][0])}`;
    this.cfg.children[11].data.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(cost_name)]}`;
    this.cfg.children[13].data.text = `${bcfg[id]["dis"]}`;
    Build.cur_buildId = id;
  }

  levelup() {
    let id = Build.cur_buildId,
        bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
        bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
        cost = bcfg2[DB.data.build[id - 1001][1] + 2][`a${id}`] * bcfg[id]["cost_number1"],
        cost_name = bcfg[id]["cost_type1"],
        goods = [["黄金", "粮食"], ["黄金", "木材"], ["黄金", "知识"], ["粮食", "黄金"], ["木材", "黄金"], ["知识", "黄金"]],
        effect = bcfg[id]["effect_type"];
    Connect.request({
      type: "app/build@levelup",
      arg: id
    }, data => {
      if (data.err == 1) {
        AppEmitter.emit("message", "建筑数量已达上限！");
        return console.log(data.err.reson);
      } else if (data.err == 2) {
        AppEmitter.emit("message", "建造资源不足！");
        return console.log(data.err.reson);
      } else {
        for (let i = 0; i < effect.length; i++) {
          if (Number(effect[i][2]) == 0 && DB.data[effect[i][0]][effect[i][1]][effect[i][2]] == 1) {} else {
            DB.data[effect[i][0]][effect[i][1]][effect[i][2]] = data.ok[2][i];
          }
        }

        DB.data.build[id - 1001][1] = data.ok[0];
        DB.data.res[cost_name][1] = data.ok[1]; //更新窗口信息

        Build.com_name.text = `${bcfg[id]["name"]}(${DB.data.build[id - 1001][1]})`;
        Build.com_effect.text = `${bcfg[id]["effect_dis"].replace("{{effect_number}}", bcfg[id]["effect_number"][0])}`;
        Build.com_cost.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]}`;
        AppEmitter.emit("message", `${bcfg[id]["name"]}+1`); //更新商品价格

        for (let i = 0; i < 6; i++) {
          Build.shopGoods[i].text = `${Math.ceil(DB.data.shop.price[id] * DB.data.shop.number[id])}${goods[id][1]}`;
          Build.shopCost[i].text = `${DB.data.shop.number[id]}${goods[id][0]}`;
        }
      }
    });
  }

  remove() {
    Scene.remove(this.node);
  }

  added(node) {
    this.node = this.props.backNode;
    ;
    Build.com_name = this.elements.get("name");
    Build.com_effect = this.elements.get("effect");
    Build.com_cost = this.elements.get("cost");
  }

} //英雄弹窗


class Whero extends Widget {
  constructor(...args) {
    super(...args);
    this.node = void 0;
  }

  setProps(props) {
    super.setProps(props);
    let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
        id = props.id;
    this.cfg.children[1].data.text = `${bcfg[id]["name"]}`;
    this.cfg.children[1].data.style.fill = `${Global.color[bcfg[id]["color"]]}`;
    this.cfg.children[2].data.text = `统帅：${bcfg[id]["command"]}`;
    this.cfg.children[3].data.text = `${Build.army_Cname[bcfg[id]["arms"]]}：${bcfg[id]["number"]}`;
    this.cfg.children[4].data.text = `${bcfg[id]["gold"]}黄金`;
    this.cfg.data.left = props.left;
    this.cfg.on = {
      "tap": {
        "func": "buy",
        "arg": [id]
      }
    };
  }

  buy(id) {
    let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero");
    Connect.request({
      type: "app/hero@buy",
      arg: id
    }, data => {
      if (data.err == 1) {
        AppEmitter.emit("message", "黄金不足！");
        return console.log(data.err.reson);
      } else if (data.err == 2) {
        AppEmitter.emit("message", "将领数量已达上限！");
      } else {
        DB.data.res.gold[1] = data.ok[0];
        DB.data.hero.choose = data.ok[1];
        DB.data.hero.own = data.ok[2];
        Build.heroNode.splice(data.ok[3], 1);
        this.remove();
        AppEmitter.emit("message", `${bcfg[id]["name"]}加入麾下`);
      }
    });
  }

  remove() {
    Scene.remove(this.node);
  }

  added(node) {
    this.node = node;
  }

} //酒馆弹窗


class Whotel extends Widget {
  constructor(...args) {
    super(...args);
    this.node = void 0;
  }

  setProps(props) {
    super.setProps(props);
    let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
        id = 1009,
        bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
        cost = bcfg2[DB.data.build[id - 1001][1] + 1][`a${id}`] * bcfg[id]["cost_number1"],
        cost_name = bcfg[id]["cost_type1"];
    this.cfg.children[1].data.text = `${bcfg[id]["name"]}(${DB.data.build[id - 1001][1]})`;
    this.cfg.children[2].data.text = `${bcfg[id]["effect_dis"].replace("{{effect_number}}", bcfg[id]["effect_number"][0])}`;
    this.cfg.children[3].data.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(cost_name)]}`;
    this.cfg.children[6].data.text = `${DB.data.hotel.price[0]}黄金`;
    this.cfg.children[13].data.text = `${bcfg[id]["dis"]}`;
    Build.cur_buildId = id;
  }

  levelup() {
    let id = Build.cur_buildId,
        bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
        bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
        cost = bcfg2[DB.data.build[id - 1001][1] + 2][`a${id}`] * bcfg[id]["cost_number1"],
        cost_name = bcfg[id]["cost_type1"],
        effect = bcfg[id]["effect_type"];
    Connect.request({
      type: "app/build@levelup",
      arg: id
    }, data => {
      if (data.err == 1) {
        AppEmitter.emit("message", "建筑数量已达上限！");
        return console.log(data.err.reson);
      } else if (data.err == 2) {
        AppEmitter.emit("message", "建造资源不足！");
        return console.log(data.err.reson);
      } else {
        for (let i = 0; i < effect.length; i++) {
          if (Number(effect[i][2]) == 0 && DB.data[effect[i][0]][effect[i][1]][effect[i][2]] == 1) {} else {
            DB.data[effect[i][0]][effect[i][1]][effect[i][2]] = data.ok[2][i];
          }
        }

        DB.data.build[id - 1001][1] = data.ok[0];
        DB.data.res[cost_name][1] = data.ok[1];
        DB.data.map.city[2] = data.ok[4]; //更新窗口信息

        Build.com_name.text = `${bcfg[id]["name"]}(${DB.data.build[id - 1001][1]})`;
        Build.com_effect.text = `${bcfg[id]["effect_dis"].replace("{{effect_number}}", bcfg[id]["effect_number"][0])}`;
        Build.com_cost.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]}`;
        AppEmitter.emit("message", "酒馆+1");
      }
    });
  }

  update() {
    Connect.request({
      type: "app/hero@choose",
      arg: 1
    }, data => {
      if (data.err) {
        AppEmitter.emit("message", "黄金不足！");
        return console.log(data.err.reson);
      } else {
        for (let i = 0; i < 3; i++) {
          if (Build.heroNode[i] != undefined) {
            Scene.remove(Build.heroNode[i]);
          }

          Build.heroNode[i] = Scene.open(`app-ui-hero`, this.node, null, {
            id: data.ok[0][i],
            backNode: this.node,
            left: 90 + i * 230
          });
        }

        DB.data.res.gold[1] = data.ok[1];
        DB.data.hotel.price[0] = data.ok[2];
        Build.hotel_update.text = `刷新：${DB.data.hotel.price[0]}黄金`;
      }
    });
  }

  remove() {
    Scene.remove(this.node);
  }

  added(node) {
    this.node = this.props.backNode;
    ;
    Build.com_name = this.elements.get("name");
    Build.com_effect = this.elements.get("effect");
    Build.com_cost = this.elements.get("cost");
    Build.hotel_update = this.elements.get("update");
  }

} //建筑弹窗


class WcomWindow extends Widget {
  constructor(...args) {
    super(...args);
    this.node = void 0;
  }

  setProps(props) {
    super.setProps(props);
    let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
        id = props.id,
        bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
        cost = bcfg2[DB.data.build[id - 1001][1] + 1][`a${id}`] * bcfg[id]["cost_number1"],
        cost_name = bcfg[id]["cost_type1"],
        cost_name2 = bcfg[id]["cost_type2"],
        effect = bcfg[id]["effect_type"],
        cost2;

    if (cost_name2) {
      cost2 = bcfg2[DB.data.build[id - 1001][1] + 1][`a${id}`] * bcfg[id]["cost_number2"];
    }

    this.cfg.children[1].data.text = `${bcfg[id]["name"]}(${DB.data.build[id - 1001][1]})`;
    this.cfg.children[4].data.text = `${bcfg[id]["effect_dis"].replace("{{effect_number}}", bcfg[id]["effect_number"][0])}`;
    this.cfg.children[7].data.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(cost_name)]}`;
    this.cfg.children[9].data.text = bcfg[id]["dis"];

    if (cost_name2) {
      Build.com_cost.text = `消耗：${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]},${cost2}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type2"])]}`;
    }

    Build.cur_buildId = id;

    if (id == 1015) {
      this.cfg.children[7].data.text = "建造条件";
    }
  }

  levelup() {
    let id = Build.cur_buildId,
        bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
        bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
        cost = bcfg2[DB.data.build[id - 1001][1] + 2][`a${id}`] * bcfg[id]["cost_number1"],
        cost_name = bcfg[id]["cost_type1"],
        cost_name2 = bcfg[id]["cost_type2"],
        effect = bcfg[id]["effect_type"],
        cost2;

    if (cost_name2) {
      cost2 = bcfg2[DB.data.build[id - 1001][1] + 2][`a${id}`] * bcfg[id]["cost_number2"];
    }

    Connect.request({
      type: "app/build@levelup",
      arg: id
    }, data => {
      if (data.err == 1) {
        AppEmitter.emit("message", "建筑数量已达上限！");
        return console.log(data.err.reson);
      } else if (data.err == 2) {
        AppEmitter.emit("message", "建造资源不足！");
        return console.log(data.err.reson);
      } else if (data.err == 3) {
        AppEmitter.emit("message", "果园不足！");
        return console.log(data.err.reson);
      } else {
        for (let i = 0; i < effect.length; i++) {
          if (Number(effect[i][2]) == 0 && DB.data[effect[i][0]][effect[i][1]][effect[i][2]] == 1) {} else {
            DB.data[effect[i][0]][effect[i][1]][effect[i][2]] = data.ok[2][i];
          }
        }

        DB.data.build[id - 1001][1] = data.ok[0];
        DB.data.res[cost_name][1] = data.ok[1];

        if (data.ok[3] != null) {
          DB.data.res[cost_name2][1] = data.ok[3];
        }

        DB.data.map.city[2] = data.ok[4]; //更新窗口信息

        Build.com_name.text = `${bcfg[id]["name"]}(${DB.data.build[id - 1001][1]})`;
        Build.com_effect.text = `效果：${bcfg[id]["effect_dis"].replace("{{effect_number}}", bcfg[id]["effect_number"][0])}`;
        Build.com_cost.text = `消耗：${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]}`;

        if (cost_name2) {
          Build.com_cost.text = `消耗：${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]},${cost2}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type2"])]}`;
        }

        Build.totalNode.text = `${DB.data.map.city[2]}/${DB.data.map.city[0] * 10 + 100}`;
        AppEmitter.emit("message", `${bcfg[id]["name"]}+1`); //山路特殊处理

        if (id == 1015) {
          addNews(`村民偶于山间得良木，献之。（木材+${bcfg[id]["effect_number"][0]}）`);
        }
      }
    });
  }

  remove() {
    Scene.remove(this.node);
  }

  added(node) {
    this.node = this.props.backNode;
    ;
    Build.com_name = this.elements.get("name");
    Build.com_effect = this.elements.get("effect");
    Build.com_cost = this.elements.get("cost");
  }

}
/**
 * @description 打开建筑界面
 */


const open = () => {
  Global.mainFace.node = Scene.open("app-ui-build", Scene.root);
  Global.mainFace.id = 2;
  DB.data.build[8][0] = 1;
  DB.data.build[13][0] = 1;

  for (let i = 0; i < 13; i++) {
    DB.data.build[i][0] = 1;
  } //显示解锁的建筑按钮


  for (let i = 0; i < DB.data.build.length; i++) {
    if (DB.data.build[i][0]) {
      Build.build_sprite = Scene.open("app-ui-buildButton", Global.mainFace.node, null, {
        id: i + 1001
      });
    }
  }

  Build.totalNode.text = `${DB.data.map.city[2]}/${DB.data.map.city[0] * 10 + 100}`;
};
/****************** 立即执行 ******************/
//注册组件


Widget.registW("app-ui-build", WBuild);
Widget.registW("app-ui-combuildWindow", WcomWindow);
Widget.registW("app-ui-buildButton", WbuildButton);
Widget.registW("app-ui-hotel", Whotel);
Widget.registW("app-ui-hero", Whero);
Widget.registW("app-ui-shop", Wshop);
Widget.registW("app-ui-shop_goods", Wgoods); //初始化建筑数据库 [是否解锁，等级]

const initBuild = () => {
  let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
      tempDB = [];

  for (let k in bcfg) {
    tempDB.push([0, 0]);
  }

  DB.init("build", tempDB);
};

DB.init("hotel", {
  date: [0],
  price: [10]
});
DB.init("shop", {
  date: [0],
  price: [0, 0, 0, 0, 0, 0],
  number: [100]
}); //注册页面打开事件

AppEmitter.add("intoBuild", node => {
  open();
});
AppEmitter.add("initDB", node => {
  initBuild();
  emtBuild();
}); //建筑注册监听

const emtBuild = () => {
  for (let i = DB.data.build.length - 1; i >= 0; i--) {
    for (let j = 0; j < 2; j++) {
      DB.emitter.add(`build.${i}.${j}`, ((x, y) => {
        return () => {
          Build.updateBuild(x, y);
        };
      })(i, j));
    }
  }
};