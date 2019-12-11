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
    heroList = []  //己方英雄列表

class Map {
    
    static city_sprite = []  //据点精灵
    static armyNode = []  //敌军描述节点

    //更新据点
    static updateGuard(){
        let time = [15,50,100]
        let newDate =DB.data.date.day[0]+Math.ceil(time[DB.data.map.guard.length]*(700+rand(600)/1000))
        //更新下一次时间
        if( (newDate < DB.data.map.date[0] || DB.data.map.date[0] < DB.data.date.day[0])&& DB.data.map.guard.length<3 ){
            Connect.request({type:"app/map@date_update",arg:{date:newDate}},(data) => {
                if(data.err){
                    return console.log(data.err.reson);
                }
                DB.data.map.date[0] = data.ok[0];
                
            })
        }

        //更新据点精灵
        if(Global.mainFace.id ==4){
            for(let i = 0;i< DB.data.map.guard.length;i++){
                if(DB.data.map.guard[i][0]){
                    Map.city_sprite[i] = Scene.open("app-ui-city", Global.mainFace.node,null, {id:DB.data.map.guard[i][0],index:i});
                }
            }
        }
    }   
    static updateHerolist(){
        if(Global.mainFace.id == 4){
            initHero();
        }
    }
}



/**
 * @description  地图界面组件
 */
class WMap extends Widget{
    setProps(props){
        super.setProps(props);
        this.cfg.children[1].data.text = DB.data.map.city[0] ;
    }

    added(node){
        cityNumberNode = this.elements.get("city_number");
    }


}
//据点城市弹窗
class WCity extends Widget{
    node: any
    backNode:any

    setProps(props){
        super.setProps(props);
        let bcfg ,
            bcfg2 = CfgMgr.getOne("app/cfg/hero.json@hero"),
            Cname = ["步","骑","弓"],
            id = props.id,
            army = DB.data.map.guard[props.index],
            str1 = "",
            str2 = ""
        //判断城市还是随机据点
        if(id<20000){
            bcfg = CfgMgr.getOne("app/cfg/city.json@city")
        }else{
            bcfg = CfgMgr.getOne("app/cfg/city.json@rand")
        }   
        for(let i=1;i< army.length;i++){
            str1 = `${str1}\n${bcfg2[army[i][0]]["name"]}(${army[i][1]}${Cname[bcfg2[army[i][0]]["arms"]]})`
        }
        str2 = bcfg[id]["reward_dis"];
        str1.slice(0,2);
        this.cfg.children[1].data.text = `${bcfg[id]["name"]}`;
        this.cfg.children[2].data.text = `${bcfg[id]["belong"]}`;
        this.cfg.children[3].data.text = `${str1}`;
        this.cfg.children[4].data.text = `${str2.replace(/\\n/,"\n")}`;

        this.cfg.data.left += props.index * 200;

        this.cfg.on = {"tap":{"func":"choose","arg":[id]}};
       
    }
    choose(id){
        if(DB.data.hero.own[0]){
            this.backNode = Scene.open(`app-ui-back`,Global.mainFace.node);
            Scene.open("app-ui-fightWindow", this.backNode,null,{id:this.props.id,index:this.props.index});
        }else{
            AppEmitter.emit("message",`无可出战的军队！`);
        }
        
    } 
    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = node;
        Map.armyNode[this.props.index] = this.elements.get("army");

    }
} 

