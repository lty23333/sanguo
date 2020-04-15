/****************** 导入 ******************/
import Connect from "../libs/ni/connect";
import CfgMgr from "../libs/ni/cfgmrg";
import {table} from "./formula";
import {AppEmitter} from './appEmitter';
import {rand,number1} from './global';
import util from "../libs/ni/util";

/**
 * @description 模拟后台测试
 */

//存储
let work_name  =["total","food","wood","sci","gold"],
    res_name  =["food","wood","sci","gold","win","fail"],
    season =[0.5,0,0,-0.75],
    five_res = [[0,0,0,0.5],[0,0.5,0,0],[0,0,0.5,0],[-0.25,0,0,0],[0.5,0,0,0]]
    
const saveDb = (key,data) => {
    localStorage.setItem(key,JSON.stringify(data));
}

let DB 

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


const initHero = () => {
    let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero")
    for(let i in bcfg ){
        if(parseInt(i) < 1900){
            DB.hero.left[bcfg[i]["color"]].push(i);
        }
    }
}

const initDB = () => {
    let cir
    if(DB && DB.circle && DB.circle.city && DB.circle.city[0]){
        cir = JSON.parse(JSON.stringify(DB.circle))
    }
    DB = undefined
    DB ={res:{food:[1,0,5000,0,0,0,0],wood:[0,0,600,0,0,0,0],sci:[0,0,800,0,0,0,0],gold:[0,0,500,0,0,0,0],win:[0,0,100,0,0,1,0],fail:[0,0,100,0,0,1,0]},
        build:[],
        date:{unlock:[0,0],day:[0],warning:[0,0]},
        people:{total:[0,0],food:[0,0,8,0],wood:[0,0,1,0],sci:[0,0,1,0],gold:[0,0,1,0],win:[0,0,0.25,0],fail:[0,0,0.25,0]},
        face:{"unlock":[0,0,1,0,0]},
        science:[[1,0]],
        hero:{MaxHero:[1,1,0],own:[],enemy:[],left:[[],[],[],[],[],[]],choose:[1212,1208,1200],add:[0,0,0,0]},
        hotel:{date:[0],price:[10]},
        shop:{date:[0],price:[0,0,0,0,0,0],number:[200]},
        army:{cur:[0],total:[0],price:[250,5,1]},
        map:{date:[1],city:[1,10000,0,15,0,100],attack:[0],guard:[]},
        event:{"next":[2001],"date":[0]},
        circle:{coin:[0],own:[],city:[],times:[0],temp:[[0,0,0,0],[0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]}
        }
    if(cir){
        DB.circle = cir
    }
    initScience();
    initBuild();
    initHero();
}



const read_all = (param: any, callback) => {
    let r = "",rs;
    for (let k in DB){
        rs = localStorage[k];
        if(rs){
            DB[k] = JSON.parse(rs);
        }
        r = `${r}${r?",":""}"${k}":${rs||JSON.stringify(DB[k])}`
    }
    callback({ok:`{${r}}`});
}


Connect.setTest("app/all@read",read_all);
/****************** circle ******************/


const putin = (param: any, callback) => {   
//    DB.circle.year[0] = Math.max(Math.ceil(DB.date.day[0]/400),DB.circle.year[0])
    DB.circle.times[0] += 1;
    DB.circle.city.push([DB.map.city[0],DB.circle.times[0]]);
    //纪录排序
    if(DB.circle.city.length >1){
        for(let i =0;i<DB.circle.city.length;i++){
            for(let j =i +1;j<DB.circle.city.length;j++){
                if(DB.circle.city[i][0] < DB.circle.city[j][0]){
                    let t = DB.circle.city[i]
                    DB.circle.city[i] = DB.circle.city[j]
                    DB.circle.city[j] = t
                }
            }
        }
    }
    if(DB.circle.city.length >10){
        DB.circle.city.splice(-1,1);
    }

    DB.circle.coin[0] = DB.circle.city[0][0]
    DB.circle.own = JSON.parse(JSON.stringify(DB.hero.own))
    //时间归零，游戏结束
    DB.date.day[0] = 0
    saveDb("date",DB.date);
    saveDb("circle",DB.circle);
    callback({ok:[JSON.parse(JSON.stringify(DB.circle)),DB.date.day[0]]});
}
//轮回商店兑换物存入初始数据库
const putout = (param: any, callback) => {   
//    DB.circle.year[0] = Math.ceil(DB.date.day[0]/400) >DB.circle.year[0]?Math.ceil(DB.date.day[0]/400):DB.circle.year[0]
    DB.circle.coin[0] = DB.circle.city[0][0]
    let res = [400,50,50,50],
        shopBuild = [1000,1005,1008,1007],
        //返回的效果结果
        effect_end =[]
    for(let i =0;i<4;i++){
        if(DB.circle.temp[0][i]){
            DB.res[work_name[i+1]][0] = 1
            DB.res[work_name[i+1]][1] = DB.circle.temp[0][i] * res[i]
        }
    }
    for(let i =0;i<shopBuild.length;i++){
        if(!effect_end[i]){
            effect_end[i] =[]
        }
        if(DB.circle.temp[1][i]){
            DB.build[shopBuild[i]-1000][0] = 1
            DB.build[shopBuild[i]-1000][1] = DB.circle.temp[1][i]
            //如果解锁了果园，把山路也解锁了
            if(shopBuild[i] == 1000){
                DB.build[14][0] = 1
            }
            if(shopBuild[i] == 1007){
                 DB.face.unlock[3] = 1
            }
            
            let  bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            id = shopBuild[i],
            effect = bcfg[id]["effect_type"],
            effect_num = bcfg[id]["effect_number"]
            //判断数据表
            for(let j=0;j<effect_num.length;j++){
                DB[effect[j][0]][effect[j][1]][effect[j][2]] += effect_num[j] * DB.circle.temp[1][i];
                if(shopBuild[i] == 1007 && DB.circle.temp[1][i] >4){
                    DB[effect[j][0]][effect[j][1]][effect[j][2]] = 5
                }
                effect_end[i].push(DB[effect[j][0]][effect[j][1]][effect[j][2]]);
            }
        }
    }
    let id = 0
    for(let i =0;i<DB.circle.own.length;i++){
        if(DB.circle.temp[2][i]){
            DB.circle.own[i][1] = 0
            DB.circle.own[i][3] = id
            DB.circle.own[i][4] = 0
            DB.hero.own.push(DB.circle.own[i]);
            id += 1;
        }

    }
    if(DB.hero.own[0] && DB.hero.own[0][0]){
        DB.face.unlock[3] = 1
    }
    DB.circle.temp = [[0,0,0,0],[0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]]

    saveDb("res",DB.res);
    saveDb("build",DB.build);
    saveDb("hero",DB.hero);
    saveDb("circle",DB.circle);
    saveDb("face",DB.face);
    callback({ok:[JSON.parse(JSON.stringify(DB.res)),JSON.parse(JSON.stringify(DB.build)),JSON.parse(JSON.stringify(DB.hero.own)),JSON.parse(JSON.stringify(DB.circle)),DB.face.unlock[3],effect_end]});
}

const read = (param: any, callback) => {   
    let rs = localStorage["circle"];
    if(rs){
        DB.circle = JSON.parse(rs);
        callback({ok:JSON.parse(JSON.stringify(DB.circle))});
    }else{
        callback({err:1});
    }

}
const plus = (param: any, callback) => { 
    let costlist = [[1,1,1,1],[1,4,4,15],[3,10,25,50,100]],
        cost 
    if(param[0] == 2){
        let n = 0
        for(let i=0;i<DB.circle.temp[2].length;i++){
            n += DB.circle.temp[2][i]
        }
        cost =  costlist[2][n]
    }else{
        cost = costlist[param[0]][param[1]]
    }   
    if(param[0] == 2 && DB.circle.temp[2][param[1]]){
        callback({err:2});
    }else if(cost>DB.circle.coin[0]){
        callback({err:1});
    }else{
        DB.circle.coin[0] -= cost;
        DB.circle.temp[param[0]][param[1]] += 1;
        saveDb("circle",DB.circle);
        callback({ok:[DB.circle.temp[param[0]][param[1]],DB.circle.coin[0]]});
    }
}
//轮回商店退款
const minus = (param: any, callback) => { 
    let costlist = [[1,1,1,1],[1,4,4,15],[3,10,25,50,100]],
        cost 
    if(param[0] == 2){
        let n = 0
        for(let i=0;i<DB.circle.temp[2].length;i++){
            n += DB.circle.temp[2][i]
        }
        cost =  costlist[2][n-1]
    }else{
        cost = costlist[param[0]][param[1]]
    }   
    if(DB.circle.temp[param[0]][param[1]] == 0){
        callback({err:1});
    }else{
        DB.circle.coin[0] += cost;
        DB.circle.temp[param[0]][param[1]] -= 1;
        saveDb("circle",DB.circle);
        callback({ok:[DB.circle.temp[param[0]][param[1]],DB.circle.coin[0]]});
    }
}



Connect.setTest("app/circle@putin",putin);
Connect.setTest("app/circle@putout",putout);
Connect.setTest("app/circle@read",read);
Connect.setTest("app/circle@plus",plus);
Connect.setTest("app/circle@minus",minus);
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

//自动更新资源数据
const add_res = (param: any, callback) => {
   
    let number = DB.res[param][1],
        max = DB.res[param][2],
        res = DB.res[param],
        people = DB.people[param],
        change =  (res[3]) * (res[4]+1)+people[1]*people[2]*(1+people[3]),
        times = 1,
        index = res_name.indexOf(param) 
        
        
    if(index < 4 ){
        if(DB.res.win[1] >0){
            times += DB.people.win[2];
        }
        if(DB.res.fail[1] >0){
            times += -DB.people.fail[2];
        }
        if(DB.date.unlock[1]){
            times += five_res[Math.floor(DB.date.day[0]/400+ (DB.circle.city[0] && DB.circle.city[0][0] >81?DB.circle.city[0][0]%5:0)) % 5][index]
        }
        change = change * times/2;
    }
    change -=  res[5] *(1+res[6])/2

    if(change+number>max){
        if(number < max){
            number = max;
        }else{
            if(change < 0){
                number += change
            }
        }
    }else{
        if(number+change<0){
            number = 0;
        }else{
            number+= change;
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
    over =-1
    
    if(people<max && food>0){
        DB.people.total[0] += 1 ;
        change = 1;
        over = 0;
    }
    if(food<=0 && max>0){

        if(DB.people.total[0]>0){
            DB.people.total[0] -=1;
            over =0;
        }
        for(let i=1;i<5;i++){
            if( DB.people[work_name[i]][1]>0 && over<1){
                DB.people[work_name[i]][1] -= 1;
                over =i;
            }
        }
        if(over>-1){change = -1;}
    }
    saveDb("people",DB.people);
    callback({ok:[DB.people.total[0],change,over,(over+1)?DB.people[work_name[over]][1]:0]});
}

//手动加粮食
const manadd_food = (param: any, callback) => {
    
     let number = DB.res.food[1],
         max = DB.res.food[2],
         ismax = 0
    

     if(number!=max){
         if(2+number>max){
            ismax = 1
         }else{
                 number+= 2;
         }    
     }
     if(DB.build[0][0] <1){
        DB.build[0][0] += 0.2
        DB.build[14][0] += 0.2
     }
     DB.res.food[1] = number;
     saveDb("res",DB.res);
     saveDb("build",DB.build);
     callback({ok:[DB.res.food[1],DB.build[0][0],DB.build[14][0],ismax]}); 
 }
 const eat_food = (param: any, callback) => {
     DB.res.food[5] = DB.people.total[0] *6;
     saveDb("res",DB.res);
     callback({ok:DB.res.food[5]});  

 }
//  const eat_gold = (param: any, callback) => {
//     DB.res.gold[5] = DB.army.total[0] *1;
//     saveDb("res",DB.res);
//     callback({ok:DB.res.gold[5]});  

// }


Connect.setTest("app/res@add",add_res);
Connect.setTest("app/res@manfood",manadd_food);
Connect.setTest("app/people@changepeople",change_people);
Connect.setTest("app/res@eatFood",eat_food);
// Connect.setTest("app/res@eatGold",eat_gold);
/****************** build ******************/

//建筑升级
const levelup = (id: any, callback) => {

    let  bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
         bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
         cost1 = bcfg2[DB.build[id-1000][1]+1][`a${id}`]*bcfg[id]["cost_number1"],         
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
        cost2 = bcfg2[DB.build[id-1000][1]+1][`a${id}`]*bcfg[id]["cost_number2"];
        num2 = DB.res[cost_name2][1];
    }
         
    if (DB.map.city[2] >= (DB.map.city[0] - DB.map.city[4])*DB.map.city[3]+DB.map.city[5]){
        callback({err:1}); 
    }else if ((num1 >= cost1 )&&(!cost_name2 || num2>=cost2)){
        //山路特殊处理
        if(id == 1014 && DB.build[0][1] <5){
            callback({err:3}); 
            return;
        }
            num1 -= cost1;
            DB.build[id-1000][1] += 1;
            DB.res[cost_name1][1] = num1;
            DB.map.city[2] += 1;
            if(cost_name2){
                num2 -= cost2;
                DB.res[cost_name2][1] = num2;              
            }

            //如果是仓库，额外追加
            if(id == 1005){
                for(let i=0;i<4;i++){
                DB.res[res_name[i]][2] += effect_num[i] * (DB.build[id-1000][1]-1)
                }
            }
            //判断数据表
            for(let i=0;i<effect_num.length;i++){
                if(effect[i][2] == 0 && DB[effect[i][0]][effect[i][1]][effect[i][2]]>=1 && (effect[i][1] == "sci" ||effect[i][1] == "unlock")){
                   //如果是解锁学者和解锁界面，不再更新了
                }else{
                    DB[effect[i][0]][effect[i][1]][effect[i][2]] += effect_num[i];
                }
               effect_end.push(DB[effect[i][0]][effect[i][1]][effect[i][2]]);
            }
            //英雄数量上限有上限
            if(DB.hero.MaxHero[1] > 5){
                DB.hero.MaxHero[1] = 5;
            }
            saveDb("map",DB.map);
            saveDb("build",DB.build);
            saveDb("res",DB.res);
            saveDb("face",DB.face);
            saveDb("hero",DB.hero);
            saveDb("people",DB.people);
            saveDb("shop",DB.shop);
            callback({ok:[DB.build[id-1000][1],num1,effect_end,cost_name2?num2:null,DB.map.city[2]]}); 
    }else{
        callback({err:2}); 
    }
          
}

Connect.setTest("app/build@levelup",levelup);
/****************** science ******************/

//解锁知识
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
        DB.science[id-100][1] = 1;
        DB.res.sci[1] = num;
        //判断数据表
        for(let i=0;i<effect_num.length;i++){
            DB[effect[i][0]][effect[i][1]][effect[i][2]] += effect_num[i];
            effect_end.push(DB[effect[i][0]][effect[i][1]][effect[i][2]]);
        }
        saveDb("build",DB.build);
        saveDb("face",DB.face);                    
        saveDb("science",DB.science);
        saveDb("hero",DB.hero);
        saveDb("map",DB.map);
        saveDb("res",DB.res);
        saveDb("date",DB.date);
        saveDb("army",DB.army);
        callback({ok:[DB.science[id-100][1],num,effect_end]}); 
    }else{
        callback({err:1}); 
    }
          
}

