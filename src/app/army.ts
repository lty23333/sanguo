/****************** 导入 ******************/
import Scene from '../libs/ni/scene';
import Frame from '../libs/ni/frame';
import DB from "../libs/ni/db";
import Widget from '../libs/ni/widget';
import CfgMgr from '../libs/ni/cfgmrg';
import {AppEmitter} from './appEmitter';
import { AppUtil } from "./util";
import Connect from "../libs/ni/connect";
import {Global} from './global';
import {addNews} from './stage';
import Music from '../libs/ni/music';

/****************** 导出 ******************/

/****************** 本地 ******************/
let heroNode = [];
let armyNode = [];
let hurtNode = []

    


class Army {
    
    static arms_Cname =["步兵","骑兵","弓兵"]
    static hero_top =[30,160,260,360,460,560]

    static initDB(){
        //初始化英雄数据库 own：[[武将ID，带兵数量，后天成长属性,位置ID,受伤]] add[统帅加成，步兵加成，骑兵加成，弓兵加成]MaxHero:[能上阵将领数量,最大招募将领数量,已带兵将领数量]
        DB.init("hero",{MaxHero:[1,1,0],own:[],enemy:[],left:leftHero,choose:[1212,1208,1200],add:[0,0,0,0]});
        DB.init("army",{cur:[0],total:[0],price:[250,5,1],max:[1000]}); //price:[价格,数量]
    }
    
    // static eatGold(){
    //     Connect.request({type:"app/res@eatGold",arg:{}},(data) => {
    //         if(data.err){
    //             return console.log(data.err.reson);
    //         }
    //         DB.data.res.gold[5] = data.ok;
    //     })
    // }
    static updateArmy(){
        if(armyNode[0]!= undefined && Global.mainFace.id == 3){
          armyNode[0].text = `${DB.data.army.cur[0]}/${DB.data.army.max[0]}`;
        }
    }
    static updateHero(){
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero")
        if(Global.mainFace.id == 3){
            for(let i=0;i<DB.data.hero.own.length;i++){
                let id = DB.data.hero.own[i][0]
                if(heroNode[i]!= undefined){
                    heroNode[i].text = `${bcfg[DB.data.hero.own[i][0]]["name"]}`
                    heroNode[i].style.fill = Global.color[bcfg[id]["color"]]
                    if(DB.data.hero.own[i][4]>0){
                        hurtNode[i].text = `(伤${100-DB.data.hero.own[i][4]}%)`
                        hurtNode[i].style.fill = Global.color[6]
                    }else{
                        hurtNode[i].text = `(${DB.data.hero.own[i][1]}/${bcfg[id]["command"] + DB.data.hero.add[0]})`
                        hurtNode[i].style.fill = Global.color[1]
                    }
                }
            }
        }
    }
    static updatecost(){
        if(Global.mainFace.id == 3){
            let enough = 2
            if(DB.data.res.gold[1]<parseInt(armyNode[2].text)){
                enough = 6
            }
            if( armyNode[2].style.fill != Global.color[enough]){
                armyNode[2].style.fill = Global.color[enough];
            }
        }
    }
    static updatePrice(){
        if(Global.mainFace.id == 3){
          armyNode[2].text = `${Math.ceil(DB.data.army.price[0] * DB.data.army.price[2] -0.5)}黄金`
        }
    }
        
}
/**
 * @description  添人按钮组件
 */
