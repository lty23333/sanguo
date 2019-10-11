/****************** 导入 ******************/
import Connect from "../libs/ni/connect";
import CfgMgr from "../libs/ni/cfgmrg";
import { AppEmitter } from './appEmitter';
import { rand } from './global';
import util from "../libs/ni/util";
/**
 * @description 模拟后台测试
 */
//存储

let work_name = ["total", "food", "wood", "sci", "gold"],
    season = [0.5, 0, 0, -0.75],
    five_res = [[0, 0, 0, 0.5], [0, 0.5, 0, 0], [0, 0, 0.5, 0], [-0.25, 0, 0, 0], [0.5, 0, 0, 0]];

const saveDb = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

let DB = {
  res: {
    food: [1, 0, 5000, 0, 0, 0, 0],
    wood: [0, 0, 600, 0, 0, 0, 0],
    sci: [0, 0, 100, 0, 0, 0, 0],
    gold: [1, 600, 600, 0, 0, 0, 0],
    win: [0, 0, 200, 0, 0, 1, 0],
    fail: [0, 0, 200, 0, 0, 1, 0]
  },
  build: [[1, 0]],
  date: {
    unlock: [0, 0],
    day: [0]
  },
  people: {
    total: [0, 0],
    food: [0, 0, 8, 0],
    wood: [0, 0, 1, 0],
    sci: [0, 0, 1, 0],
    gold: [0, 0, 2, 0],
    win: [0, 0, 0, 0],
    fail: [0, 0, 0, 0]
  },
  face: {
    "unlock": [0, 0, 1, 1, 1]
  },
  science: [[1, 0]],
  hero: {
    own: [],
    enemy: [],
    left: [[], [], [], [], [], []],
    choose: [0, 0, 0],
    add: [0, 0, 0, 0],
    p: [80, 15, 4, 0.8, 0.2, 0]
  },
  hotel: {
    date: [0],
    price: [10]
  },
  army: {
    cur: [0],
    total: [0],
    price: [50]
  },
  map: {
    date: [1],
    city: [0, 10000],
    attack: [[]],
    guard: []
  }
};

const initScience = () => {
  let bcfg = CfgMgr.getOne("app/cfg/science.json@science");

  for (let k in bcfg) {
    DB.science.push([0, 0]);
  }
};

const initBuild = () => {
  let bcfg = CfgMgr.getOne("app/cfg/build.json@build");

  for (let k in bcfg) {
    DB.build.push([0, 0]);
  }
};

const initHero = () => {
  let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero");

  for (let i in bcfg) {
    DB.hero.left[bcfg[i]["color"]].push(i);
  }
};

const initDB = () => {
  initScience();
  initBuild();
  initHero();
};

const read_all = (param, callback) => {
  let r = "",
      rs;

  for (let k in DB) {
    rs = localStorage[k];

    if (rs) {
      DB[k] = JSON.parse(rs);
    }

    r = `${r}${r ? "," : ""}"${k}":${rs || JSON.stringify(DB[k])}`;
  }

  callback({
    ok: `{${r}}`
  });
};

Connect.setTest("app/all@read", read_all);
/****************** date ******************/

const update_date = (param, callback) => {
  DB.date.day[0] += 1;
  let day = DB.date.day[0],
      sea = Math.floor(day % 400 / 100);

  if (day % 100 == 1) {
    DB.res.food[4] = season[sea];
  }

  saveDb("date", DB.date);
  saveDb("res", DB.res);
  callback({
    ok: [DB.date.day[0], DB.res.food[4]]
  });
};

Connect.setTest("app/date@update", update_date);
/****************** res ******************/
//自动更新资源数据

const add_res = (param, callback) => {
  let number = DB.res[param][1],
      max = DB.res[param][2],
      res = DB.res[param],
      people = DB.people[param],
      change = (res[3] * (res[4] + 1) + people[1] * people[2] * (1 + people[3]) - res[5] * (1 + res[6])) / 2,
      times = 1;

  if (param < 4) {
    if (DB.res.win[1] > 0) {
      times += 0.5;
    }

    if (DB.res.fail[1] > 0) {
      times += -0.25;
    }

    times += five_res[Math.ceil(DB.date.day[0] / 400) % 5][param];
    change = change * times;
  }

  if (number != max) {
    if (change + number > max) {
      number = max;
    } else {
      if (number + change < 0) {
        number = 0;
      } else {
        number += change;
      }
    }
  }

  DB.res[param][1] = number;
  saveDb("res", DB.res);
  callback({
    ok: DB.res[param][1]
  });
}; //自动增减人口