Connect.setTest("app/science@unlock",unlock);
/****************** people ******************/

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

const people_max = (id: any, callback) => {   
    let name =["food","wood","sci","gold"],
        p = DB.people,
        all= p.total[0],
        index = name.indexOf(id)
    for(let i=0;i<4;i++){
        if(i != index){
            all -= p[name[i]][1]
        }    
    }    
    DB.people[id][1] = all;
    saveDb("people",DB.people);             
    callback({ok:[DB.people[id][1]]}); 
}
    Connect.setTest("app/people@people_plus",people_plus);
    Connect.setTest("app/people@people_minus",people_minus);
    Connect.setTest("app/people@people_zero",people_zero);
    Connect.setTest("app/people@people_max",people_max);
/****************** event ******************/
const eventtrigger = (eventId: any, callback) => {       
    let bcfg = CfgMgr.getOne("app/cfg/event.json@event")

    DB.event.next[0] += 1
    saveDb("event",DB.event);
    if(rand(100)/100<bcfg[eventId]["PR"]){
        if(bcfg[eventId]["class"] == 1 ){
            DB.hero.enemy = bcfg[eventId].type;
            DB.date.warning[1] = 0;
            DB.map.attack[0] = 1
            saveDb("map",DB.map);
            saveDb("hero",DB.hero);
            saveDb("date",DB.date);            
            callback({ok:[DB.event.next[0],JSON.parse(JSON.stringify(DB.hero.enemy))]}); 
        }else if(bcfg[eventId]["class"] == 2){
            callback({ok:[DB.event.next[0]]});
        }else{
            if(bcfg[eventId].type[0]){
                DB[bcfg[eventId].type[0]][bcfg[eventId].type[1]][bcfg[eventId].type[2]] += bcfg[eventId].number; 
                saveDb("build",DB.build);
                saveDb("face",DB.face);                    
                saveDb("science",DB.science);
                saveDb("hero",DB.hero);
                saveDb("map",DB.map);
                saveDb("res",DB.res);
                saveDb("date",DB.date)
                saveDb("event",DB.event);
                saveDb("army",DB.army);
                callback({ok:[DB.event.next[0],DB[bcfg[eventId].type[0]][bcfg[eventId].type[1]][bcfg[eventId].type[2]]]});
            }else{
                callback({ok:[DB.event.next[0]]});
            }         
        }
    }else{
        callback({err:DB.event.next[0]});
    }
}
const warning_zero = (param: any, callback) =>{
    DB.date.warning[1] = 0;
    saveDb("date",DB.date);
    callback({ok:[DB.date.warning[1]]});
}

