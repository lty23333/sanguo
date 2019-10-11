/****************** 导入 ******************/
import Scene from '../libs/ni/scene';
import Frame from '../libs/ni/frame';
import DB from "../libs/ni/db";
import Widget from '../libs/ni/widget';
import CfgMgr from '../libs/ni/cfgmrg';
import { AppEmitter } from './appEmitter';
import Connect from "../libs/ni/connect";
import { Global, rand } from './global';
/****************** 导出 ******************/

export const addNews = news => {
  if (DB.data.news[0].length < 25) {
    DB.data.news[0].unshift(news);
  } else {
    DB.data.news[0].splice(-1, 1);
  }
};
export const addFNews = news => {
  if (DB.data.news[1].length < 25) {
    DB.data.news[1].unshift(news);
  } else {
    DB.data.news[1].splice(-1, 1);
  }
};
/****************** 本地 ******************/

let stageNode, // 关卡渲染节点
startNode, // 开始游戏界面
levelNode, // 等级节点 
levelupNode, //升级消耗节点
buildNode; // 建筑渲染节点

class Stage {
  /**
   * @description 自己
   */
  // static self: Shap
  // //自己的默认移动速度
  //down
  //up
  //shap id
  //建筑节点
  // 通用窗口名字节点
  // 通用窗口效果节点
  // 通用窗口消耗节点
  //日期节点
  //年份节点
  //资源名
  //增加资源的时间间隔
  //新闻节点
  //0-新闻，1-战报
  static initDB() {
    //初始化资源数据库表[[是否解锁，数量,最大值,增加量,增加量系数(季节),减少量，减少量系数],[]]
    DB.init("res", {
      food: [1, 0, 5000, 0, 0, 0, 0],
      wood: [0, 0, 600, 0, 0, 0, 0],
      sci: [0, 0, 100, 0, 0, 0, 0],
      gold: [1, 600, 600, 0, 0, 0, 0],
      win: [0, 0, 200, 0, 0, 1, 0],
      fail: [0, 0, 200, 0, 0, 1, 0]
    });
    DB.init("date", {
      unlock: [0, 0],
      day: [0]
    }); //主界面解锁

    DB.init("face", {
      "unlock": [0, 0, 1, 1, 1]
    });
    DB.init("event", {
      "next": [2001]
    });
    DB.init("news", [[], []]); //新闻
  } //更新消息显示


  static updateMessage(message) {
    let MNode = Scene.open("app-ui-message", Scene.root, null, {
      text: message
    });
    Stage.messageList.push(MNode);
    setTimeout(() => {
      Stage.messageList.splice(Stage.messageList.indexOf(MNode), 1);
      Scene.remove(MNode);
    }, 500);
  }

  static runMessage() {
    for (let i = 0; i < Stage.messageList.length; i++) {
      Stage.messageList[i].x += 2;
      Stage.messageList[i].alpha -= 0.04;
    }
  } //更新消息显示


  static updateNews() {
    let type = Stage.newsFace;
    let len = DB.data.news[type].length;

    if (len < 7) {
      for (let i = 0; i < len; i++) {
        Stage.newsNode[i].text = DB.data.news[type][len - 1 - i];
      }

      for (let i = len; i < 7; i++) {
        Stage.newsNode[i].text = "";
      }
    } else {
      for (let i = 0; i < 7; i++) {
        Stage.newsNode[i].text = DB.data.news[type][6 - i];
      }
    }

    if (type && !len) {
      Stage.newsNode[0].text = "幸无战事,得以休想生息。";
    }
  } //更新资源显示


  static updateRes(res_nameID, idType) {
    let name = Stage.res_name[res_nameID],
        res = DB.data.res[name],
        mun = res[idType],
        people = DB.data.people[name]; //解锁新资源

    if (idType == 0 && DB.data.res[name][0] > 0 && !Stage.resSprite[res_nameID]) {
      Stage.resSprite[res_nameID] = Scene.open("app-ui-res", stageNode, null, {
        id: res_nameID
      });
    } //胜败绩根据其资源数值显示和消失


    if (idType == 1 && res_nameID > 3) {
      if (mun) {
        if (!Stage.resSprite[res_nameID]) {
          Stage.resSprite[res_nameID] = Scene.open("app-ui-res", stageNode, null, {
            id: res_nameID
          });
        }
      } else {
        if (Stage.resSprite[res_nameID]) {
          Scene.remove(Stage.resSprite[res_nameID]);
        }
      }
    }

    if ((idType == 1 || idType == 2 || idType == 4) && Stage.res[name][idType] != undefined) {
      Stage.res[name][idType].text = `${mun.toFixed(1)}`;
    } //增加或减少百分比


    if (idType == 4 && Stage.res[name][idType] != undefined) {
      if (mun > 0) {
        Stage.res[name][idType].text = `+${mun.toFixed(1) * 100}%`;
      } else {
        Stage.res[name][idType].text = `${mun.toFixed(1) * 100}%`;
      }
    }

    if (idType > 2) {
      if (Stage.res[name][7] != undefined) {
        let change = res[3] * (res[4] + 1) + people[1] * people[2] * (1 + people[3]) - res[5] * (1 + res[6]);

        if (change >= 0) {
          Stage.res[name][7].text = `+${change.toFixed(1)}/秒`;
        } else {
          Stage.res[name][7].text = `${change.toFixed(1)}/秒`;
        }
      }
    }
  } //地图添加据点