const change_people = (param, callback) => {
  let people = DB.people.total[0],
      max = DB.people.total[1],
      food = DB.res.food[1],
      change = 0,
      over = -1,
      index = 0;

  if (people < max && food > 0) {
    DB.people.total[0] += 1;
    change = 1;
    over = 0;
    index = 0;
  }

  if (food <= 0 && max > 0) {
    if (DB.people.total[0] > 0) {
      DB.people.total[0] -= 1;
      over = 0;
      index = 0;
    }

    for (let i = 1; i < 5; i++) {
      if (DB.people[work_name[i]][1] > 0 && over < 1) {
        DB.people[work_name[i]][1] -= 1;
        over = i;
        index = 1;
      }
    }

    if (over > -1) {
      change = -1;
    }
  }

  saveDb("people", DB.people);
  callback({
    ok: [over + 1 ? DB.people[work_name[over]][index] : 0, change, over, index]
  });
}; //手动加粮食


const manadd_food = (param, callback) => {
  let number = DB.res.food[1],
      max = DB.res.food[2];

  if (number != max) {
    if (1 + number > max) {
      number = max;
    } else {
      number += 2;
    }
  }

  DB.res.food[1] = number;
  saveDb("res", DB.res);
  callback({
    ok: DB.res.food[1]
  });
};

const eat_food = (param, callback) => {
  DB.res.food[5] = DB.people.total[0] * 6;
  saveDb("res", DB.res);
  callback({
    ok: DB.res.food[5]
  });
};

const eat_gold = (param, callback) => {
  DB.res.gold[5] = DB.army.total[0] * 1;
  saveDb("res", DB.res);
  callback({
    ok: DB.res.gold[5]
  });
};

Connect.setTest("app/res@add", add_res);
Connect.setTest("app/res@manfood", manadd_food);
Connect.setTest("app/people@changepeople", change_people);
Connect.setTest("app/res@eatFood", eat_food);
Connect.setTest("app/res@eatGold", eat_gold);
/****************** build ******************/
//建筑升级

const levelup = (id, callback) => {
  let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
      bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
      cost1 = bcfg2[DB.build[id - 1001][1] + 1][`a${id}`] * bcfg[id]["cost_number1"],
      cost_name1 = bcfg[id]["cost_type1"],
      cost_name2 = bcfg[id]["cost_type2"],
      num1 = DB.res[cost_name1][1],
      effect = bcfg[id]["effect_type"],
      effect_num = bcfg[id]["effect_number"],
      len = effect.length,
      //返回的效果结果
  effect_end = [],
      cost2,
      num2;

  if (cost_name2) {
    cost2 = bcfg2[DB.build[id - 1001][1] + 1][`a${id}`] * bcfg[id]["cost_number2"];
    num2 = DB.res[cost_name2][1];
  }

  if (num1 >= cost1 && (!cost_name2 || num2 >= cost2)) {
    num1 -= cost1;
    DB.build[id - 1001][1] += 1;
    DB.res[cost_name1][1] = num1;

    if (cost_name2) {
      num2 -= cost2;
      DB.res[cost_name2][1] = num2;
    } //判断数据表


    for (let i = 0; i < effect_num.length; i++) {
      DB[effect[i][0]][effect[i][1]][effect[i][2]] += effect_num[i];
      effect_end.push(DB[effect[i][0]][effect[i][1]][effect[i][2]]);
    }

    saveDb("build", DB.build);
    saveDb("res", DB.res);
    callback({
      ok: [DB.build[id - 1001][1], num1, effect_end, cost_name2 ? num2 : null]
    });
  } else {
    callback({
      err: 1
    });
  }
};

Connect.setTest("app/build@levelup", levelup);
/****************** science ******************/
//解锁科技

const unlock = (id, callback) => {
  let bcfg = CfgMgr.getOne("app/cfg/science.json@science"),
      cost = bcfg[id][`cost`],
      effect = bcfg[id]["effect_type"],
      effect_num = bcfg[id]["effect_number"],
      len = effect.length,
      num = DB.res.sci[1],
      //返回的效果结果
  effect_end = [];

  if (DB.res.sci[1] >= cost) {
    num -= cost;
    DB.science[id - 101][1] = 1;
    DB.res.sci[1] = num; //判断数据表

    for (let i = 0; i < effect_num.length; i++) {
      DB[effect[i][0]][effect[i][1]][effect[i][2]] += effect_num[i];
      effect_end.push(DB[effect[i][0]][effect[i][1]][effect[i][2]]);
    }

    saveDb("science", DB.science);
    saveDb("res", DB.res);
    callback({
      ok: [DB.science[id - 101][1], num, effect_end]
    });
  } else {
    callback({
      err: 1
    });
  }
};