Connect.setTest("app/event@eventtrigger",eventtrigger);
Connect.setTest("app/event@warning_zero",warning_zero);
/****************** hero ******************/
//param:（1给钱刷新，2时间刷新）
const hero_choose = (param: any, callback) => {   
    let now =Math.ceil(DB.date.day[0]/400),
        bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
        bcfgP = CfgMgr.getOne("app/cfg/build.json@p")
    if(DB.hotel.price[0]  <= DB.res.gold[1] && param ==1){
        DB.res.gold[1] -= DB.hotel.price[0];
        DB.hotel.price[0] = 2* DB.hotel.price[0];
        param = 3;
    } 

    if((DB.hotel.date[0] < now && param == 2)|| param ==3){
        DB.hotel.date[0] = now;
        if(param == 2){
            DB.hotel.price[0] = 10;
        }
        for(let i=0;i<3;i++){
            let num = 0,
            rnd = rand(10000),
            v = 0;
            for(let j=0;j<6;j++){
                num += 100*bcfgP[DB.build[7][1]][`color${j}`];
                if( rnd<num){
                    v = j;
                    break;
                }
            }
            //如果该品质将领没有了
            if(DB.hero.left[v].length < 1){
                v -=1;
            }
            let heroId =Math.floor(rand(DB.hero.left[v].length))-1           
            DB.hero.choose.push(DB.hero.left[v][heroId]);
            DB.hero.left[v].splice(heroId,1);
            if (DB.hero.choose[0] && DB.hero.choose.length>3){
                let c = bcfg[DB.hero.choose[0]]["color"]
                DB.hero.left[c].push(DB.hero.choose[0]);
                DB.hero.choose.splice(0,1);
            }
        }         
    }    

    saveDb("hero",DB.hero);
    saveDb("hotel",DB.hotel);
    saveDb("res",DB.res);
    callback({ok:[JSON.parse(JSON.stringify(DB.hero.choose)),DB.res.gold[1],DB.hotel.price[0]]}); 
}
const hero_buy = (id: any, callback) => { 
    let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
        gold = bcfg[id]["gold"],
        choose_id = DB.hero.choose.indexOf(id)

        if(gold<=DB.res.gold[1]){
            if(DB.hero.own.length < DB.hero.MaxHero[1]){
                DB.res.gold[1] = DB.res.gold[1] -gold;
                DB.hero.choose.splice(choose_id,1);
                DB.hero.own.push([id,0,0,DB.hero.own.length,0]);
                saveDb("hero",DB.hero);   
                saveDb("res",DB.res);
                callback({ok:[DB.res.gold[1],JSON.parse(JSON.stringify(DB.hero.choose)),JSON.parse(JSON.stringify(DB.hero.own)),choose_id]});
            }else{
                callback({err:2}); 
            }
        }else{
        callback({err:1}); 
    }

}