class WHero extends Widget{
    backNode :any
    setProps(props){
        let i = props.id,
            id = DB.data.hero.own[i][0],
            bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
            max = bcfg[id]["command"] + DB.data.hero.add[0],
            name = bcfg[id]["name"];

        super.setProps(props);
        //适配
        let n = Math.floor((Scene.screen.width - 230 - 4 * 90 - 60)/6)
        
        this.cfg.children[1].props.left = 200 + n +45
        this.cfg.children[2].props.left = 200 + 2*n +45 + 90
        this.cfg.children[3].props.left = 200 + 3*n +45 + 180
        this.cfg.children[4].props.left = 200 + 4*n +45 + 270
        this.cfg.children[5].data.left = 200 + 5*n + 360

        this.cfg.children[0].children[0].data.text = `${name}`;
        this.cfg.children[0].children[0].data.style.fill = Global.color[bcfg[id]["color"]]
        this.cfg.data.top =  Army.hero_top[i+1] +330;
        this.cfg.children[0].on = {"tap":{"func":"dis_hero","arg":[i]}};
        this.cfg.children[1].props.on = {"tap":{"func":"army_plus","arg":[DB.data.hero.own[i][3]]}};
        this.cfg.children[2].props.on = {"tap":{"func":"army_minus","arg":[DB.data.hero.own[i][3]]}};
        this.cfg.children[3].props.on = {"tap":{"func":"army_max","arg":[DB.data.hero.own[i][3]]}};
        this.cfg.children[4].props.on = {"tap":{"func":"army_zero","arg":[DB.data.hero.own[i][3]]}};
        this.cfg.children[5].on = {"tap":{"func":"hero_delete","arg":[DB.data.hero.own[i][3]]}};
        if(DB.data.hero.own[i][4]>0){
            this.cfg.children[0].children[1].data.text = `(伤${100-DB.data.hero.own[i][4]}%)`
        }else{
            this.cfg.children[0].children[1].data.text = `(${DB.data.hero.own[i][1]}/${max})`
        }
    }

    dis_hero(type){
        Music.play("audio/but.mp3");
        this.backNode = Scene.open(`app-ui-back`,Scene.root);
        Scene.open(`app-ui-heroDis`,this.backNode, null, {id:type});
    }
    //加1个人
    army_plus (id){
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero")
        Connect.request({type:"app/army@army_plus",arg:id},(data) => {
            if(data.err){
                if(data.err == 3){
                    AppEmitter.emit("message",`目前最多${DB.data.hero.MaxHero[0]}名将领同时带兵`);
                }else if(data.err == 4){
                    AppEmitter.emit("message",`${bcfg[DB.data.hero.own[id][0]]["name"] }正在养伤，无法带兵。`);
                }
                return console.log(data.err.reson);
            }else{
                DB.data.hero.own[id][1] = data.ok[0];
                DB.data.army.cur[0] = data.ok[1];
                DB.data.hero.MaxHero[2] = data.ok[2];
            }
        })
  
    }
    //减1个人
    army_minus(id){
        Connect.request({type:"app/army@army_minus",arg:id},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }
            DB.data.hero.own[id][1] = data.ok[0];
            DB.data.army.cur[0] = data.ok[1];
            DB.data.hero.MaxHero[2] = data.ok[2];
        })
    }
     //人数清0
     army_zero (id){
         Connect.request({type:"app/army@army_zero",arg:id},(data) => {
             if(data.err){
                 return console.log(data.err.reson);
             }
             DB.data.hero.own[id][1] = data.ok[0];
             DB.data.army.cur[0] = data.ok[1];
         })
     }
    //满编
    army_max (id){
        Connect.request({type:"app/army@army_max",arg:id},(data) => {
            let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero")
            if(data.err){
                if(data.err == 3){
                    AppEmitter.emit("message",`目前最多${DB.data.hero.MaxHero[0]}名将领同时带兵`);
                }else if(data.err == 4){
                    AppEmitter.emit("message",`${bcfg[DB.data.hero.own[id][0]]["name"] }正在养伤，无法带兵。`);
                }
            }else{
                DB.data.hero.own[id][1] = data.ok[0];
                DB.data.army.cur[0] = data.ok[1];
                DB.data.hero.MaxHero[2] = data.ok[2];   
            }
        })
    }
    //革职
    hero_delete (id){
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
            name = bcfg[DB.data.hero.own[id][0]]["name"];
        Music.play("audio/but.mp3");
        AppEmitter.emit("stagePause");
        Scene.open(`app-ui-confirm`, Global.mainFace.node, null, {text:`革职后，您将永远失去${name}。\n确认吗？`,on:"hero_delete",arg:[id]});
    }

    added(node){
        hurtNode[node.widget.props.id] = this.elements.get("button_hurt");   
        heroNode[node.widget.props.id] = this.elements.get("button_hero");    
    }
}


/**
 * @description  军队界面组件
 */
