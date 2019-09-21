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
import {Global,rand} from './global';


/****************** 导出 ******************/

/****************** 本地 ******************/
let cityNumberNode, // 占领城市节点
    heroList = [],  //己方英雄列表
    lastFace,        //上一个界面
    fighter,         //参战数据
    hpNode =[[]],          //扣血节点
    moverF = [],     //当前精灵阵营，ID
    moverT = [],     //目标精灵阵营，ID
    sitP = [[[]]],         //军队不动时坐标
    attP = [[[]]] ,          //进队进攻的坐标          
    fighter_sprite = [[]],  //参战军队精灵
    armys = [[]],         //参战军队的逻辑对象
    state = "start",      //表现演播的状态
    isvic,        //是否胜利
    fight_show,  // 战斗表现
    armysF,    //当前军队逻辑对象
    armysT,    //目标军队逻辑对象  
    damage,      //伤害
    vx,          //水平移动速度
    vy          //竖直移动速度
class Fight {
    

    static pause = 0
    static events = []     //事件列表


    static updateHerolist(){
        if(Global.mainFace.id == 4){
            initHero();
        }
    }
    static run(){
        if(state == "start"){
            moverF = sitP[fight_show[0][1],fight_show[0][2]]
            moverT = attP[fight_show[0][4],fight_show[0][5]]
            armysF = fight_show[fight_show[0][1],fight_show[0][2]]
            armysT = fight_show[fight_show[0][4],fight_show[0][5]]
            damage =  fight_show[0][6]
            vx = (moverT[0]-moverF[0])/60
            vy = (moverT[1]-moverF[1])/60
            state = "run1"

        }else if(state == "run1"){
            armysF.left = armysF.left + vx;
            armysF.top = armysF.top + vy;
            Stage.events.push({type:"remove",target: stone});

        }else if(state == "damage"){


        }else if(state == "run2"){

        }
          
    }
    static loop(): Array<any>{
        let evs;
        if(!Fight.pause){
            Fight.run();
        }
        evs = Fight.events;
        Fight.events = [];
        return evs;
    }

}

class Army{
    constructor(options){
        for(let k in options){
            this[k] = options[k];
        }
    }
    top = 0
    left = 0
    hp = 0
    hp_height = 0
    v = 5
    group = 0 
    id = 0
}


/**
 * @description 显示事件处理
 */
class Show{
 
    /**
     * @description 分发事件
     * @param evs 事件列表
     */
    static distribute(evs){
        for(let i = 0,len = evs.length; i < len; i++){
            Show[evs[i].type] && Show[evs[i].type](evs[i]);
        }
    }   
    static insert(ev){
        fighter_sprite[ev.group][ev.id] = Scene.open("app-ui-fightHero", Global.mainFace.node,null, {id:ev.id,group:ev.group,left:sitP[ev.group][ev.id][0],top:sitP[ev.group][ev.id][1]});
    }
    static move(ev){
        let army = fighter_sprite[ev.target.group][ev.target.id];
        army.ni.left = ev.target.left;
        army.ni.top = ev.target.top;
    }
    static effect(ev){
        if(ev.effect == "addscore"){


        }
    }
    static remove(ev){
        let shap = fighter_sprite[ev.target.group][ev.target.id];
        Scene.remove(shap);
        delete fighter_sprite[ev.target.group][ev.target.id];
    }
    static over(){

    }
}


/**
 * @description  地图界面组件
 */
class WMap extends Widget{
    setProps(props){
        super.setProps(props);
        this.cfg.children[1].data.text = DB.data.map.city ;
    }