const hero_hurt = (id: any, callback) => { 
    let health = [],pd = 0
    for(let i=0;i<DB.hero.own.length;i++){
        if(DB.hero.own[i] && DB.hero.own[i][4]>0){
            DB.hero.own[i][4] -= 0.5;
            pd = 1
        }
    }
    if(pd){
        saveDb("hero",DB.hero);
        callback({ok:[JSON.parse(JSON.stringify(DB.hero.own))]});  
    }else{
        callback({err:1});
    }

}

Connect.setTest("app/hero@hurt",hero_hurt);
Connect.setTest("app/hero@choose",hero_choose);
Connect.setTest("app/hero@buy",hero_buy);
/****************** army ******************/
const army_buy = (id: any, callback) => { 
    if(!DB.army.price[2]){
        DB.army.price.push(1);
    }
    let cost = DB.army.price[0] * DB.army.price[2],
        num 
        if(cost<=DB.res.gold[1]){
            DB.res.gold[1] = DB.res.gold[1] -cost;
            num = Math.ceil(DB.army.price[1] * (400 + rand(200))/500 -0.5)
            DB.army.total[0] += num;
            DB.army.cur[0] +=num;
            saveDb("army",DB.army);     
            saveDb("res",DB.res);
            callback({ok:[DB.res.gold[1],DB.army.total[0],DB.army.cur[0]]});
        }else{
        callback({err:1}); 
    }
}
//添加军人
const army_plus = (id: any, callback) => { 
    let a = DB.army,
        bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
        max_army = bcfg[DB.hero.own[id][0]]["command"] + DB.hero.add[0]

    if (DB.hero.own[id][4] >0 ){
        callback({err:4}); 
    }else if (a.cur[0] >0 ){
        if(max_army > DB.hero.own[id][1]){
            if(DB.hero.MaxHero[2] >= DB.hero.MaxHero[0] && DB.hero.own[id][1] ==0 ){
                callback({err:3}); 
            }else{
                if(DB.hero.own[id][1] ==0){
                    DB.hero.MaxHero[2] +=1;
                }
                DB.hero.own[id][1] += 1;
                a.cur[0] -=1;

                saveDb("army",DB.army); 
                saveDb("hero",DB.hero); 
                callback({ok:[DB.hero.own[id][1],a.cur[0],DB.hero.MaxHero[2]]}); 
            }
        }else{
            callback({err:2}); 
        }
    }else{
        callback({err:1}); 
    }               
}
//减少军人
const army_minus = (id: any, callback) => {       
    if (DB.hero.own[id][1] >0 ){
         DB.hero.own[id][1]  -= 1;
         if(DB.hero.own[id][1] == 0){
            DB.hero.MaxHero[2] -=1;
         }
         DB.army.cur[0] +=1; 
         saveDb("army",DB.army);
         saveDb("hero",DB.hero);

    }               
    callback({ok:[DB.hero.own[id][1],DB.army.cur[0],DB.hero.MaxHero[2]]}); 
}
//删除将军
const hero_delete = (id: any, callback) => {       
    if (DB.hero.own[id] ){
         if( DB.hero.own[id][1]){
            DB.hero.MaxHero[2] -=1;
         }
         DB.army.cur[0] += DB.hero.own[id][1];
         DB.hero.own.splice(id,1);
         for(let i=0;i <DB.hero.own.length;i++){
            if(DB.hero.own[i]){
                DB.hero.own[i][3] = i;
            }
         }
         saveDb("hero",DB.hero);
         saveDb("army",DB.army);
    }               
    callback({ok:[JSON.parse(JSON.stringify(DB.hero.own)),DB.army.cur[0],DB.hero.MaxHero[2]]}); 
}
 const army_zero = (id: any, callback) => {
     if(DB.hero.own[id][1]){
        DB.army.cur[0] += DB.hero.own[id][1]; 
        DB.hero.own[id][1] = 0;
        DB.hero.MaxHero[2] -=1;
        saveDb("army",DB.army);  
        saveDb("hero",DB.hero); 
     }         
     callback({ok:[DB.hero.own[id][1],DB.army.cur[0]]});
 }
