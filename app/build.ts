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
import Global from './global';

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
    static res_name = ["food","wood",]  //资源名
    static res_Cname = ["粮食","木材","黄金","科技"]
    static build_sprite =[]
    static cur_buildId = 0


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
/**
 * @description  建筑按钮组件
 */
class WbuildButton extends Widget{
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
        Scene.open(`app-ui-combuildWindow`,Global.mainFace.node, null, {id:type});
    }

    added(node){   
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
                    let MNode = Scene.open("app-ui-message", Scene.root,null,{text:"资源不足！"});
                    setTimeout(() => {
                        Scene.remove(MNode);
                    }, 500);
                    return console.log(data.err.reson);
                }
                for(let i=0;i<effect.length;i++){
                    DB.data[effect[i][0]][effect[i][1]][effect[i][2]] = data.ok[2][i];
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
        this.node = node;
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
//初始化建筑数据库 [是否解锁，等级]
DB.init("build",[[1,0],[0,0]]);
const initBuild = () => {
    let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
    tempDB = []
    for(let k in bcfg){
        tempDB.push([0,0]);
    }
    
    DB.init("build", tempDB);
};
initBuild();
//注册页面打开事件
AppEmitter.add("intoBuild",(node)=>{
    open();
});

//建筑注册监听

for(let i = DB.data.build.length - 1; i >= 0; i--){
    for(let j =0;j<2;j++){
        DB.emitter.add(`build.${i}.${j}`, ((x,y) => {
            return ()=>{
                Build.updateBuild(x,y)
            }
        })(i,j));
    }
}   