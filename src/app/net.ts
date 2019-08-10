/****************** 导入 ******************/
import Connect from "../libs/ni/connect";
import CfgMgr from "../libs/ni/cfgmrg";
import {table} from "./formula";
import {AppEmitter} from './appEmitter';

/**
 * @description 模拟后台测试
 */

//存储
let work_name  =["total","food","wood","sci","gold"],
    season =[0.5,0,0,-0.75]
const saveDb = (key,data) => {
    localStorage.setItem(key,JSON.stringify(data));
}

let DB ={res:{food:[1,0,5000,0,0,0,0],wood:[0,0,600,0,0,0,0],sci:[0,0,100,0,0,0,0],gold:[0,0,600,0,0,0,0]},
build:[[1,0]],
date:{unlock:[0,0],day:[0]},
people:{total:[0,0],food:[0,0,8,0],wood:[0,0,1,0],sci:[0,0,1,0],gold:[0,0,2,0]},
face:{"unlock":[0,0,1,0,0]},
science:[[1,0]]}

const initScience = () => {
    let bcfg = CfgMgr.getOne("app/cfg/science.json@science")
    for(let k in bcfg){
        DB.science.push([0,0]);
    }   
};

const initBuild = () => {
    let bcfg = CfgMgr.getOne("app/cfg/build.json@build")
    for(let k in bcfg){
        DB.build.push([0,0]);
    }   
};

const initDB = () => {
    initScience();
    initBuild();
}


//权重
class Weight{
    /**
     * @description 初始化权重
     * @param wTable 权重表 [10,2,3,...]
     */
    constructor(wTable){
        let w = [];
        for(let i = 0, len = wTable.length;i < len; i ++){
            w.push(this.all);
            this.all += wTable[i];
            w.push(this.all);
            this.table[i] = w;
            w = [];
        }
    }
    private all = 0
    private table = []
    /**
     * @description 计算权重是否通过
     * @returns index 第几个权重，0开始, 对应 table
     */
    public cacl():number{
        let p = Math.random(),l,r;
        for(let i = 0, len = this.table.length; i < len; i++){
            l = this.table[i][0]/this.all;
            r = this.table[i][1]/this.all;
            if(p >= l && p < r){
                return i;
            }
        }
        return -1;
    }
}
/****************** date ******************/
const update_date = (param: any, callback) => {   
     DB.date.day[0] += 1;
     let day=DB.date.day[0],
         sea = Math.floor((day % 400)/100)
     if(day %100 ==1){
         DB.res.food[4] = season[sea];
     }
     saveDb("date",DB.date);
     saveDb("res",DB.res);
     callback({ok:[DB.date.day[0],DB.res.food[4]]}); 
 }
 Connect.setTest("app/date@update",update_date);

/****************** res ******************/

//读取资源信息
const read_res = (param: any, callback) => {
    let d:any = localStorage.getItem("res");
    if(d){
        d = JSON.parse(d);
        DB.res = d;
    }else{
        d = DB.res;
    }
    callback({ok:d});
}
//自动更新资源数据
const add_res = (param: any, callback) => {
   
    let number = DB.res[param][1],
        max = DB.res[param][2],
        res = DB.res[param],
        people = DB.people[param],
        change =  ((res[3]) * (res[4]+1)+people[1]*people[2]*(1+people[3])-  res[5] *(1+res[6]))/2;
    
     
    if(number!=max){
        if(change+number>max){
            number = max;
        }else{
            if(number+change<0){
                number = 0;
            }else{
                number+= change;
            }
        }
    }
    DB.res[param][1] = number;
    saveDb("res",DB.res);
    callback({ok:DB.res[param][1]}); 
}
//自动增减人口
const change_people = (param: any, callback) => {
    let people = DB.people.total[0],
    max = DB.people.total[1],
    food = DB.res.food[1],
    change = 0,
    over =-1,
    index =0
    if(people<max && food>0){
        DB.people.total[0] += 1 ;
        change = 1;
        over = 0;
        index = 0;
    }
    if(food<=0 && max>0){

        if(DB.people.total[0]>0){
            DB.people.total[0] -=1;
            over =0;
            index =0;
        }
        for(let i=1;i<5;i++){
            if( DB.people[work_name[i]][1]>0 && over<1){
                DB.people[work_name[i]][1] -= 1;
                over =i;
                index =1;
            }
        }
        if(over>-1){change = -1;}
    }
    saveDb("people",DB.people);
    callback({ok:[(over+1)?DB.people[work_name[over]][index]:0,change,over,index]});
}