//满编
const army_max = (id: any, callback) => {
    let a = DB.army,
        bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
        max_army = bcfg[DB.hero.own[id][0]]["command"] + DB.hero.add[0]
    if (DB.hero.own[id][4] >0 ){
        callback({err:4});
    }else{
        if(a.cur[0] >0){
            if(DB.hero.MaxHero[2] >= DB.hero.MaxHero[0] && DB.hero.own[id][1] ==0 ){
                callback({err:3}); 
            }else{
                if( DB.hero.own[id][1] == 0){
                    DB.hero.MaxHero[2] +=1;
                }
                if(a.cur[0] + DB.hero.own[id][1]> max_army){
                    a.cur[0] -=  max_army - DB.hero.own[id][1];
                    DB.hero.own[id][1] = max_army;
                }else{
                    DB.hero.own[id][1] += a.cur[0];
                    a.cur[0] = 0;
                }
                saveDb("army",DB.army);  
                saveDb("hero",DB.hero);          
                callback({ok:[DB.hero.own[id][1],DB.army.cur[0],DB.hero.MaxHero[2]]})
            }
        }else{
            callback({err:1});  
        }
  
    }
}



    Connect.setTest("app/army@army_buy",army_buy);
    Connect.setTest("app/army@army_plus",army_plus);
    Connect.setTest("app/army@army_minus",army_minus);
    Connect.setTest("app/army@army_zero",army_zero);
    Connect.setTest("app/army@army_max",army_max);
    Connect.setTest("app/army@hero_delete",hero_delete);