    added(node){
        cityNumberNode = this.elements.get("city_number");
    }


}
//参战军队
class WfightHero extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
            Cname = ["步","骑","弓"],
            group = props.group,
            id = props.id,
            heroId = fighter[group][id][0],
            name = bcfg[heroId]["name"],
            size = [0,80,60,50,40]

        this.cfg.data.left = props.left;
        this.cfg.data.top = props.top;
        this.cfg.children[3].data.text = `${name}`;
        this.cfg.children[3].data.style.fontSize = size[name.length]
        this.cfg.children[1].data.style.fill = `${Global.color[bcfg[heroId]["color"]]}`;
        this.cfg.children[4].data.text = `${fighter[group][id][1]} ${Cname[fighter[group][id][4]]}`;    
    }
    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = node;
        hpNode[this.props.group][this.props.id] = this.elements.get("hp");
    }
} 

//战斗结算弹窗
class WfightAccount extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/city.json@city"),
        bcfg2 = CfgMgr.getOne("app/cfg/hero.json@hero"),
        Cname = ["步","骑","弓"],
        id = props.id,
        army = DB.data.map.guard[props.index],
        str1 = "",
        str2 = ""
        //我军上阵
        for(let i=0;i < DB.data.hero.upHero[0];i++){
            str1 = `${str1}/n${bcfg2[heroList[i][0]]["name"]}(${heroList[i][1]}${Cname[bcfg2[heroList[i][0]]["arms"]]})`
        }
        //敌军上阵
        for(let i=1;i< army.length;i++){
            str2 = `${str1},${bcfg2[army[i][0]]["name"]}(${army[i][1]}${Cname[bcfg2[army[i][0]]["arms"]]})`
        }

        this.cfg.children[1].data.text = `${bcfg[id]["name"]}`;
        this.cfg.children[2].data.text = `攻${str1}`;
        this.cfg.children[3].data.text = `守${str2}`;
    }

    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = node;
    }
} 
//初始化英雄列表
const initHero = () => {
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
}
/**
 * @description 打开战斗界面
 */
const open = () => {
    Global.mainFace.node = Scene.open("app-ui-fight", Scene.root);
    Global.mainFace.id = 5;
 
    //显示军队
    for(let i=0; i<2;i++ ){
        for(let j=0; j<fighter[i].length;j++ ){
            sitP[i][j][0] = 50 + 200 * j;
            sitP[i][j][1] = 20 + 500 * i;
            attP[i][j][0] = 50 + 200 * j;
            attP[i][j][1] = sitP[i][j][1] + 200*(i?1:-1);
            armys[i][j] = new Army({
                left : sitP[i][j][0],
                top : sitP[i][j][1],
                hp : fighter[i][j][1],
                group : i,
                id : j
            })
            Fight.events.push({type:"insert",target:armys[i][j]});
           fighter_sprite[i][j] = Scene.open("app-ui-fightHero", Global.mainFace.node,null, {id:j,group:i,left:sitP[i][j][0],top:sitP[i][j][1]});

        }
    }
    Connect.request({type:"app/fight@fight",arg:fighter},(data) => {
        if(data.err){
            return console.log(data.err.reson);
        }
        isvic = data.ok[0];
        fight_show = data.ok[1];
        DB.data.hero.own = data.ok[2];
        DB.data.hero.enemy = data.ok[3];
        DB.data.army.total[0] = data.ok[4];
    })
    Fight.pause = 1;


}



/****************** 立即执行 ******************/
//注册组件
Widget.registW("app-ui-map",WMap);
Widget.registW("app-ui-fightWindow",WfightWindow);
Widget.registW("app-ui-city",WCity);
//初始化敌军数据库guard: [[[据点ID],[将领id,人数],[将领id,人数]],..]

DB.init("map",{date:[-1],city:[0],attack:[[]],guard:[]});



//注册页面打开事件
AppEmitter.add("intoFight",(node)=>{
    lastFace = node.face;
    fighter = node.fighter;
    open();
});

Frame.add(()=>{
    if(!Fight.pause){
        Show.distribute(Fight.loop());
    }
});

//监听己方英雄
DB.emitter.add(`hero.own`, () => {
    Map.updateHerolist();
});