  static guardAdd() {
    if (DB.data.date.day[0] == DB.data.map.date[0]) {
      let bcfg = CfgMgr.getOne("app/cfg/city.json@city"),
          bcfg1 = CfgMgr.getOne("app/cfg/city.json@rand");
      Connect.request({
        type: "app/map@guard_add",
        arg: {}
      }, data => {
        if (data.err) {
          return console.log(data.err.reson);
        }

        DB.data.map.guard = data.ok[0];

        if (data.ok[0][0][0] < 20000) {
          addNews(`斥候已经侦察好了前往${bcfg[data.ok[0][0][0]]["name"]}的道路。`);
        } else {
          addNews(bcfg1[data.ok[0][0][0]]["dis"]);
        }
      });
    }
  } //事件触发


  static eventTrigger() {
    let date = DB.data.date.day[0];

    if (DB.data.event.next[0]) {
      let eventId = DB.data.event.next[0],
          bcfg = CfgMgr.getOne("app/cfg/event.json@event"),
          eventDate = bcfg[`${eventId}`]["date"],
          news = bcfg[eventId]["dis"];

      if (date == eventDate) {
        DB.data.event.next[0] = eventId + 1;
        Connect.request({
          type: "app/event@eventtrigger",
          arg: eventId
        }, data => {
          if (data.err) {
            return console.log(data.err.reson);
          }

          DB.data[bcfg[eventId].type[0]][bcfg[eventId].type[1]][bcfg[eventId].type[2]] = data.ok[0];

          if (news) {
            news = news.replace("{{number}}", bcfg[eventId]["number"]);
            addNews(news);
          }
        }); //成功触发则立刻查看下一个事件是否可触发

        Stage.eventTrigger();
      }
    } //自动增减人口


    if (date % 2 == 0) {
      Connect.request({
        type: "app/people@changepeople",
        arg: {}
      }, data => {
        if (data.err) {
          return console.log(data.err.reson);
        }

        if (data.ok[1] != 0) {
          DB.data.people[Stage.work_name[data.ok[2]]][data.ok[3]] = data.ok[0];
        }

        if (data[1] == 1) {
          let str = "";
          addNews("一位流民在此定居。（人口+1）");
        }

        if (data[1] == -1) {
          addNews(`${Stage.hungry[rand(Stage.hungry.length) - 1]}（人口-1）`);
        }
      });
    }
  } //资源自动变化


  static ChangeResource(typename) {
    Connect.request({
      type: "app/res@add",
      arg: typename
    }, data => {
      if (data.err) {
        return console.log(data.err.reson);
      }

      DB.data.res[typename][1] = data.ok;
    });
  }

  static run() {
    if (Date.now() > Stage.time) {
      for (let i = Stage.res_name.length - 1; i >= 0; i--) {
        Stage.ChangeResource(Stage.res_name[i]);
      }

      Stage.time += Stage.timeInterval;
    } //处理弹出消息


    Stage.runMessage(); //时间变化

    if (Date.now() > Stage.nextDay) {
      let season;
      Connect.request({
        type: "app/date@update",
        arg: {}
      }, data => {
        if (data.err) {
          return console.log(data.err.reson);
        }

        DB.data.date.day[0] = data.ok[0];

        if (DB.data.res.food[4] != data.ok[1]) {
          DB.data.res.food[4] = data.ok[1];
        }

        season = Stage.season_Cname[Math.floor(DB.data.date.day[0] / 100) % 4];

        if (DB.data.date.unlock[0]) {
          Stage.year.text = `第${Math.ceil(DB.data.date.day[0] / 400)}年`;

          if (DB.data.date.unlock[1]) {
            Stage.year.text = `${Stage.five[Math.ceil(DB.data.date.day[0] / 400) % 5]}第${Math.ceil(DB.data.date.day[0] / 400)}年`;
          }
        }

        Stage.day.text = `${season} ${DB.data.date.day[0] % 100}天`; //新年弹出新闻信息

        if (DB.data.date.day[0] % 400 == 1) {
          addNews(`--------------第${Math.ceil(DB.data.date.day[0] / 400)}年-------------`);
        }
      });
      Stage.nextDay += Stage.dayTime;
    }
  }

}
/**
 * @description  关卡界面组件
 */