/****************** map ******************/
const guard_add = (id: any, callback) => { 
        let bcfg = CfgMgr.getOne("app/cfg/city.json@city"),
            bcfg2 = CfgMgr.getOne("app/cfg/city.json@rand"),
            bcfg3 = CfgMgr.getOne("app/cfg/city.json@army"),
            guard = [],
            guardId
        if(DB.map.guard.length >=3){
            DB.map.date[0] = 999999999
            saveDb("map",DB.map);
            callback({err:1}); 
        }else{
                        //随机据点
            if(rand(3)>1){
                guardId = 20000 +rand(4);
                for(let i=0;i<bcfg3[Math.ceil(DB.date.day[0]/400)]["army"].length;i++){
                guard.push([bcfg2[guardId]["army"],Math.ceil(bcfg3[Math.ceil(DB.date.day[0]/400)]["army"][i] * (450 + rand(100))/500 -0.5)])
                }
            //城市据点
            }else{
                guardId = DB.map.city[1] + 1;
                DB.map.city[1] += 1;
                //判断时间段
                let time = bcfg[guardId]["time"],
                    army = bcfg[guardId]["army"],
                    hero = bcfg[guardId]["hero"],
                    index = 0
                for(let i =0;i<time.length;i++){
                    if(DB.event.date[0]>=time[i]){
                        index += 1; 
                    }else{
                        break;
                    }
                }
                for(let i =0;i<army.length;i++){
                guard.push([hero[index][i],army[i]])
                }
            }    
            guard.splice(0,0,guardId); 
            DB.map.guard.push(guard);
            saveDb("map",DB.map);
            callback({ok:[JSON.parse(JSON.stringify(DB.map.guard)),guardId,DB.map.city[1]]});
        }
}

const date_update = (date: any, callback) => { 

    DB.map.date[0] = date 
    saveDb("map",DB.map);
    callback({ok:[DB.map.date[0]]});
}

    Connect.setTest("app/map@guard_add",guard_add);
    Connect.setTest("app/map@date_update",date_update);

