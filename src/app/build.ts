/****************** 导入 ******************/
import Scene from '../libs/ni/scene';
import Frame from '../libs/ni/frame';
import DB from "../libs/ni/db";
import Widget from '../libs/ni/widget';
import CfgMgr from '../libs/ni/cfgmrg';
import {AppEmitter} from './appEmitter';
import { AppUtil } from "./util";
import Connect from "../libs/ni/connect";
import Music from '../libs/ni/music';
import {Global,rand,number,number1} from './global';
import {addNews} from './stage';


/****************** 导出 ******************/

/****************** 本地 ******************/


class Build {
    static width = 0
    static height = 0
    static  build =[[],[],[]] //建筑节点
    static  res={food:[],wood:[],sci:[],gold:[]}// 资源节点
    static  com_name // 通用窗口名字节点
    static  com_effect // 通用窗口效果节点
    static  com_cost// 通用窗口消耗节点
    static  hotel_update //酒馆刷新费用节点
    static hotel_dis //酒馆描述节点
    static res_name = ["food","wood","sci","gold"]  //资源名
    static res_Cname = ["粮食","木材","黄金","知识"]
    static army_Cname = ["步兵","骑兵","弓兵"]
    static build_sprite =[]
    static cur_buildId = 0
    static phero = [80,15,4,0.8,0.2,0]
    static heroNode = []
    static goodsNode = []
    static shopGoods = []
    static shopCost = []
    static totalNode 
    static hero_cost = [] //英雄消耗金币节点


    //更新建筑数量
    static updateBuild(id,type){
        if(type ==0){
            if(DB.data.build[id][0] >=1){
                if(Global.mainFace.id ==2){
                  if(id != 2){ //用住房解锁学堂单独处理
                    Build.build_sprite = Scene.open("app-ui-buildButton", Global.mainFace.node,null, {id:id+1000});
                  }
                }else{
                    DB.data.face.new[2] = 1
                }
            }
        }
        if(type ==1 && id != 14){  //排除山路
            let bcfg = CfgMgr.getOne("app/cfg/build.json@build")
            if(bcfg!= undefined && Global.mainFace.id == 2){
                let name = bcfg[`${id+1000}`]["name"]
            
                if(Build.build[id][0] != undefined){
                   Build.build[id][0].text = `${name}(${DB.data.build[id][1]})`
                }    
            }
        }
    }
    //按钮颜色改变
    static updatebutton(type){
        if(Global.mainFace.id ==2){
            for(let i =0;i<DB.data.build.length;i++){
                if(DB.data.build[i][0]>=1){
                    let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
                    id = i+1000,
                    bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
                    cost = bcfg2[DB.data.build[id-1000][1]+1][`a${id}`]*bcfg[id]["cost_number1"],
                    enough = 1,
                    cost_name = bcfg[id]["cost_type1"]

                    if(DB.data.res[cost_name][1]<cost){
                        enough = 0
                    }
                    if(Build.build[i] && Build.build[i][0] && Build.build[i][0].style.fill != Global.color[enough]){
                        Build.build[i][0].style.fill = Global.color[enough];
                    }
                    if(id == Build.cur_buildId && Build.com_cost){
                        if(Build.com_cost.style.fill != Global.color[6-enough*4]){
                            Build.com_cost.style.fill = Global.color[6-enough*4];
                        }
                    }              
                }

                if(type =="food"){
                    break;
                }
            }
        }
    }  
    static updatehotel(){
        if(Global.mainFace.id ==2){
            if(Build.cur_buildId == 1007){
                //刷新消耗更新
                let enough = 2
                if(DB.data.res.gold[1]<DB.data.hotel.price[0]){
                    enough = 6
                }
                if( Build.hotel_update.style.fill != Global.color[enough]){
                    Build.hotel_update.style.fill = Global.color[enough];
                }
                //购买英雄消耗颜色更新
                for(let i=0;i< 3;i++){
                    enough = 2
                    if(Build.hero_cost[i]){
                        if(DB.data.res.gold[1]<parseInt(Build.hero_cost[i].text)){
                            enough = 6
                        }
                        if( Build.hero_cost[i].style.fill != Global.color[enough]){
                            Build.hero_cost[i].style.fill = Global.color[enough];
                        }
                    }
                }
    
            }
        }
    }
    static updateshop(type,n,m){
        if(Global.mainFace.id ==2){
            if(Build.cur_buildId == 1013){
                for(let i=n;i<m;i++){
                    let enough = 2
                    if(DB.data.res[type][1]<parseInt(Build.shopCost[i].text)){
                        enough = 6
                    }
                    if( Build.shopCost[i].style.fill != Global.color[enough]){
                        Build.shopCost[i].style.fill = Global.color[enough];
                    }
                }
            }
        }
    }


}

 


