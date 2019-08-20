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
let buildNode // 建筑渲染节点

class Build {
    static width = 0
    static height = 0
    static  build =[[],[],[]] //建筑节点
    static  res={food:[],wood:[],sci:[],gold:[]}// 资源节点
    static  com_name // 通用窗口名字节点
    static  com_effect // 通用窗口效果节点
    static  com_cost// 通用窗口消耗节点
    static res_name = ["food","wood","sci","gold"]  //资源名
    static res_Cname = ["粮食","木材","黄金","科技"]
    static army_Cname = ["步兵","骑兵","弓兵"]
    static build_sprite =[]
    static cur_buildId = 0
    static phero = [80,15,4,0.8,0.2,0]
    static heroNode = []

    static clear(){

    }
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
 * @description  建筑界面组件
 */
class WBuild extends Widget{

    added(node){
        
    }
    manfood_number(){
        Connect.request({type:"app/res@manfood",arg:{}},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }
            DB.data.res.food[1] = data.ok;
        })


    }
}
//英雄弹窗
class Whero extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
            id = props.id


        this.cfg.children[1].data.text = `${bcfg[id]["name"]}`;
        this.cfg.children[1].data.style.fill = `${Global.color[bcfg[id]["color"]]}`;
        this.cfg.children[2].data.text = `统帅：${bcfg[id]["command"]}`;
        this.cfg.children[3].data.text = `${Build.army_Cname[bcfg[id]["arms"]]}:${bcfg[id]["number"]}`;
        this.cfg.children[4].data.text = `${bcfg[id]["gold"]}黄金`;
        this.cfg.data.left = props.left;

        this.cfg.on = {"tap":{"func":"buy","arg":[id]}};
       
    }
    buy(id){
        let 
            bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
            cost = bcfg[id]["gold"]
   
            Connect.request({type:"app/hero@buy",arg:id},(data) => {
                if(data.err){
                    AppEmitter.emit("message","资源不足！");
                    return console.log(data.err.reson);
                }else{
                    DB.data.res.gold[1] = data.ok[0]
                    DB.data.hero.choose = data.ok[1];
                    DB.data.hero.own = data.ok[2];
                    this.remove();
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
    }
} 
//酒馆弹窗
class Whotel extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            id = 1009,
            bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
            cost = bcfg2[DB.data.build[id-1001][1]+1][`a${id}`]*bcfg[id]["cost_number1"],  
            cost_name = bcfg[id]["cost_type1"],
            effect = bcfg[id]["effect_type"]

        this.cfg.children[1].data.text = `${bcfg[id]["name"]}(${DB.data.build[id-1001][1]})`;
        this.cfg.children[2].data.text = `效果：${bcfg[id]["effect_dis"].replace("{{effect_number}}",bcfg[id]["effect_number"][0])}`;
        this.cfg.children[3].data.text = `消耗：${cost}${Build.res_Cname[Build.res_name.indexOf(cost_name)]}`;

        Build.cur_buildId = id
       
    }
    levelup(){
        let id = Build.cur_buildId,
            bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
            bcfg2 = CfgMgr.getOne("app/cfg/build.json@cost"),
            cost = bcfg2[DB.data.build[id-1001][1]+2][`a${id}`]*bcfg[id]["cost_number1"],   
            cost_name = bcfg[id]["cost_type1"],
            effect = bcfg[id]["effect_type"]
   
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
   
                //更新窗口信息
                Build.com_name.text = `${bcfg[id]["name"]}(${DB.data.build[id-1001][1]})`;
                Build.com_effect.text = `效果：${bcfg[id]["effect_dis"].replace("{{effect_number}}",bcfg[id]["effect_number"][0])}`;
                Build.com_cost.text = `消耗：${cost}${Build.res_Cname[Build.res_name.indexOf(bcfg[id]["cost_type1"])]}`;
            })    
        
    } 
    update(){
        
        Connect.request({type:"app/hero@choose",arg:1},(data) => {
            if(data.err){
                AppEmitter.emit("message","黄金不足！");
                return console.log(data.err.reson);
            }else{
                for(let i=0;i<3;i++){
                    if(Build.heroNode[i]!= undefined){
                        Scene.remove(Build.heroNode[i]);
                    }
                    Build.heroNode[i] = Scene.open(`app-ui-hero`,this.node,null, {id:data.ok[0][i],backNode:this.node,left:90+i*230});
                }
                DB.data.res.gold[1] = data.ok[1];
                DB.data.hotel.price = data.ok[2];
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
//建筑弹窗
class WcomWindow extends Widget{
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
    Global.mainFace.node = Scene.open("app-ui-build", Scene.root);
    Global.mainFace.id = 2;
    DB.data.build[8][0]=1;
    //显示解锁的建筑按钮
    for(let i=0; i<DB.data.build.length;i++ ){
        if(DB.data.build[i][0]){
            Build.build_sprite = Scene.open("app-ui-buildButton", Global.mainFace.node,null, {id:i+1001});
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
//初始化建筑数据库 [是否解锁，等级]

const initBuild = () => {
    let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
    tempDB = [[1,0]]
    for(let k in bcfg){
        tempDB.push([0,0]);
    }
    
    DB.init("build", tempDB);
};
DB.init("hotel",{date:0,price:10});
//注册页面打开事件
AppEmitter.add("intoBuild",(node)=>{
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