//手动加粮食
const manadd_food = (param: any, callback) => {
    
     let number = DB.res.food[1],
         max = DB.res.food[2]
      
     if(number!=max){
         if(1+number>max){
             number = max;
         }else{
                 number+= 2;
         }
         
     }
     DB.res.food[1] = number;
     saveDb("res",DB.res);
     callback({ok:DB.res.food[1]}); 
 }
 const eat_food = (param: any, callback) => {
     DB.res.food[5] = DB.people.total[0] *6;
     saveDb("res",DB.res);
     callback({ok:DB.res.food[5]});  

 }


Connect.setTest("app/res@read",read_res);
Connect.setTest("app/res@add",add_res);
Connect.setTest("app/res@manfood",manadd_food);
Connect.setTest("app/people@changepeople",change_people);
Connect.setTest("app/res@eatFood",eat_food);

/****************** build ******************/

let  res_name = ["food","wood","sic","gold"];
//读取玩家信息
const readBuild = (param: any, callback) => {
    let d:any = localStorage.getItem("build");
    if(d){
        d = JSON.parse(d);
        DB.build = d;
    }else{
        d = DB.build;
    }
    callback({ok:d});
}
//建筑升级
const levelup = (id: any, callback) => {
    let  bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
         bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
         cost1 = bcfg2[DB.build[id-1001][1]+1][`a${id}`]*bcfg[id]["cost_number1"],         
         cost_name1 = bcfg[id]["cost_type1"],
         cost_name2 = bcfg[id]["cost_type2"],
         num1 = DB.res[cost_name1][1],
         effect = bcfg[id]["effect_type"],
         effect_num = bcfg[id]["effect_number"],
         len = effect.length,
         //返回的效果结果
         effect_end =[],
         cost2,
         num2
    if(cost_name2){
        cost2 = bcfg2[DB.build[id-1001][1]+1][`a${id}`]*bcfg[id]["cost_number2"];
        num2 = DB.res[cost_name2][1];
    }
         
    if ((num1 >= cost1 )&&(!cost_name2 || num2>=cost2)){
            num1 -= cost1;
            DB.build[id-1001][1] += 1;
            DB.res[cost_name1][1] = num1;
            if(cost_name2){
                num2 -= cost2;
                DB.res[cost_name2][1] = num2;              
            }

            //判断数据表
            for(let i=0;i<effect_num.length;i++){
               DB[effect[i][0]][effect[i][1]][effect[i][2]] += effect_num[i];
               effect_end.push(DB[effect[i][0]][effect[i][1]][effect[i][2]]);
        }                      
         saveDb("build",DB.build);
         saveDb("res",DB.res);
         callback({ok:[DB.build[id-1001][1],num1,effect_end,cost_name2?num2:null]}); 
    }else{
        callback({err:1}); 
    }
          
}

Connect.setTest("app/build@read",readBuild);
Connect.setTest("app/build@levelup",levelup);
/****************** science ******************/