/**
 * @description  建筑按钮组件
 */
class WbuildButton extends Widget{
    backNode:any
    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
            id = props.id,
            name = bcfg[id]["name"],
            cost = bcfg2[DB.data.build[id-1000][1]+1][`a${id}`]*bcfg[id]["cost_number1"],
            color = 0,
            cost_name = bcfg[id]["cost_type1"]

        this.cfg.children[1].data.text = `${bcfg[id]["name"]}(${DB.data.build[id-1000][1]})`
        this.cfg.data.left =  (Scene.screen.width - 600)/4 * (bcfg[id]["left"]+1) +  200*bcfg[id]["left"];
        this.cfg.data.top =  bcfg[id]["top"];
        this.cfg.on = {"tap":{"func":"addBuild","arg":[id]}};

        //消耗加颜色
        if(cost <= DB.data.res[cost_name][1]){
            color += 1
        }
        if(id==1014 && DB.data.build[0][1]<5){
            color = 0
        }
        this.cfg.children[1].data.style.fill = Global.color[color];


    }

    addBuild(type){
        Music.play("audio/but.mp3");
        AppEmitter.emit("stagePause");
        this.backNode = Scene.open(`app-ui-back`,Scene.root);
        //如果是酒馆，则特殊处理
        if(type==1007){
            Connect.request({type:"app/hero@choose",arg:2},(data) => {
                if(data.err){
                    return console.log(data.err.reson);
                }else{
                    let node
                    DB.data.hero.choose = data.ok[0]
                    DB.data.hotel.price[0] = data.ok[2]
                    node =Scene.open(`app-ui-hotel`,this.backNode,null, {id:1007,backNode:this.backNode});
                    for(let i=0;i<data.ok[0].length;i++){
                        Build.heroNode[i] =Scene.open(`app-ui-hero`,node,null, {id:data.ok[0][i],backNode:this.backNode,index:i});
                    }
                }  
            })         
        }else if(type==1013){
            let node
            node = Scene.open(`app-ui-shop`,this.backNode,null, {id:1013});
            for(let i=0;i<6;i++){
                Build.goodsNode[i] =Scene.open(`app-ui-shop_goods`,node,null,{id:i});
            }

        }else{
            Scene.open(`app-ui-combuildWindow`,this.backNode, null, {id:type,backNode:this.backNode});
        }
        
    }

    added(node){   
        Build.build[node.widget.props.id-1000] =[];
        Build.build[node.widget.props.id-1000][0] = this.elements.get("number_name");    
    }
}


/**
 * @description  建筑界面组件
 */
class WBuild extends Widget{
    setProps(props){
        super.setProps(props);
        this.cfg.children[4].data.width = 350 + Scene.screen.width -750
        this.cfg.children[0].data.left = (Scene.screen.width - 3 * 200)/4  -50
    }