Connect.setTest("app/science@unlock", unlock);
/****************** people ******************/
//添加工作人

const people_plus = (id, callback) => {
  let p = DB.people;

  if (p.total[0] - p.food[1] - p.wood[1] - p.sci[1] - p.gold[1] > 0) {
    DB.people[id][1] += 1;
    saveDb("people", DB.people);
  }

  callback({
    ok: [DB.people[id][1]]
  });
}; //减少工作人


const people_minus = (id, callback) => {
  if (DB.people[id][1] > 0) {
    DB.people[id][1] -= 1;
    saveDb("people", DB.people);
  }

  callback({
    ok: [DB.people[id][1]]
  });
};

const people_zero = (id, callback) => {
  DB.people[id][1] = 0;
  saveDb("people", DB.people);
  callback({
    ok: [DB.people[id][1]]
  });
};

Connect.setTest("app/people@people_plus", people_plus);
Connect.setTest("app/people@people_minus", people_minus);
Connect.setTest("app/people@people_zero", people_zero);
/****************** event ******************/

const eventtrigger = (eventId, callback) => {
  let bcfg = CfgMgr.getOne("app/cfg/event.json@event");
  DB[bcfg[eventId].type[0]][bcfg[eventId].type[1]][bcfg[eventId].type[2]] += bcfg[eventId].number;
  callback({
    ok: [DB[bcfg[eventId].type[0]][bcfg[eventId].type[1]][bcfg[eventId].type[2]]]
  });
};

Connect.setTest("app/event@eventtrigger", eventtrigger);
/****************** hero ******************/
//param:（1给钱刷新，2时间刷新）

const hero_choose = (param, callback) => {
  let now = Math.ceil(DB.date.day[0] / 400),
      bcfg = CfgMgr.getOne("app/cfg/hero.json@hero");

  if (DB.hotel.price[0] <= DB.res.gold[1] && param == 1) {
    DB.res.gold[1] -= DB.hotel.price[0];
    DB.hotel.price[0] = 2 * DB.hotel.price[0];
    param = 2;
  }

  if (DB.hotel.date[0] < now && param == 2) {
    DB.hotel.date[0] = now;

    for (let i = 0; i < 3; i++) {
      let num = 0,
          rnd = rand(10000),
          v = 0;

      for (let j = 0; j < 6; j++) {
        num += 100 * DB.hero.p[j];

        if (rnd < num) {
          v = j;
          break;
        }
      }

      let heroId = Math.floor(rand(DB.hero.left[v].length)) - 1;
      DB.hero.choose.push(DB.hero.left[v][heroId]);
      DB.hero.left[v].splice(heroId, 1);

      if (DB.hero.choose[0] && DB.hero.choose.length > 3) {
        let c = bcfg[DB.hero.choose[0]]["color"];
        DB.hero.left[c].push(DB.hero.choose[0]);
      }

      if (DB.hero.choose.length > 3) {
        DB.hero.choose.splice(0, 1);
      }
    }
  }

  saveDb("hero", DB.hero);
  saveDb("hotel", DB.hotel);
  saveDb("res", DB.res);
  callback({
    ok: [DB.hero.choose, DB.res.gold[1], DB.hotel.price[0]]
  });
};

const hero_buy = (id, callback) => {
  let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
      gold = bcfg[id]["gold"],
      choose_id = DB.hero.choose.indexOf(id);

  if (gold <= DB.res.gold[1]) {
    DB.res.gold[1] = DB.res.gold[1] - gold;
    DB.hero.choose.splice(choose_id, 1);
    DB.hero.own.push([id, 0, 0, DB.hero.own.length]);
    saveDb("hero", DB.hero);
    saveDb("res", DB.res);
    callback({
      ok: [DB.res.gold[1], DB.hero.choose, DB.hero.own, choose_id]
    });
  } else {
    callback({
      err: 1
    });
  }
};

Connect.setTest("app/hero@choose", hero_choose);
Connect.setTest("app/hero@buy", hero_buy);
/****************** army ******************/