Stage.width = 0;
Stage.height = 0;
Stage.svx = -7;
Stage.insertTimer = void 0;
Stage.down = 0;
Stage.up = 0;
Stage.id = 1;
Stage.pause = 1;
Stage.res = {
  food: [],
  wood: [],
  sci: [],
  gold: [],
  win: [],
  fail: [] // 资源节点

};
Stage.build = [[]];
Stage.com_name = void 0;
Stage.com_effect = void 0;
Stage.com_cost = void 0;
Stage.day = void 0;
Stage.year = void 0;
Stage.res_name = ["food", "wood", "sci", "gold", "win", "fail"];
Stage.work_name = ["total", "food", "wood", "sci", "gold"];
Stage.five = ["金", "木", "水", "火", "土"];
Stage.five_res = [[0, 0, 0, 0.5], [0, 0.5, 0, 0], [0, 0, 0.5, 0], [-0.25, 0, 0, 0], [0.5, 0, 0, 0]];
Stage.res_Cname = ["粮食", "木材", "科技", "黄金", "胜绩", "败绩"];
Stage.season_Cname = ["春", "夏", "秋", "冬"];
Stage.face_name = ["sceince", "people", "build", "army", "map"];
Stage.dayTime = 1500;
Stage.nextDay = 0;
Stage.resSprite = [];
Stage.messageList = [];
Stage.hungry = ["仓无粮。", "地荒，无粮。", "大荒。", "饿殍满地。", "大饥，人相食。"];
Stage.time = void 0;
Stage.timeInterval = 500;
Stage.newsNode = [];
Stage.newsFace = 0;

class WBack extends Widget {
  constructor(...args) {
    super(...args);
    this.node = void 0;
  }

  remove() {
    Scene.remove(this.node);
  }

  added(node) {
    this.node = node;
  }

}
/**
 * @description  消息组件
 */


class WMessage extends Widget {
  setProps(props) {
    super.setProps(props);
    this.cfg.data.text = props.text;
  }

}
/**
 * @description  新闻框组件
 */


class WNews extends Widget {
  added(node) {
    for (let i = 1; i < 8; i++) {
      Stage.newsNode[i - 1] = this.elements.get(`text${i}`);
    }
  }

  change(faceID) {
    if (Stage.newsFace != faceID) {
      Stage.newsFace = faceID;
      Stage.updateNews();
    }
  }

}
/**
 * @description  资源显示组件
 */


class WRes extends Widget {
  setProps(props) {
    super.setProps(props);
    let id = props.id,
        name = Stage.res_name[id],
        Cname = Stage.res_Cname[id],
        res = DB.data.res[name],
        people = DB.data.people[name];
    this.cfg.children[0].data.text = `${Cname}:`;
    this.cfg.children[1].data.text = DB.data.res[name][1];
    this.cfg.children[3].data.text = DB.data.res[name][2];
    let change = res[3] * (res[4] + 1) + people[1] * people[2] * (1 + people[3]) - res[5] * (1 + res[6]),
        times = 1; //胜败和五行影响

    if (id < 4) {
      if (DB.data.res.win[1] > 0) {
        times += 0.5;
      }

      if (DB.data.res.fail[1] > 0) {
        times += -0.25;
      }

      times += Stage.five_res[Math.ceil(DB.data.date.day[0] / 400) % 5][id];
      change = change * times;
    }

    if (change >= 0) {
      this.cfg.children[4].data.text = `+${change.toFixed(0)}/秒`;
    } else {
      this.cfg.children[4].data.text = `${change.toFixed(0)}/秒`;
    }

    this.cfg.children[5].data.text = DB.data.res[name][4];
    this.cfg.data.top = Math.min(id * 50 + 30, 230);
  }

  added(node) {
    let name = Stage.res_name[this.props.id];
    Stage.res[name][1] = this.elements.get("number");
    Stage.res[name][2] = this.elements.get("max");
    Stage.res[name][7] = this.elements.get("change");
    Stage.res[name][4] = this.elements.get("addtion");
  }

}
/**
 * @description  关卡界面组件
 */


class WStage extends Widget {
  start() {
    Stage.down = Date.now();
  }

  end() {
    Stage.up = Date.now();
  }

  added(node) {
    Stage.year = this.elements.get("year");
    Stage.day = this.elements.get("day");
  } //切换主界面


  changeFace(faceid) {
    if (faceid != Global.mainFace.id && DB.data.face.unlock[faceid]) {
      Scene.remove(Global.mainFace.node); //

      if (faceid == 0) {
        AppEmitter.emit("intoScience");
      }

      if (faceid == 1) {
        AppEmitter.emit("intoPeople");
      }

      if (faceid == 2) {
        AppEmitter.emit("intoBuild");
      }

      if (faceid == 3) {
        AppEmitter.emit("intoArmy");
      }

      if (faceid == 4) {
        AppEmitter.emit("intoMap");
      }
    }
  }

}
/**
 * @description 开始游戏界面
 */