class WArmy extends Widget{
    setProps(props){
        super.setProps(props);
        let color = 6,
            cost = Math.ceil(DB.data.army.price[0] * DB.data.army.price[2] -0.5)

        this.cfg.children[2].props.left = Scene.screen.width -95
        this.cfg.children[3].data.left = Scene.screen.width - 150 - (cost>9999?14:0)
        this.cfg.children[1].data.text = `${DB.data.army.cur[0]}/${DB.data.army.max[0]}`;
        this.cfg.children[3].data.text = `${cost}黄金`;
        this.cfg.children[7].data.text = `${DB.data.hero.own.length}/${DB.data.hero.MaxHero[1]}`;
        //消耗加颜色
        if(DB.data.res.gold[1]>=parseInt(this.cfg.children[3].data.text)){
            color = 2
        }
        this.cfg.children[3].data.style.fill = Global.color[color];

        if(!DB.data.hero.own.length){
            this.cfg.children[8].data.text = "请前往酒馆招募将领"
        }

    }
    added(node){
        armyNode[0] = this.elements.get("army_number");
        armyNode[1] = this.elements.get("hero_number");
        armyNode[2] = this.elements.get("army_price");
    }
    army_buy(){
        Connect.request({type:"app/army@army_buy",arg:[]},(data) => {
            if(data.err == 1){
                AppEmitter.emit("message","黄金不足！");
                return console.log(data.err.reson);
            }else if(data.err == 2){
                AppEmitter.emit("message","空闲士兵已达上限！");
                return console.log(data.err.reson);
            }else{
                DB.data.res.gold[1] = data.ok[0];
                let n =data.ok[1] - DB.data.army.total[0] 
                DB.data.army.total[0] = data.ok[1];
                DB.data.army.cur[0] = data.ok[2];
                AppEmitter.emit("message",`空闲士兵+${n}`);

            }
        })
    }
}

//英雄介绍弹窗
class WheroDis extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let i = props.id,
            bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
            id = DB.data.hero.own[i][0],
            armsId = bcfg[id]["arms"],
            max = bcfg[id]["command"] + DB.data.hero.add[0],
            name = bcfg[id]["name"];
        this.cfg.data.left = Math.floor(Scene.screen.width - this.cfg.data.width)/2 
        this.cfg.children[1].data.text = `${name}(${DB.data.hero.own[i][1]}/${max})`;
        this.cfg.children[2].data.text = `统帅：${bcfg[id]["command"]}（+${DB.data.hero.add[0]}）`;
        this.cfg.children[3].data.text = `${Army.arms_Cname[armsId]}：${Math.floor(bcfg[id]["number"]+DB.data.hero.own[DB.data.hero.own[i][3]][2])}（+${DB.data.hero.add[armsId+1]}）`;
    }
} 


/**
 * @description 打开军队界面
 */
const open = () => {
    Global.mainFace.node = Scene.open("app-ui-army", Scene.root);
    Global.mainFace.id = 3;
    //显示解锁的工作按钮


    for(let i=0; i<DB.data.hero.own.length;i++ ){
      Scene.open("app-ui-armyButton", Global.mainFace.node,null, {id:i});
    }
    
}



/****************** 立即执行 ******************/


//注册组件
Widget.registW("app-ui-army",WArmy);
Widget.registW("app-ui-armyButton",WHero);
Widget.registW("app-ui-heroDis",WheroDis);

let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
    leftHero =[[],[],[],[],[],[]]
for(let i in bcfg ){
    leftHero[bcfg[i]["color"]].push(i);
}

//注册军队人口监听
    DB.emitter.add(`army.cur.0`, () => {
            Army.updateArmy();
            Army.updateHero(); 
    });

    DB.emitter.add(`army.max.0`, () => {
        Army.updateArmy();
});


// DB.emitter.add(`army.total.0`, () => {
//     Army.eatGold()
// });

//注册页面打开事件
AppEmitter.add("intoArmy",(node)=>{
    open();
});

//注册消耗黄金监听
DB.emitter.add(`res.gold.1`, () => {
    Army.updatecost()
});

//注册将领受伤监听
DB.emitter.add(`hero.own`, () => {
    Army.updateHero()
});

//注册招兵费用
DB.emitter.add(`army.price.0`, () => {
    Army.updatePrice()
});

 //初始化数据库
 AppEmitter.add("initDB",(node)=>{
    Army.initDB();
});