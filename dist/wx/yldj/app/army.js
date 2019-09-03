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

let workNode = [];
let peopleNode = [];

class People {
  static people_sprite = [];
  static work_Cname = ["空闲人口", "农民", "樵夫", "学者", "矿工"];
  static work_name = ["total", "food", "wood", "sci", "gold"];
  static work_top = [0, 250, 50, 150, 350];
  static work_dis = [0, "每个农民+8粮食/秒", "每个樵夫+1木材/秒", "每个学者+1科技/秒", "每个矿工+2黄金/秒"];

  static eatFood() {
    Connect.request({
      type: "app/res@eatFood",
      arg: {}
    }, data => {
      if (data.err) {
        return console.log(data.err.reson);
      }

      DB.data.res.food[5] = data.ok;
    });
  }

  static updatePeople(id) {
    let p = DB.data.people,
        work = 0;

    if (peopleNode[id] != undefined && Global.mainFace.id == 1) {
      if (id == 0) {
        for (let i = 1; i < 5; i++) {
          if (p[People.work_name[i]][0]) {
            work += p[People.work_name[i]][1];
          }
        }

        peopleNode[id].text = `${p.total[id] - work}`;
      } else {
        peopleNode[id].text = `${DB.data.people.total[id]}`;
      }
    }
  }

  static updateWork(id) {
    if (workNode[id] != undefined && Global.mainFace.id == 1) {
      workNode[id].text = `${People.work_Cname[id]}（${DB.data.people[People.work_name[id]][1]}）`;
    }
  }

}
/**
 * @description  添人按钮组件
 */


class WWork extends Widget {
  setProps(props) {
    let id = props.id,
        name = People.work_name[id];
    super.setProps(props);
    this.cfg.children[0].children[0].data.text = `${People.work_Cname[id]}(${DB.data.people[name][1]})`;
    this.cfg.data.top = People.work_top[id];
    this.cfg.children[0].on = {
      "tap": {
        "func": "dis_work",
        "arg": [id]
      }
    };
    this.cfg.children[1].props.on = {
      "tap": {
        "func": "people_plus",
        "arg": [name]
      }
    };
    this.cfg.children[2].props.on = {
      "tap": {
        "func": "people_minus",
        "arg": [name]
      }
    };
    this.cfg.children[3].props.on = {
      "tap": {
        "func": "people_zero",
        "arg": [name]
      }
    };
  }

  dis_work(type) {
    this.backNode = Scene.open(`app-ui-back`, Global.mainFace.node);
    Scene.open(`app-ui-workDis`, this.backNode, null, {
      id: type
    });
  } //加1个人


  people_plus(id) {
    Connect.request({
      type: "app/people@people_plus",
      arg: id
    }, data => {
      if (data.err) {
        return console.log(data.err.reson);
      }

      DB.data.people[id][1] = data.ok[0];
    });
  } //减1个人


  people_minus(id) {
    Connect.request({
      type: "app/people@people_minus",
      arg: id
    }, data => {
      if (data.err) {
        return console.log(data.err.reson);
      }

      DB.data.people[id][1] = data.ok[0];
    });
  } //人数清0


  people_zero(id) {
    Connect.request({
      type: "app/people@people_zero",
      arg: id
    }, data => {
      if (data.err) {
        return console.log(data.err.reson);
      }

      DB.data.people[id][1] = data.ok[0];
    });
  }

  added(node) {
    workNode[node.widget.props.id] = this.elements.get("button_work");
  }

}
/**
 * @description  人口界面组件
 */


class WPeople extends Widget {
  setProps(props) {
    super.setProps(props);
    let work = 0,
        p = DB.data.people;

    for (let i = 1; i < 5; i++) {
      if (p[People.work_name[i]][0]) {
        work += p[People.work_name[i]][1];
      }
    }

    this.cfg.children[1].data.text = `${p.total[0] - work}`;
    this.cfg.children[3].data.text = DB.data.people.total[1];
  }

  added(node) {
    peopleNode[0] = this.elements.get("people_number");
    peopleNode[1] = this.elements.get("people_max");
  }

} //工作介绍弹窗


class WworkDis extends Widget {
  setProps(props) {
    super.setProps(props);
    let id = props.id;
    this.cfg.children[1].data.text = `${People.work_Cname[id]}(${DB.data.people[People.work_name[id]][1]})`;
    this.cfg.children[2].data.text = People.work_dis[id];
  }

}
/**
 * @description 打开人口界面
 */


const open = () => {
  Global.mainFace.node = Scene.open("app-ui-people", Scene.root);
  Global.mainFace.id = 1; //显示解锁的工作按钮

  for (let i = 1; i < 5; i++) {
    if (DB.data.people[People.work_name[i]][0]) {
      People.people_sprite = Scene.open("app-ui-peopleWork", Global.mainFace.node, null, {
        id: i
      });
    }
  }
};
/****************** 立即执行 ******************/
//注册组件


Widget.registW("app-ui-people", WPeople);
Widget.registW("app-ui-peopleWork", WWork);
Widget.registW("app-ui-workDis", WworkDis);
let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
    leftHero = [[], [], [], [], [], []];

for (let i in bcfg) {
  leftHero[bcfg[i]["color"]].push(i);
} //初始化英雄数据库 own：[[武将ID，带兵数量，兵种属性]] add[统帅加成，步兵加成，骑兵加成，弓兵加成]


DB.init("hero", {
  own: [[]],
  left: leftHero,
  choose: [],
  add: [0, 0, 0, 0],
  p: [80, 15, 4, 0.8, 0.2, 0]
});
DB.init("army", {
  cur: 0,
  total: 0
}); //注册人口监听

for (let i = 0; i < 2; i++) {
  DB.emitter.add(`people.total.${i}`, (x => {
    return () => {
      People.updatePeople(x);
    };
  })(i));
} //注册工作监听


for (let i = 1; i < 5; i++) {
  DB.emitter.add(`people.${People.work_name[i]}.1`, (x => {
    return () => {
      People.updatePeople(x);
    };
  })(0));
} //注册工作监听


for (let i = 1; i < 5; i++) {
  DB.emitter.add(`people.${People.work_name[i]}.1`, (x => {
    return () => {
      People.updateWork(x);
    };
  })(i));
}

DB.emitter.add(`people.total.0`, () => {
  People.eatFood();
}); //注册页面打开事件

AppEmitter.add("intoArmy", node => {
  open();
});