    added(node){
        Build.totalNode = this.elements.get("build_number");
    }
    manfood_number(){
        if(DB.data.fore.pause[0] == 0){
            Connect.request({type:"app/res@manfood",arg:{}},(data) => {
                if(data.err){
                    return console.log(data.err.reson);
                }
                DB.data.res.food[1] = data.ok[0];
                DB.data.build[0][0] = data.ok[1];
                DB.data.build[14][0] = data.ok[2];
                if(data.ok[3]){
                    AppEmitter.emit("message","粮食已达上限");
                }else{
                    AppEmitter.emit("message","粮食+2");
                }
                Music.play("audio/manfood.mp3");
            })
        }else{
            AppEmitter.emit("message","暂停时不能采集野果");
        }
    }
}
//市场资源弹窗
class Wgoods extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let goods = [["黄金","粮食"],["黄金","木材"],["黄金","知识"],["粮食","黄金"],["木材","黄金"],["知识","黄金"]],
            goods2= [["gold","food"],["gold","wood"],["gold","sci"],["food","gold"],["wood","gold"],["sci","gold"]],
            id = props.id,
            color = 2,
            cost = number1(DB.data.shop.price[id] *DB.data.shop.number[0])

        
        this.cfg.children[1].data.text = `${number(DB.data.shop.number[0])}${goods[id][1]}`
        this.cfg.children[2].data.text = `${number(cost)}${goods[id][0]}`

        this.cfg.on = {"tap":{"func":"buy","arg":[id]}};
        this.cfg.data.left = 40 + id % 3 *190
        this.cfg.data.top = id<3?140:320
        
        //消耗加颜色
        if(cost > DB.data.res[goods2[id][0]][1]){
            color += 4
        }
        this.cfg.children[2].data.style.fill = Global.color[color];

    }
    buy(id){
        let 
            goods = [["黄金","粮食"],["黄金","木材"],["黄金","知识"],["粮食","黄金"],["木材","黄金"],["知识","黄金"]],
            goods2= [["gold","food"],["gold","wood"],["gold","sci"],["food","gold"],["wood","gold"],["sci","gold"]]
   
            Music.play("audio/but.mp3");
            Connect.request({type:"app/shop@buy",arg:id},(data) => {
                if(data.err == 1){
                    AppEmitter.emit("message",`${goods[id][0]}不足!`);
                    return console.log(data.err.reson);
                }else if(data.err == 2){
                    AppEmitter.emit("message",`${goods[id][1]}已达上限!`);
                    return console.log(data.err.reson);
                }else{
                    DB.data.res[goods2[id][0]][1] = data.ok[0]
                    DB.data.res[goods2[id][1]][1] = data.ok[1]
                    DB.data.shop.price[id] = data.ok[2]
                    Build.shopGoods[id].text = `${number(DB.data.shop.number[0])}${goods[id][1]}`
                    Build.shopCost[id].text = `${number(DB.data.shop.price[id] *DB.data.shop.number[0])}${goods[id][0]}`
                    AppEmitter.emit("message",`已购买${DB.data.shop.number[0]}${goods[id][1]}`);
                    //消耗加颜色
                    if(number1(DB.data.shop.price[id] *DB.data.shop.number[0]) > DB.data.res[goods2[id][0]][1]){
                        Build.shopCost[id].style.fill = Global.color[6];
                    }
                }
            })    
        
    } 
    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = node;
        Build.shopGoods[node.widget.props.id] = this.elements.get("goods");
        Build.shopCost[node.widget.props.id] = this.elements.get("cost");

    }
} 
//市场弹窗
class Wshop extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            id = 1013,
            bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
            cost = bcfg2[DB.data.build[id-1000][1]+1][`a${id}`]*bcfg[id]["cost_number1"],  
            cost_name = bcfg[id]["cost_type1"],
            color = 6 

        this.cfg.data.left = Math.floor(Scene.screen.width - this.cfg.data.width)/2    
        this.cfg.children[1].data.text = `${bcfg[id]["name"]}(${DB.data.build[id-1000][1]})`;
        this.cfg.children[8].data.text = `${bcfg[id]["effect_dis"].replace("{{effect_number}}",bcfg[id]["effect_number"][0])}`;
        this.cfg.children[11].data.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(cost_name)]}`;
        this.cfg.children[13].data.text = `${bcfg[id]["dis"]}`;

        //消耗加颜色
        if(cost <= DB.data.res[cost_name][1]){
            color = 2
        }
        this.cfg.children[11].data.style.fill = Global.color[color];
        Build.cur_buildId = id  
    }
    levelup(){
        let id = Build.cur_buildId,
            bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
            cost = bcfg2[DB.data.build[id-1000][1]+2][`a${id}`]*bcfg[id]["cost_number1"],   
            cost_name = bcfg[id]["cost_type1"],
            goods = [["黄金","粮食"],["黄金","木材"],["黄金","知识"],["粮食","黄金"],["木材","黄金"],["知识","黄金"]],
            effect = bcfg[id]["effect_type"]
   
            Connect.request({type:"app/build@levelup",arg:id},(data) => {
                if(data.err == 1){
                    AppEmitter.emit("message","建筑数量已达上限！");
                    return console.log(data.err.reson);
                }else if(data.err == 2){
                    AppEmitter.emit("message","建造资源不足！");
                    return console.log(data.err.reson);
                }else{
                    for(let i=0;i<effect.length;i++){
                            DB.data[effect[i][0]][effect[i][1]][effect[i][2]] = data.ok[2][i];
                    }   
                    DB.data.build[id-1000][1] = data.ok[0];
                    DB.data.res[cost_name][1] = data.ok[1];
       
                    //更新窗口信息
                    Build.com_name.text = `${bcfg[id]["name"]}(${DB.data.build[id-1000][1]})`;
                    Build.com_effect.text = `${bcfg[id]["effect_dis"].replace("{{effect_number}}",bcfg[id]["effect_number"][0])}`;
                    Build.com_cost.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]}`;
                    let num = DB.data.map.city[2],
                    max = (DB.data.map.city[0] - DB.data.map.city[4])*DB.data.map.city[3]+ DB.data.map.city[5]
                    Build.totalNode.text = `${num}/${max}`
                    if(num >=  max){
                        Build.totalNode.style.fill = Global.color[6]
                    }else{
                        Build.totalNode.style.fill = Global.color[1]
                    }
                    AppEmitter.emit("message",`${bcfg[id]["name"]}+1`);
                    
                    //更新商品价格
                    for(let i=0;i<6;i++){
                        Build.shopGoods[i].text = `${DB.data.shop.number[0]}${goods[i][1]}`
                        Build.shopCost[i].text = `${Math.ceil(DB.data.shop.price[i] *DB.data.shop.number[0])}${goods[i][0]}`
                    }

                }
            })    
        
    } 
    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = this.props.backNode;;
        Build.com_name = this.elements.get("name");
        Build.com_effect = this.elements.get("effect");
        Build.com_cost = this.elements.get("cost");
    }
    no(){}
} 