/****************** fight ******************/
//fighter:[id,num,add+1,位置,兵种]
const fight = (param: any, callback) => {
    let num = [],
        fighter = param[0],
        group_num = [fighter[0].length,fighter[1].length,fighter[0].length+fighter[1].length],
        oder = [],      //出手顺序
        dead = [0,0],   //死亡数量
        cur = util.copy(fighter),  //存活的角色
        mess =[],  //战斗报文
        isvic = 0, //是否胜利
        army_dead = [0,0],
        kill_die = [[0,0,0,0],[0,0,0,0]],    //我军将领得杀敌与损伤
        enemyType = param[1] >-1?DB.map.guard[param[1]]:DB.hero.enemy
    for(let i= 0;i<2;i++){
        for(let j= 0;j<group_num[i];j++){
          fighter[i][j][5] = fighter[i][j][1] * fighter[i][j][2] ;
          cur[i][j][5] = j ;
        }
    }
    
    for(let i= 0;i<group_num[2];i++){
        num.push([1,(group_num[0]-i > 0)?0:1,(group_num[0]-i > 0)?i:i-group_num[0]]);
    }
    
    //出手顺序确定
    for(let i= 0;i<group_num[2];i++){
        let rnd = rand(num.length) -1
        oder.push(num[rnd]);
        num.splice(rnd,1);
    }
    
    while( ! (dead[0] == group_num[0]) && !(dead[1] == group_num[1]) ){
        for(let i = 0;i< oder.length;i++){
            if(fighter[oder[i][1]][oder[i][2]][1]){
                let group = Math.abs(oder[i][1]-1),
                    rnd = rand(cur[group].length)-1,
                    enemyId = cur[group][rnd][5],
                    kezhi = fighter[oder[i][1]][oder[i][2]][4]-fighter[group][enemyId][4],
                    damage = fighter[oder[i][1]][oder[i][2]][5] /4 *(1 + ((kezhi ==1 || kezhi == -2)?0.3:0)),
                    die = 0

                //打死了    
                if(fighter[group][enemyId][1] <= Math.ceil(damage/fighter[group][enemyId][2])){
                    die = fighter[group][enemyId][1];
                    fighter[group][enemyId][1] = 0;
                    cur[group].splice(rnd,1);
                    dead[group] += 1;
                    

                //没打死
                }else{
                    die = Math.ceil(damage/fighter[group][enemyId][2]);
                    fighter[group][enemyId][1] -= die
                }
                //战斗报文 [攻武将ID，攻阵营，攻位置，防武将ID，防阵营，防位置，死伤数]
                mess.push([fighter[oder[i][1]][oder[i][2]][0],oder[i][1],oder[i][2],fighter[group][enemyId][0],group,enemyId,die])
                if(oder[i][1]){
                    kill_die[1][enemyId] += die
                }else{
                    kill_die[0][oder[i][2]] += die
                }
                if(  (dead[0] == group_num[0]) || (dead[1] == group_num[1]) ){
                    break;
                }
            }
        }
    }
    //判断是否胜利
    if(dead[1] == group_num[1]){
        isvic = 1;
    }
    // 军队数量保存
    for(let i = group_num[0]-1;i >= 0; i--){
        army_dead[0] += DB.hero.own[fighter[0][i][3]][1] - fighter[0][i][1];
        DB.hero.own[fighter[0][i][3]][1] = fighter[0][i][1];
    }
    if(isvic){
        if(param[1] >-1){
            DB.map.guard.splice(param[1],1)
        }else{
            DB.hero.enemy = []
        }
    }else{
        let t =0
        if(enemyType[0][1] ==undefined){
            t = 1
        }
        for(let i = group_num[1] -1;i >= 0; i--){
            army_dead[1] += enemyType[i+t][1] - fighter[1][i][1];
            if(!fighter[1][i][1]){
                enemyType.splice(i+t,1);
            }else{
                enemyType[i+t][1] = fighter[1][i][1];
            }
        }
    }


    DB.army.total[0] -= army_dead[0]
    saveDb("hero",DB.hero);
    saveDb("army",DB.army);
    saveDb("map",DB.map);
    callback({ok:[isvic,mess,JSON.parse(JSON.stringify(DB.hero.own)),JSON.parse(JSON.stringify(param[1] >-1?DB.map.guard:DB.hero.enemy)),DB.army.total[0],kill_die]});

}