const army_buy = (id, callback) => {
  let cost = DB.army.price[0];

  if (cost <= DB.res.gold[1]) {
    DB.res.gold[1] = DB.res.gold[1] - cost;
    DB.army.total[0] += 1;
    DB.army.cur[0] += 1;
    saveDb("army", DB.army);
    saveDb("res", DB.res);
    callback({
      ok: [DB.res.gold[1], DB.army.total, DB.army.cur]
    });
  } else {
    callback({
      err: 1
    });
  }
}; //添加军人


const army_plus = (id, callback) => {
  let a = DB.army,
      bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
      max_army = Math.floor(bcfg[DB.hero.own[id][0]]["command"] / 10) + DB.hero.add[0];

  if (a.cur[0] > 0) {
    if (max_army > DB.hero.own[id][1]) {
      DB.hero.own[id][1] += 1;
      a.cur[0] -= 1;
      saveDb("army", DB.army);
      saveDb("hero", DB.hero);
      callback({
        ok: [DB.hero.own[id][1], a.cur[0]]
      });
    } else {
      callback({
        err: 2
      });
    }
  } else {
    callback({
      err: 1
    });
  }
}; //减少军人


const army_minus = (id, callback) => {
  if (DB.hero.own[id][1] > 0) {
    DB.hero.own[id][1] -= 1;
    DB.army.cur[0] += 1;
    saveDb("army", DB.army);
    saveDb("hero", DB.hero);
  }

  callback({
    ok: [DB.hero.own[id][1], DB.army.cur[0]]
  });
};

const army_zero = (id, callback) => {
  DB.army.cur[0] += DB.hero.own[id][1];
  DB.hero.own[id][1] = 0;
  saveDb("army", DB.army);
  saveDb("hero", DB.hero);
  callback({
    ok: [DB.hero.own[id][1], DB.army.cur[0]]
  });
};

Connect.setTest("app/army@army_buy", army_buy);
Connect.setTest("app/army@army_plus", army_plus);
Connect.setTest("app/army@army_minus", army_minus);
Connect.setTest("app/army@army_zero", army_zero);
/****************** map ******************/

const guard_add = (id, callback) => {
  let bcfg = CfgMgr.getOne("app/cfg/city.json@city"),
      bcfg2 = CfgMgr.getOne("app/cfg/city.json@rand"),
      bcfg3 = CfgMgr.getOne("app/cfg/city.json@army"),
      guard,
      guardId; //随机据点

  if (rand(3) > 1) {
    guardId = 20000 + rand(3);
    guard = bcfg3[DB.date.day[0]]["army"]; //城市据点
  } else {
    guardId = DB.map.city[1] + 1;
    DB.map.city[1] += 1;
    guard = bcfg[guardId]["army"];
  }

  guard.splice(0, 0, guardId);
  DB.map.guard.push(guard);
  saveDb("map", DB.map);
  callback({
    ok: [DB.map.guard, guardId]
  });
};

const date_update = (date, callback) => {
  DB.map.date[0] = date;
  saveDb("map", DB.map);
  callback({
    ok: [DB.map.date[0]]
  });
};

Connect.setTest("app/map@guard_add", guard_add);
Connect.setTest("app/map@date_update", date_update);
/****************** fight ******************/
//fighter:[id,num,add+1,位置,兵种]