//英雄弹窗
class Whero extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
            id = props.id,
            color = 6


        this.cfg.children[1].data.text = `${bcfg[id]["name"]}`;
        this.cfg.children[1].data.style.fill = `${Global.color[bcfg[id]["color"]]}`;
        this.cfg.children[2].data.text = `统帅：${bcfg[id]["command"]}`;
        this.cfg.children[3].data.text = `${Build.army_Cname[bcfg[id]["arms"]]}：${bcfg[id]["number"]}`;
        this.cfg.children[4].data.text = `${bcfg[id]["gold"]}黄金`;
        this.cfg.data.left = 15 + props.index *230

        this.cfg.on = {"tap":{"func":"buy","arg":[id]}};

        if(DB.data.res.gold[1] >= bcfg[id]["gold"]){
            color = 2
        }
        this.cfg.children[4].data.style.fill = Global.color[color];
    }
    buy(id){
        let 
            bcfg = CfgMgr.getOne("app/cfg/hero.json@hero")

            Music.play("audio/but.mp3");
            Connect.request({type:"app/hero@buy",arg:id},(data) => {
                if(data.err == 1){
                    AppEmitter.emit("message","黄金不足！");
                    return console.log(data.err.reson);
                }else if(data.err == 2){
                    AppEmitter.emit("message","将领数量已达上限！");
                }else{
                    DB.data.res.gold[1] = data.ok[0]
                    DB.data.hero.choose = data.ok[1];
                    DB.data.hero.own = data.ok[2];
                    Build.heroNode.splice(data.ok[3],1);
                    this.remove();
                    AppEmitter.emit("message",`${bcfg[id]["name"]}加入麾下`);
                    //军队红点
                    DB.data.face.new[3] = 1

                }
            })    
        
    } 
    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = node;
        Build.hero_cost[node.widget.props.id]  = this.elements.get("cost");
    }
} 
//酒馆弹窗
class Whotel extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            id = 1007,
            bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
            cost = bcfg2[DB.data.build[id-1000][1]+1][`a${id}`]*bcfg[id]["cost_number1"],  
            cost_name = bcfg[id]["cost_type1"],
            color =6,
            st =DB.data.build[id-1000][1] >3?"":"将领上限+1；"
        this.cfg.data.left = Math.floor(Scene.screen.width - this.cfg.data.width)/2
        this.cfg.children[1].data.text = `${bcfg[id]["name"]}(${DB.data.build[id-1000][1]})`;
        this.cfg.children[2].data.text = `${st}${bcfg[id]["effect_dis"].replace("{{effect_number}}",bcfg[id]["effect_number"][0])}`;
        this.cfg.children[3].data.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(cost_name)]}`;
        this.cfg.children[6].data.text = `${DB.data.hotel.price[0]}黄金`;

        this.cfg.children[13].data.text = `${bcfg[id]["dis"]}`;

        //消耗加颜色
        if(cost <= DB.data.res[cost_name][1]){
            color = 2
        }
        this.cfg.children[3].data.style.fill = Global.color[color];
        //刷新加颜色
        color = 6
        if(DB.data.res.gold[1] >= DB.data.hotel.price[0]){
            color = 2
        }
        this.cfg.children[6].data.style.fill = Global.color[color];

        Build.cur_buildId = id
       
    }
    levelup(){
        let id = Build.cur_buildId,
            bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
            cost = bcfg2[DB.data.build[id-1000][1]+2][`a${id}`]*bcfg[id]["cost_number1"],   
            cost_name = bcfg[id]["cost_type1"],
            effect = bcfg[id]["effect_type"]
   
            Connect.request({type:"app/build@levelup",arg:id},(data) => {
                if(data.err == 1){
                    AppEmitter.emit("message","建筑数已满，请出征占领新的城市！");
                    return console.log(data.err.reson);
                }else if(data.err == 2){
                    AppEmitter.emit("message","建造资源不足！");
                    return console.log(data.err.reson);
                }else{
                    for(let i=0;i<effect.length;i++){
                        if (Number(effect[i][2]) == 0 && DB.data[effect[i][0]][effect[i][1]][effect[i][2]] == 1){
    
                        }else{
                            DB.data[effect[i][0]][effect[i][1]][effect[i][2]] = data.ok[2][i];
                        }
                    }
                    //英雄数量上限有上限
                    if(DB.data.hero.MaxHero[1] > 5){
                        DB.data.hero.MaxHero[1] = 5;
                    }   
                    DB.data.build[id-1000][1] = data.ok[0];
                    DB.data.res[cost_name][1] = data.ok[1];
                    DB.data.map.city[2] = data.ok[4];
       
                    //更新窗口信息
                    Build.com_name.text = `${bcfg[id]["name"]}(${DB.data.build[id-1000][1]})`;
                    Build.com_effect.text = `${bcfg[id]["effect_dis"].replace("{{effect_number}}",bcfg[id]["effect_number"][0])}`;
                    Build.com_cost.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]}`;
                    if(DB.data.build[id-1000][1] >3){
                        Build.hotel_dis = `${bcfg[id]["dis"]}`
                    }
                    let num = DB.data.map.city[2],
                    max = (DB.data.map.city[0] - DB.data.map.city[4])*DB.data.map.city[3]+DB.data.map.city[5]
                    Build.totalNode.text = `${num}/${max}`
                    if(num >=  max){
                        Build.totalNode.style.fill = Global.color[6]
                    }else{
                        Build.totalNode.style.fill = Global.color[1]
                    }
                    AppEmitter.emit("message","酒馆+1");
                }
            })    
        
    } 
    update(){
        
        Connect.request({type:"app/hero@choose",arg:1},(data) => {
            if(data.err){
                AppEmitter.emit("message","黄金不足！");
                return console.log(data.err.reson);
            }else{
                DB.data.res.gold[1] = data.ok[1];
                for(let i=0;i<3;i++){
                    if(Build.heroNode[i]!= undefined){
                        Scene.remove(Build.heroNode[i]);
                    }
                    Build.heroNode[i] = Scene.open(`app-ui-hero`,this.node,null, {id:data.ok[0][i],backNode:this.node,index:i});
                }
                DB.data.hotel.price[0] = data.ok[2];
                Build.hotel_update.text = `${DB.data.hotel.price[0]}黄金`;
                //颜色刷新
                let color = 6
                if(DB.data.res.gold[1] >= DB.data.hotel.price[0]){
                    color = 2
                }
                Build.hotel_update.style.fill = Global.color[color];
        
            }
        }) 
    }
    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = node;
        Build.com_name = this.elements.get("name");
        Build.com_effect = this.elements.get("effect");
        Build.com_cost = this.elements.get("cost");
        Build.hotel_update = this.elements.get("update");
        Build.hotel_dis = this.elements.get("effect");
    }
    no(){}
} 
//建筑弹窗
class WcomWindow extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            id = props.id,
            bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
            cost = bcfg2[DB.data.build[id-1000][1]+1][`a${id}`]*bcfg[id]["cost_number1"],  
            cost_name = bcfg[id]["cost_type1"],
            cost_name2 = bcfg[id]["cost_type2"],
            cost2,
            color = 6
        if(cost_name2){
           cost2 = bcfg2[DB.data.build[id-1000][1]+1][`a${id}`]*bcfg[id]["cost_number2"];
        } 

        this.cfg.data.left = Math.floor(Scene.screen.width - this.cfg.data.width)/2
        this.cfg.children[1].data.text = `${bcfg[id]["name"]}(${DB.data.build[id-1000][1]})`;
        this.cfg.children[4].data.text = `${bcfg[id]["effect_dis"].replace("{{effect_number}}",bcfg[id]["effect_number"][0])}`;
        this.cfg.children[7].data.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(cost_name)]}`;
        this.cfg.children[9].data.text = bcfg[id]["dis"];
        if(cost_name2){
            Build.com_cost.text = `消耗：${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]},${cost2}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type2"])]}`;
        } 
        Build.cur_buildId = id

        //消耗加颜色
        if(cost <= DB.data.res[cost_name][1]){
            color = 2
        }
        this.cfg.children[7].data.style.fill = Global.color[color];
        if(id == 1014){
            this.cfg.children[6].data.text = "建造条件";
            this.cfg.children[7].data.text = "建造5座果园";
            if(DB.data.build[0][1]<5){
                this.cfg.children[7].data.style.fill = Global.color[6];

            }
        }

       
    }
    levelup(){
        let id = Build.cur_buildId,
            bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
            cost = bcfg2[DB.data.build[id-1000][1]+2][`a${id}`]*bcfg[id]["cost_number1"],   
            cost_name = bcfg[id]["cost_type1"],
            cost_name2 = bcfg[id]["cost_type2"],
            effect = bcfg[id]["effect_type"],
            cost2
        if(cost_name2){
           cost2 = bcfg2[DB.data.build[id-1000][1]+2][`a${id}`]*bcfg[id]["cost_number2"];
        }
            Connect.request({type:"app/build@levelup",arg:id},(data) => {
                if(data.err == 1){
                    AppEmitter.emit("message","建筑数量已达上限！");
                    return console.log(data.err.reson);
                }else if(data.err == 2){
                    AppEmitter.emit("message","建造资源不足！");
                    return console.log(data.err.reson);
                }else if(data.err == 3){  
                    AppEmitter.emit("message","果园不足！");
                    return console.log(data.err.reson);  
                }else{
                    for(let i=0;i<effect.length;i++){
                            DB.data[effect[i][0]][effect[i][1]][effect[i][2]] = data.ok[2][i];
                    }   
                    DB.data.build[id-1000][1] = data.ok[0];
                    DB.data.res[cost_name][1] = data.ok[1];
                    if(data.ok[3]!=null){
                        DB.data.res[cost_name2][1] = data.ok[3];
                    }
                    DB.data.map.city[2] = data.ok[4];
                    //更新窗口信息
                    Build.com_name.text = `${bcfg[id]["name"]}(${DB.data.build[id-1000][1]})`;
                    Build.com_effect.text = `${bcfg[id]["effect_dis"].replace("{{effect_number}}",bcfg[id]["effect_number"][0])}`;
                    Build.com_cost.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]}`;
                    //消耗的颜色
                    if(cost>DB.data.res[`${bcfg[id]["cost_type1"]}`][1]){
                        Build.com_cost.style.fill = Global.color[6]
                    }else{
                        Build.com_cost.style.fill = Global.color[2]
                    }

                    if(cost_name2){
                        Build.com_cost.text = `${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]},${cost2}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type2"])]}`;
                    }
                    let num = DB.data.map.city[2],
                    max = (DB.data.map.city[0] - DB.data.map.city[4])*DB.data.map.city[3]+DB.data.map.city[5]
                    Build.totalNode.text = `${num}/${max}`
                    if(num >=  max){
                        Build.totalNode.style.fill = Global.color[6]
                    }else{
                        Build.totalNode.style.fill = Global.color[1]
                    }
                    AppEmitter.emit("message",`${bcfg[id]["name"]}+1`);

                    //山路特殊处理
                    if(id == 1014){
                        addNews(`2村民偶得良木于山间，献之。（木材+${bcfg[id]["effect_number"][3]}）`);
                        Scene.remove(this.node);
                        AppEmitter.emit("stageStart");  
                    }
                    if(id == 1000 && DB.data.build[0][1] == 5){
                        Build.build[14][0].style.fill = Global.color[1];
                    }
                    if(id == 1001){
                        addNews("一位流民在此定居。（空闲人口+1）")
                    }
                }
            })    
        
    } 
    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = this.props.backNode;;
        Build.com_name = this.elements.get("name");
        Build.com_effect = this.elements.get("effect");
        Build.com_cost = this.elements.get("cost");
    }
    no(){}
} 