const fightAccount = (param: any, callback) => {
    let bcfg = CfgMgr.getOne("app/cfg/city.json@city")

    if(param.cityId>=20000 && param.cityId<30000){
        bcfg = CfgMgr.getOne("app/cfg/city.json@rand")
    }
    let effect = bcfg[param.cityId]["effect_type"],
        effect_num = bcfg[param.cityId]["effect_number"],
        effect_end =[]

    if(param.isvic){
        let win = bcfg[param.cityId]["win"]
        //加胜绩
        if(DB.res.fail[1]>win){
            DB.res.fail[1] -= win;
        }else{
            if(DB.res.win[1] + win -DB.res.fail[1] <= DB.res.win[2]){
                DB.res.win[1] += win -DB.res.fail[1];
            }else{
                DB.res.win[1] = DB.res.win[2]
            }
            DB.res.fail[1] = 0;
        }
        if(effect){           
            for(let i=0;i<effect_num.length;i++){
                DB[effect[i][0]][effect[i][1]][effect[i][2]] += effect_num[i];
                effect_end.push(DB[effect[i][0]][effect[i][1]][effect[i][2]]);
            }   
        }
        //收复城池
        if(param.cityId == 19999){
            DB.map.city[4] = 0;
            DB.map.attack[0] = 0
        }
        //加武将能力,添加受伤状态
        let a = [900,600,300,200,90,80,70,50,30,0],
            b = [0.01,0.02,0.03,0.06,0.09,0.12,0.2,0.3,0.5,0.8]
        for(let i =0;i<param.heroIndex.length;i++){
            let hero = DB.hero.own[param.heroIndex[i]], 
                bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
                num = bcfg[hero[0]]["number"]
            for(let j =0;j<a.length;j++){
                if (num+hero[2]>a[j]){
                    hero[2] +=b[j]  
                    break;
                }
            }
            if(hero[1] == 0){
                hero[4] = 100
                DB.hero.MaxHero[2] -= 1
            }
        }
        
        
        saveDb("hero",DB.hero);
        saveDb("map",DB.map);
        saveDb("res",DB.res);
        callback({ok:[DB.res.fail[1],DB.res.win[1],effect_end,JSON.parse(JSON.stringify(DB.hero.own)),DB.hero.MaxHero[2],DB.map.city[4]]});
    }else{
        //加败绩
        let fail = 50
        if(DB.res.win[1] > fail){
            DB.res.win[1] -= fail;
        }else{
            DB.res.fail[1] += fail -DB.res.win[1];
            DB.res.win[1] = 0;
        }
        for(let i =0;i<param.heroIndex.length;i++){
            let hero = DB.hero.own[param.heroIndex[i]]
            if(hero[1] == 0){
                hero[4] = 100
                DB.hero.MaxHero[2] -= 1
            }
        }
        if(param.cityId == 19999){
            if( DB.map.city[4] == 0){
                DB.map.city[4] += Math.ceil(DB.map.city[0]/2) 
                DB.map.attack[0] = 0
            }else{
                DB.map.city[4] = DB.map.city[0]
            }
            
        }
        saveDb("map",DB.map);
        saveDb("hero",DB.hero);
        saveDb("res",DB.res);
        callback({ok:[DB.res.fail[1],DB.res.win[1],"no",JSON.parse(JSON.stringify(DB.hero.own)),DB.hero.MaxHero[2],DB.map.city[4]]});
    }


}

const lose = (param: any, callback) => {
    if(DB.map.city[4]){
        callback({err:1});
    }else{
       DB.map.attack[0] = 0
       DB.map.city[4] += Math.ceil(DB.map.city[0]/2) 
       let fail = 50
       if(DB.res.win[1] > fail){
           DB.res.win[1] -= fail;
       }else{
           DB.res.fail[1] += fail -DB.res.win[1];
           DB.res.win[1] = 0;
       }
       saveDb("map",DB.map);
       saveDb("res",DB.res);
       callback({ok:[DB.map.city[4],DB.res.fail[1],DB.res.win[1]]});
    }
}

Connect.setTest("app/fight@fight",fight);
Connect.setTest("app/fight@fightAccount",fightAccount);
Connect.setTest("app/fight@lose",lose);
/****************** shop ******************/
//市场资源价格
const buy = (param: any, callback) => {
    let goods = [["gold","food"],["gold","wood"],["gold","sci"],["food","gold"],["wood","gold"],["sci","gold"]],
        price = [0.125,1,1,8,1,1],
        times = 1.05,
        num = DB.shop.price[param] *DB.shop.number[0],
        n


    n =number1(num)
    //购买某种商品后刷新价格
    if(DB.res[goods[param][0]][1] >=  n){
        if(DB.res[goods[param][1]][1] + DB.shop.number[0] <= DB.res[goods[param][1]][2]){
            DB.res[goods[param][0]][1] -=  n
            DB.res[goods[param][1]][1] +=  DB.shop.number[0]
            if(DB.shop.price[param] <price[param]){
                times = 1.1
            }
            DB.shop.price[param] = DB.shop.price[param] * times
            saveDb("res",DB.res);
            saveDb("shop",DB.shop);
            callback({ok:[DB.res[goods[param][0]][1],DB.res[goods[param][1]][1],DB.shop.price[param]]});
        }else{
            callback({err:2}); 
        }
    }else{
        callback({err:1}); 
    }
}

const updateShop = (param: any, callback) => {
    let discount = rand(6) - 1,
        price = [0.125,1,1,8,1,1]
    

    for(let i = 0;i<=5;i++){
        DB.shop.price[i] = price[i] 
    }
    DB.shop.price[discount] = price[discount] *0.4
    DB.shop.date[0] = Math.ceil(DB.date.day[0]/100) 
    saveDb("shop",DB.shop);
    callback({ok:[discount,DB.shop.price,DB.shop.date[0]]});

}
Connect.setTest("app/shop@buy",buy);
Connect.setTest("app/shop@updateShop",updateShop);


//注册页面打开事件
AppEmitter.add("initDB",(node)=>{
    initDB();
});