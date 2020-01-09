/****************** 导入 ******************/
import Scene from '../libs/ni/scene';
import Frame from '../libs/ni/frame';
import DB from "../libs/ni/db";
import Widget from '../libs/ni/widget';
import CfgMgr from '../libs/ni/cfgmrg';
import {AppEmitter} from './appEmitter';
import { AppUtil } from "./util";
import Connect from "../libs/ni/connect";
import {table} from "./formula";
import {Global} from './global';
import {addNews} from './stage';


/****************** 导出 ******************/

/****************** 本地 ******************/
let heroNode = [];
let armyNode = [];
let heroList = [];

    


class Army {
    
    static arms_Cname =["步兵","骑兵","弓兵"]
    static hero_top =[30,160,260,360,460,560]

    static eatGold(){
        Connect.request({type:"app/res@eatGold",arg:{}},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }
            DB.data.res.gold[5] = data.ok;
        })
    }
    static updateArmy(){
        if(armyNode[0]!= undefined && Global.mainFace.id == 3){
          armyNode[0].text = `${DB.data.army.cur[0]}`;
        }
    }
    static updateHero(){
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero")
        if(Global.mainFace.id == 3){
            for(let i=0;i<heroList.length;i++){
                if(heroNode[i]!= undefined){
                    heroNode[i].text = `${bcfg[heroList[i][0]]["name"]}\n(${heroList[i][1]}/${bcfg[heroList[i][0]]["command"] + DB.data.hero.add[0]})`
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
   
        
}
/**
 * @description  添人按钮组件
 */
class WHero extends Widget{
    backNode :any
    setProps(props){
        let i = props.id,
            id = heroList[i][0],
            bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
            max = bcfg[id]["command"] + DB.data.hero.add[0],
            name = bcfg[id]["name"];
        super.setProps(props);
        this.cfg.children[0].children[0].data.text = `${name}\n(${heroList[i][1]}/${max})`;
        this.cfg.data.top =  Army.hero_top[i+1] +330;
        this.cfg.children[0].on = {"tap":{"func":"dis_hero","arg":[i]}};
        this.cfg.children[1].props.on = {"tap":{"func":"army_plus","arg":[heroList[i][3]]}};
        this.cfg.children[2].props.on = {"tap":{"func":"army_minus","arg":[heroList[i][3]]}};
        this.cfg.children[3].props.on = {"tap":{"func":"army_max","arg":[heroList[i][3]]}};
        this.cfg.children[4].props.on = {"tap":{"func":"hero_delete","arg":[heroList[i][3]]}};

    }

    dis_hero(type){
        this.backNode = Scene.open(`app-ui-back`,Global.mainFace.node);
        Scene.open(`app-ui-heroDis`,this.backNode, null, {id:type});
    }
    //加1个人
    army_plus (id){
        Connect.request({type:"app/army@army_plus",arg:id},(data) => {
            if(data.err){
                if(data.err == 3){
                    AppEmitter.emit("message",`目前最多${DB.data.hero.MaxHero[0]}名将领同时带兵`);
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
    // //人数清0
    // army_zero (id){
    //     Connect.request({type:"app/army@army_zero",arg:id},(data) => {
    //         if(data.err){
    //             return console.log(data.err.reson);
    //         }
    //         DB.data.hero.own[id][1] = data.ok[0];
    //         DB.data.army.cur[0] = data.ok[1];
    //     })
    // }
    //满编
    army_max (id){
        Connect.request({type:"app/army@army_max",arg:id},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }
            DB.data.hero.own[id][1] = data.ok[0];
            DB.data.army.cur[0] = data.ok[1];
            DB.data.hero.MaxHero[2] = data.ok[2];
        })
    }
    //革职
    hero_delete (id){
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
            name = bcfg[DB.data.hero.own[id][0]]["name"];

        Scene.open(`app-ui-confirm`, Global.mainFace.node, null, {text:`革职后，您将永远失去${name}。\n确认吗？`,on:"hero_delete",arg:[id]});
    }

    added(node){   
        heroNode[node.widget.props.id] = this.elements.get("button_army");    
    }
}


/**
 * @description  军队界面组件
 */
class WArmy extends Widget{
    setProps(props){
        super.setProps(props);
        let color = 6
        this.cfg.children[1].data.text = `${DB.data.army.cur}`;
        this.cfg.children[7].data.text = `${DB.data.hero.own.length}/${DB.data.hero.MaxHero[1]}`;
        //消耗加颜色
        if(DB.data.res.gold[1]>=parseInt(this.cfg.children[3].data.text)){
            color = 2
        }
        this.cfg.children[3].data.style.fill = Global.color[color];

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
            }else{
                DB.data.res.gold[1] = data.ok[0];
                DB.data.army.total[0] = data.ok[1];
                DB.data.army.cur[0] = data.ok[2];
                AppEmitter.emit("message","空闲士兵+1");

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
            id = heroList[i][0],
            armsId = bcfg[id]["arms"],
            max = bcfg[id]["command"] + DB.data.hero.add[0],
            name = bcfg[id]["name"];
        
        this.cfg.children[1].data.text = `${name}(${heroList[i][1]}/${max})`;
        this.cfg.children[2].data.text = `统帅：${bcfg[id]["command"]}（+${DB.data.hero.add[0]}）`;
        this.cfg.children[3].data.text = `${Army.arms_Cname[armsId]}：${Math.floor(bcfg[id]["number"]+DB.data.hero.own[heroList[i][3]][2])}（+${DB.data.hero.add[armsId]}）`;
    }
} 


/**
 * @description 打开军队界面
 */
const open = () => {
    Global.mainFace.node = Scene.open("app-ui-army", Scene.root);
    Global.mainFace.id = 3;
    //显示解锁的工作按钮

    heroList = DB.data.hero.own;
    let t
    for(let i=0; i<heroList.length;i++ ){
        for(let j=i; j<heroList.length;j++ ){
            if(heroList[i][1]<heroList[j][1]){
                t = heroList[i];
                heroList[i] = heroList[j];
                heroList[j] = t;
            }
        }
    }
    for(let i=0; i<heroList.length;i++ ){
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
//初始化英雄数据库 own：[[武将ID，带兵数量，后天成长属性,位置ID]] add[统帅加成，步兵加成，骑兵加成，弓兵加成]MaxHero:[能上阵将领数量,最大招募将领数量,已带兵将领数量]
DB.init("hero",{MaxHero:[1,1,0],own:[],enemy:[],left:leftHero,choose:[0,0,0],add:[0,0,0,0],p:[80,15,4,0.8,0.2,0]});
DB.init("army",{cur:[0],total:[0],price:[50]});

//注册军队人口监听
    DB.emitter.add(`army.cur.0`, () => {
            Army.updateArmy();
            Army.updateHero(); 
    });


DB.emitter.add(`army.total.0`, () => {
    Army.eatGold()
});

//注册页面打开事件
AppEmitter.add("intoArmy",(node)=>{
    open();
});

//注册消耗黄金监听
DB.emitter.add(`res.gold.1`, () => {
    Army.updatecost()
});