/**
 * @description 打开建筑界面
 */
const open = () => {
    Global.mainFace.node = Scene.open("app-ui-build", Scene.root);
    Global.mainFace.id = 2;

    //显示解锁的建筑按钮
    for(let i=0; i<DB.data.build.length;i++ ){
        if(DB.data.build[i][0]){
            Build.build_sprite = Scene.open("app-ui-buildButton", Global.mainFace.node,null, {id:i+1000});
        }
    }
    //DB.data.build[13][0] = 1;
    let num = DB.data.map.city[2],
        max = (DB.data.map.city[0] - DB.data.map.city[4])*DB.data.map.city[3]+DB.data.map.city[5]
    Build.totalNode.text = `${num}/${max}`
    if(num >=  max){
        Build.totalNode.style.fill = Global.color[6]
    }else{
        Build.totalNode.style.fill = Global.color[1]
    }
}



/****************** 立即执行 ******************/
//注册组件
Widget.registW("app-ui-build",WBuild);
Widget.registW("app-ui-combuildWindow",WcomWindow);
Widget.registW("app-ui-buildButton",WbuildButton);
Widget.registW("app-ui-hotel",Whotel);
Widget.registW("app-ui-hero",Whero);
Widget.registW("app-ui-shop",Wshop);
Widget.registW("app-ui-shop_goods",Wgoods);