//战斗弹窗
class WfightWindow extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg ,
            bcfg2 = CfgMgr.getOne("app/cfg/hero.json@hero"),
            Cname = ["步","骑","弓"],
            id = props.id,
            army = DB.data.map.guard[props.index],
            str1 = "",
            str2 = ""

         //判断城市还是随机据点
        if(id<20000){
            bcfg = CfgMgr.getOne("app/cfg/city.json@city")
        }else{
            bcfg = CfgMgr.getOne("app/cfg/city.json@rand")
        }  
        //我军上阵
        for(let i=0;i < DB.data.hero.MaxHero[0];i++){
            str1 = `${str1}\n${bcfg2[heroList[i][0]]["name"]}(${heroList[i][1]}${Cname[bcfg2[heroList[i][0]]["arms"]]})`
        }
        //敌军上阵
        for(let i=1;i< army.length;i++){
            str2 = `${str2}\n${bcfg2[army[i][0]]["name"]}(${army[i][1]}${Cname[bcfg2[army[i][0]]["arms"]]})`
        }

        this.cfg.children[1].data.text = `${bcfg[id]["name"]}`;
        this.cfg.children[2].children[0].data.text = `攻${str1}`;
        this.cfg.children[3].children[0].data.text = `守${str2}`;

    }
    fight(){
        let own =[],
            bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
            bcfg2 = CfgMgr.getOne("app/cfg/city.json@city"),
            bcfg4 = CfgMgr.getOne("app/cfg/city.json@army")

        for(let i=0;i < DB.data.hero.MaxHero[0];i++){
            if(!own[i]){own[i] = []}
            own[i][0] = heroList[i][0]
            own[i][1] = heroList[i][1]
            own[i][4] = bcfg[own[i][0]]["arms"]
            own[i][2] = 1 + (bcfg[own[i][0]]["number"]+heroList[i][2])/100 + DB.data.hero.add[own[i][4]]
            own[i][3] = heroList[i][3]
        }
        let enemy = []
        for(let i=0;i < DB.data.map.guard[this.props.index].length-1;i++){
            if(!enemy[i]){enemy[i] = []}
            enemy[i][0] = DB.data.map.guard[this.props.index][i+1][0]
            enemy[i][1] = DB.data.map.guard[this.props.index][i+1][1]
            //判断是否是城市
            if(this.props.id < 20000){
                enemy[i][2] = 1 + bcfg[enemy[i][0]]["number"]/100 + bcfg2[this.props.id]["attribute"]
            }else{
                enemy[i][2] = 1 + bcfg[enemy[i][0]]["number"]/100 + bcfg4[Math.ceil(DB.data.date.day[0]/100)]["attribute"]
            }
            enemy[i][3] = i+1
            enemy[i][4] = bcfg[enemy[i][0]]["arms"]
        }
        Scene.remove(Global.mainFace.node); 
        AppEmitter.emit("intoFight",{fighter:[own,enemy],city:this.props.id,enemyType:this.props.index});
    } 
    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = this.props.backNode;;
    }
} 
//初始化英雄列表
const initHero = () => { 
    heroList = DB.data.hero.own
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
 * @description 打开地图界面
 */
const open = () => {
    Global.mainFace.node = Scene.open("app-ui-map", Scene.root);
    Global.mainFace.id = 4;
 
    //显示据点按钮
    for(let i=0; i<DB.data.map.guard.length;i++ ){
        if(DB.data.map.guard[i][0]){
            Map.city_sprite[i] = Scene.open("app-ui-city", Global.mainFace.node,null, {id:DB.data.map.guard[i][0],index:i});
        }
    }
    initHero();
}



/****************** 立即执行 ******************/
//注册组件
Widget.registW("app-ui-map",WMap);
Widget.registW("app-ui-fightWindow",WfightWindow);
Widget.registW("app-ui-city",WCity);
//初始化敌军数据库guard: [[[据点ID],[将领id,人数],[将领id,人数]],..]
//city:[占领城市数量，，所有建筑数量]
DB.init("map",{date:[1],city:[0,10000,0],attack:[[]],guard:[]});



//注册页面打开事件
AppEmitter.add("intoMap",(node)=>{
    open();
});

//监听己方英雄
DB.emitter.add(`hero.own`, () => {
    Map.updateHerolist();
});
//监听据点
DB.emitter.add(`map.guard`, () => {
    Map.updateGuard();
});

