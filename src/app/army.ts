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


/****************** 导出 ******************/

/****************** 本地 ******************/
let heroNode = [];
let armyNode = [];
let heroList = [];

    


class Army {
    
    static arms_Cname =["步兵","骑兵","弓兵"]
    static hero_top =[0,50,150,250,350,450,550,650]


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
          armyNode[0].text = `${DB.data.army.cur}`;
        }
    }
    static updateHero(){
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero")
        if(Global.mainFace.id == 3){
            for(let i=0;i<heroList.length;i++){
                if(heroNode[i]!= undefined){
                    heroNode[i].text = `${bcfg[heroList[i][0]]["name"]}(${heroList[i][1]})`
                }
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
            name = bcfg[id]["name"];
        super.setProps(props);
        this.cfg.children[0].children[0].data.text = `${name}(${heroList[i][1]})`;
        this.cfg.data.top =  Army.hero_top[i+1];
        this.cfg.children[0].on = {"tap":{"func":"dis_hero","arg":[i]}};
        this.cfg.children[1].props.on = {"tap":{"func":"army_plus","arg":[heroList[i][3]]}};
        this.cfg.children[2].props.on = {"tap":{"func":"army_minus","arg":[heroList[i][3]]}};
        this.cfg.children[3].props.on = {"tap":{"func":"army_zero","arg":[heroList[i][3]]}};

    }

    dis_hero(type){
        this.backNode = Scene.open(`app-ui-back`,Global.mainFace.node);
        Scene.open(`app-ui-heorDis`,this.backNode, null, {id:type});
    }
    //加1个人
    army_plus (id){
        Connect.request({type:"app/army@army_plus",arg:id},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }
            DB.data.hero.own[id][1] = data.ok[0];
            DB.data.army.cur = data.ok[1];
        })
  
    }
    //减1个人
    army_minus(id){
        Connect.request({type:"app/army@army_minus",arg:id},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }
            DB.data.hero.own[id][1] = data.ok[0];
            DB.data.army.cur = data.ok[1];
        })
    }
    //人数清0
    army_zero (id){
        Connect.request({type:"app/army@army_zero",arg:id},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }
            DB.data.hero.own[id][1] = data.ok[0];
            DB.data.army.cur = data.ok[1];
        })
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

        this.cfg.children[1].data.text = `${DB.data.army.cur}`;
 

    }
    added(node){
        armyNode[0] = this.elements.get("army_number");
    }
    army_buy(){
        Connect.request({type:"app/army@army_buy",arg:[]},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }
            DB.data.res.gold[1] = data.ok[0];
            DB.data.army.total = data.ok[1];
            DB.data.army.cur = data.ok[2];
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
            name = bcfg[id]["name"];
        
        this.cfg.children[1].data.text = `${name}(${heroList[i][1]})`;
        this.cfg.children[2].data.text = `统帅：${bcfg[id]["command"]}（+${DB.data.hero.add[0]}）`;
        this.cfg.children[3].data.text = `${Army.arms_Cname[armsId]}：${bcfg[id]["number"]+DB.data.hero.own[heroList[i][3]][2]}（+${DB.data.hero.add[armsId]}）`;
        this.cfg.children[4].data.text = `战斗力：${(bcfg[id]["command"]+DB.data.hero.add[0])*(1+(bcfg[id]["number"]+DB.data.hero.own[heroList[i][3]][2]+DB.data.hero.add[armsId]))/100}`
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
      heroNode[i] = Scene.open("app-ui-armyButton", Global.mainFace.node,null, {id:i});
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
//初始化英雄数据库 own：[[武将ID，带兵数量，兵种属性,位置ID]] add[统帅加成，步兵加成，骑兵加成，弓兵加成]
DB.init("hero",{own:[[]],left:leftHero,choose:[],add:[0,0,0,0],p:[80,15,4,0.8,0.2,0]});
DB.init("army",{cur:0,total:0,price:50});

//注册军队人口监听
    DB.emitter.add(`army.total`, () => {
            Army.updateArmy();
            Army.updateHero(); 
    });


DB.emitter.add(`army.total`, () => {
    Army.eatGold()
});

//注册页面打开事件
AppEmitter.add("intoArmy",(node)=>{
    open();
});