const fight = (param, callback) => {
  let num = [],
      fighter = param[0],
      group_num = [fighter[0].length, fighter[1].length, fighter[0].length + fighter[1].length],
      oder = [],
      //出手顺序
  dead = [0, 0],
      //死亡数量
  cur = util.copy(fighter),
      //存活的角色
  mess = [],
      //战斗报文
  isvic = 0,
      //是否胜利
  army_dead = [0, 0],
      kill_die = [[0, 0, 0, 0], [0, 0, 0, 0]],
      //我军将领得杀敌与损伤
  enemyType = param[1] > -1 ? DB.map.guard[param[1]] : DB.hero.enemy,
      enemyType1 = param[1] > -1 ? DB.map.guard : DB.hero.enemy;

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < group_num[i]; j++) {
      fighter[i][j][5] = fighter[i][j][1] * fighter[i][j][2];
      cur[i][j][5] = j;
    }
  }

  for (let i = 0; i < group_num[2]; i++) {
    num.push([1, group_num[0] - i > 0 ? 0 : 1, group_num[0] - i > 0 ? i : i - group_num[0]]);
  } //出手顺序确定


  for (let i = 0; i < group_num[2]; i++) {
    let rnd = rand(num.length - 1);
    oder.push(num[rnd]);
    num.splice(rnd, 1);
  }

  while (!(dead[0] == group_num[0]) && !(dead[1] == group_num[1])) {
    for (let i = 0; i < oder.length; i++) {
      if (oder[i][0]) {
        let group = Math.abs(oder[i][1] - 1),
            rnd = cur[group].length - 1,
            enemyId = cur[group][rnd][5],
            damage = fighter[oder[i][1]][oder[i][2]][5] / 4 * (1 + (fighter[oder[i][1]][oder[i][2]][4] - fighter[group][enemyId][4] == 1 ? 0.3 : 0)),
            die = 0; //打死了    

        if (fighter[group][enemyId][1] <= Math.ceil(damage / fighter[group][enemyId][2])) {
          die = fighter[group][enemyId][1];
          fighter[group][enemyId][1] = 0;
          cur[group].splice(rnd, 1);
          dead[group] += 1; //没打死
        } else {
          die = Math.ceil(damage / fighter[group][enemyId][2]);
          fighter[group][enemyId][1] -= die;
        } //战斗报文


        mess.push([fighter[oder[i][1]][oder[i][2]][0], oder[i][1], oder[i][2], fighter[group][enemyId][0], group, enemyId, die]);

        if (oder[i][1]) {
          kill_die[1][enemyId] += die;
        } else {
          kill_die[0][oder[i][2]] += die;
        }

        if (dead[0] == group_num[0] || dead[1] == group_num[1]) {
          break;
        }
      }
    }
  } //判断是否胜利


  if (dead[1] == group_num[1]) {
    isvic = 1;
  } // 军队数量保存


  for (let i = group_num[0] - 1; i >= 0; i--) {
    army_dead[0] += DB.hero.own[fighter[0][i][3]][1] - fighter[0][i][1];
    DB.hero.own[fighter[0][i][3]][1] = fighter[0][i][1];
  }

  if (isvic) {
    if (param[1] > -1) {
      DB.map.guard.splice(param[1], 1);
    } else {
      DB.hero.enemy = [];
    }
  } else {
    for (let i = group_num[1] - 1; i >= 0; i--) {
      army_dead[1] += enemyType[fighter[1][i][3]][1] - fighter[1][i][1];

      if (!fighter[1][i][1]) {
        enemyType.splice([fighter[1][i][3]], 1);
      } else {
        enemyType[fighter[1][i][3]][1] = fighter[1][i][1];
      }
    }
  }

  DB.army.total[0] -= army_dead[0];
  saveDb("hero", DB.hero);
  saveDb("army", DB.army);
  saveDb("map", DB.map);
  callback({
    ok: [isvic, mess, DB.hero.own, enemyType1, DB.army.total[0], kill_die]
  });
};

const fightAccount = (param, callback) => {
  let bcfg = CfgMgr.getOne("app/cfg/city.json@city"),
      effect = bcfg[param.cityId]["effect_type"],
      effect_num = bcfg[param.cityId]["effect_number"],
      effect_end = [];

  if (param.isvic) {
    let win = bcfg[param.cityId]["win"]; //加胜绩

    if (DB.res.fail[1] > win) {
      DB.res.fail[1] -= win;
    } else {
      DB.res.win[1] += win - DB.res.fail[1];
      DB.res.fail[1] = 0;
    }

    if (effect) {
      for (let i = 0; i < effect_num.length; i++) {
        DB[effect[i][0]][effect[i][1]][effect[i][2]] += effect_num[i];
        effect_end.push(DB[effect[i][0]][effect[i][1]][effect[i][2]]);
      }
    }

    saveDb("map", DB.map);
    saveDb("res", DB.res);
    callback({
      ok: [DB.res.fail[1], DB.res.win[1], effect_end]
    });
  } else {
    //加败绩
    let fail = 50;

    if (DB.res.win[1] > fail) {
      DB.res.win[1] -= fail;
    } else {
      DB.res.fail[1] += fail - DB.res.win[1];
      DB.res.win[1] = 0;
    }

    saveDb("res", DB.res);
    callback({
      ok: [DB.res.fail[1], DB.res.win[1]]
    });
  }
};

Connect.setTest("app/fight@fight", fight);
Connect.setTest("app/fight@fightAccount", fightAccount); //注册页面打开事件

AppEmitter.add("initDB", node => {
  initDB();
});