//初始化建筑数据库 [是否解锁，等级]

const initBuild = () => {
    let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
    tempDB = []
    for(let k in bcfg){
        tempDB.push([0,0]);
    }
    DB.init("build", tempDB);
    DB.init("hotel",{date:[0],price:[10]});
    DB.init("shop",{date:[0],price:[0.125,1,1,8,1,1],number:[200]})
};

//注册页面打开事件
AppEmitter.add("intoBuild",(node)=>{
    open();
});
AppEmitter.add("initDB",(node)=>{
    initBuild();
    emtBuild();
});
//建筑注册监听
const emtBuild = () => {
    for(let i = DB.data.build.length - 1; i >= 0; i--){
        for(let j =0;j<2;j++){
            DB.emitter.add(`build.${i}.${j}`, ((x,y) => {
                return ()=>{
                    Build.updateBuild(x,y)
                }
            })(i,j));
        }
    } 
}  

//注册消耗木材监听
DB.emitter.add(`res.wood.1`, () => {
    Build.updatebutton("wood")
    Build.updateshop("wood",4,5)
});

//注册消耗食物监听
DB.emitter.add(`res.food.1`, () => {
    Build.updatebutton("food")
    Build.updateshop("food",3,4)
});

//注册消耗黄金监听
DB.emitter.add(`res.gold.1`, () => {
    Build.updateshop("gold",0,3)
    Build.updatehotel()
});

//注册消耗知识监听
DB.emitter.add(`res.sci.1`, () => {
    Build.updateshop("sci",5,6)
    Build.updatehotel()
});