//读取玩家信息
const readScience = (param: any, callback) => {
    let d:any = localStorage.getItem("science");
    if(d){
        d = JSON.parse(d);
        DB.science = d;
    }else{
        d = DB.science;
    }
    callback({ok:d});
}
//解锁科技
const unlock = (id: any, callback) => {
    let  bcfg = CfgMgr.getOne("app/cfg/science.json@science"),
         cost = bcfg[id][`cost`],  
         effect = bcfg[id]["effect_type"],
         effect_num = bcfg[id]["effect_number"],
         len = effect.length,
         num =DB.res.sci[1],
         //返回的效果结果
         effect_end =[]
    
    if (DB.res.sci[1] >= cost ){
            num -= cost;
            DB.science[id-101][1] = 1;
            DB.res.sci[1] = num;
            //判断数据表
            for(let i=0;i<effect_num.length;i++){
               DB[effect[i][0]][effect[i][1]][effect[i][2]] += effect_num[i];
               effect_end.push(DB[effect[i][0]][effect[i][1]][effect[i][2]]);
        }                      
         saveDb("science",DB.science);
         saveDb("res",DB.res);
         callback({ok:[DB.science[id-101][1],num,effect_end]}); 
    }else{
        callback({err:1}); 
    }
          
}

Connect.setTest("app/science@read",readScience);
Connect.setTest("app/science@unlock",unlock);
/****************** people ******************/

//读取玩家信息
const readPeople = (param: any, callback) => {
    let d:any = localStorage.getItem("people");
    if(d){
        d = JSON.parse(d);
        DB.people = d;
    }else{
        d = DB.people;
    }
    callback({ok:d});
}
//添加工作人
const people_plus = (id: any, callback) => { 
    let p = DB.people      
    if (p.total[0]- p.food[1]-p.wood[1] -p.sci[1] - p.gold[1] >0 ){
         DB.people[id][1] += 1;
         saveDb("people",DB.people);
    }               
    callback({ok:[DB.people[id][1]]}); 
}
//减少工作人
const people_minus = (id: any, callback) => {       
    if (DB.people[id][1] >0 ){
         DB.people[id][1] -= 1;
         saveDb("people",DB.people);
    }               
    callback({ok:[DB.people[id][1]]}); 
}
const people_zero = (id: any, callback) => {       
    DB.people[id][1] = 0;
    saveDb("people",DB.people);             
    callback({ok:[DB.people[id][1]]}); 
}

    Connect.setTest("app/people@read",readPeople);
    Connect.setTest("app/people@people_plus",people_plus);
    Connect.setTest("app/people@people_minus",people_minus);
    Connect.setTest("app/people@people_zero",people_zero);
/****************** event ******************/
const eventtrigger = (eventId: any, callback) => {       
    let bcfg = CfgMgr.getOne("app/cfg/event.json@event")

    DB[bcfg[eventId].type[0]][bcfg[eventId].type[1]][bcfg[eventId].type[2]] += bcfg[eventId].number;            
    callback({ok:[DB[bcfg[eventId].type[0]][bcfg[eventId].type[1]][bcfg[eventId].type[2]]]}); 
}

Connect.setTest("app/event@eventtrigger",eventtrigger);
/****************** stage ******************/

let dataStage = {level:1,fightCount:0,lastFightTime:0};
//获取当前关卡怪物属性[attack,hp,attackSpeed,attackDistance,speed]
const findMonster = (type) => {
    let a = ["attack","hp","attackSpeed","attackDistance","speed"],
        cfg = CfgMgr.getOne("app/cfg/pve.json@stage")[dataStage.level],
        scale = cfg[`attr${type+1}`],
        attr = CfgMgr.getOne("app/cfg/pve.json@attribute")[cfg[`level${type+1}`]],
        r = [];
    for(let i = 0, len = a.length; i < len; i++){
        r[i] = scale[i] * attr[a[i]];
    }
    // console.log(cfg,attr);
    return {module:cfg[`id${type+1}`],attr:r};
}

//模拟后台读取接口
const readStage = (param: any,callback: Function) => {
    let d:any = localStorage.getItem("stage");
    if(d){
        d = JSON.parse(d);
        dataStage = d;
    }else{
        d = dataStage;
    }
    callback({ok:d});
}


Connect.setTest("app/stage@read",readStage);


//注册页面打开事件
AppEmitter.add("initDB",(node)=>{
    initDB();
});