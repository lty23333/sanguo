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
let cityNumberNode // 占领城市节点

class Map {
    
    static city_sprite = []  //据点精灵

    //更新建筑数量
    static updateBuild(id,type){
        if(type ==0){
            if(DB.data.build[id][0] && Global.mainFace.id ==2){
                Build.build_sprite = Scene.open("app-ui-buildButton", Global.mainFace.node,null, {id:id+1001});
            }
        }
        if(type ==1){
            let bcfg = CfgMgr.getOne("app/cfg/build.json@build")
            if(bcfg!= undefined && Global.mainFace.id == 2){
                let name = bcfg[`${id+1001}`]["name"]
            
                if(Build.build[id][0] != undefined){
                   Build.build[id][0].text = `${name}（${DB.data.build[id][1]}）`
                }    
            }
        }
    }
        
}
//随机数生成
function rnd( seed ){
    seed = ( seed * 9301 + 49297 ) % 233280; 
    return seed / ( 233280.0 );
};

/**
 * @description  建筑按钮组件
 */
class WbuildButton extends Widget{
    backNode:any
    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            id = props.id,
            name = bcfg[id]["name"]
        this.cfg.children[0].data.text = `${bcfg[id]["name"]}(${DB.data.build[id-1001][1]})`;
        this.cfg.data.left = bcfg[id]["left"];
        this.cfg.data.top =  bcfg[id]["top"];
        this.cfg.on = {"tap":{"func":"addBuild","arg":[id]}};

    }

    addBuild(type){
        this.backNode = Scene.open(`app-ui-back`,Global.mainFace.node);
        //如果是酒馆，则特殊处理
        if(type==1009){
            Connect.request({type:"app/hero@choose",arg:2},(data) => {
                if(data.err){
                    return console.log(data.err.reson);
                }else{
                    Scene.open(`app-ui-hotel`,this.backNode,null, {id:1009,backNode:this.backNode});
                    for(let i=0;i<data.ok[0].length;i++){
                        Build.heroNode[i] =Scene.open(`app-ui-hero`,this.backNode,null, {id:data.ok[0][i],backNode:this.backNode,left:90+i*230});
                    }
                }  
            })         
        }else{
            Scene.open(`app-ui-combuildWindow`,this.backNode, null, {id:type,backNode:this.backNode});
        }
        
    }

    added(node){   
        Build.build[node.widget.props.id-1001] =[];
        Build.build[node.widget.props.id-1001][0] = this.elements.get("button_add");    
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
//据点城市弹窗
class WCity extends Widget{
    node: any
    backNode:any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/city.json@city"),
            bcfg2 = CfgMgr.getOne("app/cfg/hero.json@hero"),
            Cname = ["步","骑","弓"],
            id = props.id,
            army = bcfg[id]["army"],
            str1 = "",
            str2 = ""

        for(let i=0;i< army.length;i++){
            str1 = `${str1},${bcfg2[army[i][0]]["name"]}(${army[i][1]}${Cname[bcfg2[army[i][0]]["arms"]]})`
        }

        str1.slice(0,1);
        this.cfg.children[1].data.text = `${bcfg[id]["name"]}`;
        this.cfg.children[3].data.text = `${bcfg[id]["belong"]}`;
        this.cfg.children[3].data.text = `${str1}`;


        this.cfg.data.left = props.left;

        this.cfg.on = {"tap":{"func":"choose","arg":[id]}};
       
    }
    choose(id){
        this.backNode = Scene.open(`app-ui-back`,Global.mainFace.node);
        Scene.open("app-ui-fightWindow", this.backNode);
        
    } 
    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = node;
        Build.com_name = this.elements.get("name");

    }
} 