class WStart extends Widget {
  setProps(props) {
    super.setProps(props);
  } //重新开始


  startGame() {
    Scene.remove(startNode);
    open();
    AppEmitter.emit("intoBuild");
    startNode = null;
    Stage.pause = 0;
    Stage.time = Date.now() + Stage.timeInterval;
    Stage.nextDay = Date.now() + Stage.dayTime;
  } //继续游戏


  continue() {
    Connect.request({
      type: "app/all@read",
      arg: []
    }, data => {
      let d = JSON.parse(data.ok);

      for (let i in d) {
        for (let j in d[i]) {
          if (j == "own" || j == "left" || j == "choose" || j == 'enemy') {
            DB.data.hero[j] = d[i][j];
          } else {
            for (let k in d[i][j]) {
              DB.data[i][j][k] = d[i][j][k];
            }
          }
        }
      }
    });
    Scene.remove(startNode);
    open();
    AppEmitter.emit("intoBuild");
    startNode = null;
    Stage.pause = 0;
    Stage.time = Date.now() + Stage.timeInterval;
    Stage.nextDay = Date.now() + Stage.dayTime;
  }

}
/**
 * @description 打开界面
 */


const open = () => {
  stageNode = Scene.open("app-ui-stage", Scene.root);
  Scene.open("app-ui-news", Scene.root);

  for (let i = 0; i < 6; i++) {
    let name = Stage.res_name[i];

    if (DB.data.res[name][0] > 0) {
      Stage.resSprite[i] = Scene.open("app-ui-res", stageNode, null, {
        id: i
      });
    }
  }

  Stage.updateNews(); // console.log(Stage.width,Stage.height);
};

const openStart = () => {
  startNode = Scene.open("app-ui-start", Scene.root);
};

const pause = () => {
  Stage.pause = 1;
};

const start = () => {
  Stage.pause = 0;
};
/****************** 立即执行 ******************/
//初始化资源数据库表[[是否解锁，数量,最大值,增加量,增加量系数(季节),减少量，减少量系数],[]]


DB.init("res", {
  food: [1, 0, 5000, 0, 0, 0, 0],
  wood: [0, 0, 600, 0, 0, 0, 0],
  sci: [0, 0, 100, 0, 0, 0, 0],
  gold: [1, 600, 600, 0, 0, 0, 0],
  win: [0, 0, 200, 0, 0, 1, 0],
  fail: [0, 0, 200, 0, 0, 1, 0]
});
DB.init("date", {
  unlock: [0, 0],
  day: [0]
}); //主界面解锁

DB.init("face", {
  "unlock": [0, 0, 1, 1, 1]
});
DB.init("event", {
  "next": [2001]
});
DB.init("news", [[], []]); //新闻
//注册组件

Widget.registW("app-ui-stage", WStage);
Widget.registW("app-ui-start", WStart);
Widget.registW("app-ui-back", WBack);
Widget.registW("app-ui-message", WMessage);
Widget.registW("app-ui-res", WRes);
Widget.registW("app-ui-news", WNews); //注册循环

Frame.add(() => {
  if (!Stage.pause) {
    Stage.run();
  }
}); //注册暂停事件

AppEmitter.add("stagePause", node => {
  pause();
}); //注册开始事件

AppEmitter.add("stageStart", node => {
  start();
}); //注册页面打开事件

AppEmitter.add("intoMain", node => {
  openStart();
}); //资源注册监听

for (let i = 0; i < 6; i++) {
  for (let j = 0; j < 7; j++) {
    DB.emitter.add(`res.${Stage.res_name[i]}.${j}`, ((x, y) => {
      return () => {
        Stage.updateRes(x, y);
      };
    })(i, j));
  }
}

DB.emitter.add(`res.gold.1`, () => {
  Stage.updateRes(3, 1);
}); //注册日期监听

DB.emitter.add(`date.day.0`, () => {
  Stage.guardAdd();
  Stage.eventTrigger();
}); //注册工作监听

for (let i = 1; i < 5; i++) {
  for (let j = 1; j < 4; j++) {
    DB.emitter.add(`people.${Stage.res_name[i - 1]}.${j}`, ((x, y) => {
      return () => {
        Stage.updateRes(x, y);
      };
    })(i - 1, 10));
  }
} //注册新闻监听


DB.emitter.add(`news`, () => {
  Stage.updateNews();
}); //注册消息监听

DB.emitter.add(`message`, str => {
  Stage.updateMessage(str);
}); // //重新开始，重置数据库
// AppEmitter.add("initDB",(node)=>{
//     Stage.initDB();
// });