//战斗弹窗
class WfightWindow extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            id = props.id,
            bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
            cost = bcfg2[DB.data.build[id-1001][1]+1][`a${id}`]*bcfg[id]["cost_number1"],  
            cost_name = bcfg[id]["cost_type1"],
            cost_name2 = bcfg[id]["cost_type2"],
            effect = bcfg[id]["effect_type"],
            cost2
        if(cost_name2){
           cost2 = bcfg2[DB.data.build[id-1001][1]+1][`a${id}`]*bcfg[id]["cost_number2"];
        } 

        this.cfg.children[1].data.text = `${bcfg[id]["name"]}(${DB.data.build[id-1001][1]})`;
        this.cfg.children[2].data.text = `效果：${bcfg[id]["effect_dis"].replace("{{effect_number}}",bcfg[id]["effect_number"][0])}`;
        this.cfg.children[3].data.text = `消耗：${cost}${Build.res_Cname[Build.res_name.indexOf(cost_name)]}`;
        if(cost_name2){
            Build.com_cost.text = `消耗：${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]},${cost2}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type2"])]}`;
        } 
        Build.cur_buildId = id
       
    }
    levelup(){
        let id = Build.cur_buildId,
            bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
            cost = bcfg2[DB.data.build[id-1001][1]+2][`a${id}`]*bcfg[id]["cost_number1"],   
            cost_name = bcfg[id]["cost_type1"],
            cost_name2 = bcfg[id]["cost_type2"],
            effect = bcfg[id]["effect_type"],
            cost2
        if(cost_name2){
           cost2 = bcfg2[DB.data.build[id-1001][1]+2][`a${id}`]*bcfg[id]["cost_number2"];
        }
            Connect.request({type:"app/build@levelup",arg:id},(data) => {
                if(data.err){
                    AppEmitter.emit("message","资源不足！");
                    return console.log(data.err.reson);
                }
                for(let i=0;i<effect.length;i++){
                    if (Number(effect[i][2]) == 0 && DB.data[effect[i][0]][effect[i][1]][effect[i][2]] == 1){

                    }else{
                        DB.data[effect[i][0]][effect[i][1]][effect[i][2]] = data.ok[2][i];
                    }
                }   
                DB.data.build[id-1001][1] = data.ok[0];
                DB.data.res[cost_name][1] = data.ok[1];
                if(data.ok[3]!=null){
                    DB.data.res[cost_name2][1] = data.ok[3];
                }
                //更新窗口信息
                Build.com_name.text = `${bcfg[id]["name"]}(${DB.data.build[id-1001][1]})`;
                Build.com_effect.text = `效果：${bcfg[id]["effect_dis"].replace("{{effect_number}}",bcfg[id]["effect_number"][0])}`;
                Build.com_cost.text = `消耗：${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]}`;
                if(cost_name2){
                    Build.com_cost.text = `消耗：${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]},${cost2}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type2"])]}`;
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
} 

/**
 * @description 打开建筑界面
 */
const open = () => {
    Global.mainFace.node = Scene.open("app-ui-map", Scene.root);
    Global.mainFace.id = 4;
 
    //显示解锁的建筑按钮
    for(let i=0; i<DB.data.map.guard.length;i++ ){
        if(DB.data.map.guard[i][0]){
            Map.city_sprite[i] = Scene.open("app-ui-city", Global.mainFace.node,null, {id:DB.data.map.guard[i][0]});
        }
    }

}



/****************** 立即执行 ******************/
//注册组件
Widget.registW("app-ui-build",WBuild);
Widget.registW("app-ui-combuildWindow",WcomWindow);
Widget.registW("app-ui-buildButton",WbuildButton);
Widget.registW("app-ui-hotel",Whotel);
Widget.registW("app-ui-hero",Whero);
//初始化敌军数据库guard: [[据点ID,[将领id,人数],[将领id,人数]],..]

DB.init("map",{city:0,attack:[[]],guard:[[],[],[]]});

const initBuild = () => {
    let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
    tempDB = [[1,0]]
    for(let k in bcfg){
        tempDB.push([0,0]);
    }
    
    DB.init("build", tempDB);
};
DB.init("hotel",{date:[0],price:[10]});
//注册页面打开事件
AppEmitter.add("intoMap",(node)=>{
    open();
});
AppEmitter.add("initBuild",(node)=>{
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
