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
import Music from '../libs/ni/music';

/****************** 导出 ******************/

/****************** 本地 ******************/

class Science {
    static width = 0
    static height = 0
    static  science =[[],[],[]] //知识节点
    static  com_name // 通用窗口名字节点
    static  com_effect // 通用窗口效果节点
    static  com_cost// 通用窗口消耗节点
    static  sci_number //掌握科技数量节点
    static  sci_num  //掌握科技数量
    static sci_max //科技总值
    static science_sprite =[]
    static cur_scienceId = 0
    static coordinate = {left:[0,0,0,0,0,300,0,300],top:[0,200,400,600,300,300,450,450]}//知识按钮坐标
    static unlock_science = []
    static scienceNode = []
    static textNode = []


    //更新知识数量
    static updateScience(id,type){
        if(type ==0){
            if(DB.data.science[id][0]==1 && Global.mainFace.id ==0 && Science.unlock_science.indexOf(id+100) == -1){
                Science.unlock_science.push(id+100);
                Science.updateScienceButton();
            }
        }
        if(type ==1){
            if(DB.data.science[id][1] && Global.mainFace.id == 0 && Science.unlock_science.indexOf(id+100) > -1){
                Science.unlock_science.splice(Science.unlock_science.indexOf(id+100),1);   
                Science.updateScienceButton();        
            }
        }
    }
    //更新知识按钮
    static updateScienceButton(){
        for(let k = Science.scienceNode.length-1;k>=0;k-- ){
            Scene.remove(Science.scienceNode[k])
            Science.scienceNode.splice(k,1);
        }
        for(let i=0;i<Science.unlock_science.length;i++){
            Science.scienceNode[i]=Scene.open("app-ui-scienceButton", Global.mainFace.node,null, {id:Science.unlock_science[i],coordinate:i});
        }
    }    
        //按钮颜色改变
        static updatebutton(){
            if(Global.mainFace.id ==0){
                for(let i =0;i<DB.data.science.length;i++){
                    if(DB.data.science[i][0]>=1){
                        let bcfg = CfgMgr.getOne("app/cfg/science.json@science"),
                        id = i+100,
                        cost = bcfg[id][`cost`],
                        enough = 1
    
                        if(DB.data.res.sci[1]<cost){
                            enough = 0
                        }
                        if(Science.textNode[i] && Science.textNode[i].style.fill != Global.color[enough]){
                            Science.textNode[i].style.fill = Global.color[enough];
                        }
                        if(id == Science.cur_scienceId && Science.com_cost){
                            if(Science.com_cost.style.fill != Global.color[6-enough*4]){
                                Science.com_cost.style.fill = Global.color[6-enough*4];
                            }
                        }              
                    }else{
                        break;
                    }
                }
            }
        }   
}



/**
 * @description  知识按钮组件
 */
class WscienceButton extends Widget{
    backNode:any
    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/science.json@science"),
            id = props.id,
            name = bcfg[id]["name"],
            cost = bcfg[id][`cost`],
            color = 0
        this.cfg.data.left = Math.floor(Scene.screen.width - this.cfg.data.width)/2  
        this.cfg.children[0].data.text = `${name}`;
        this.cfg.data.top =  Science.coordinate.top[props.coordinate]+400;
        this.cfg.on = {"tap":{"func":"unlockScience","arg":[id]}};

        //消耗加颜色
        if(cost <= DB.data.res.sci[1]){
            color += 1
        }
        this.cfg.children[0].data.style.fill = Global.color[color];
    }

    unlockScience(type){
        Music.play("audio/but.mp3");
        AppEmitter.emit("stagePause");
        this.backNode = Scene.open(`app-ui-back`,Scene.root);
        Scene.open(`app-ui-comscienceWindow`,this.backNode, null, {id:type,backNode:this.backNode});
    }

    added(node){   
        Science.textNode[node.widget.props.id-100] =  this.elements.get("button_sci");
    }
}


/**
 * @description  知识界面组件
 */
class WScience extends Widget{
    setProps(props){
        super.setProps(props);
        this.cfg.children[1].data.text = `${Science.sci_num}/${Science.sci_max}`;
        this.cfg.children[3].data.width = 380 + Scene.screen.width -750
    }
    added(node){
        Science.sci_number = this.elements.get("sci_number");
    }
}

//知识弹窗
class WcomWindow extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/science.json@science"),
            id = props.id,
            cost = bcfg[id][`cost`],  
            color = 6

        this.cfg.data.left = Math.floor(Scene.screen.width - this.cfg.data.width)/2  
        this.cfg.children[1].data.text = `${bcfg[id]["name"]}`;
        this.cfg.children[4].data.text = `${bcfg[id]["effect_dis"]}`;
        this.cfg.children[7].data.text = `${cost}知识`;
        this.cfg.children[9].data.text = `${bcfg[id]["dis"].replace(/\\n/,"\n")}`;
        Science.cur_scienceId = id

        //消耗加颜色
        if(cost <= DB.data.res.sci[1]){
            color = 2
        }
        this.cfg.children[7].data.style.fill = Global.color[color];
       
    }
    levelup(){
        let id = Science.cur_scienceId,
        bcfg = CfgMgr.getOne("app/cfg/science.json@science"),
        cost = bcfg[id][`cost`],  
        effect = bcfg[id]["effect_type"]
       
            Connect.request({type:"app/science@unlock",arg:id},(data) => {
                if(data.err){
                    AppEmitter.emit("message","知识不足！");
                    return console.log(data.err.reson);
                }else{
                    for(let i=0;i<effect.length;i++){
                        DB.data[effect[i][0]][effect[i][1]][effect[i][2]] = data.ok[2][i];
                    }   
                    DB.data.science[id-100][1] = data.ok[0];
                    DB.data.res.sci[1] = data.ok[1];
    
                    //更新窗口信息
                    this.remove();
                    AppEmitter.emit("stageStart");
                    Science.com_name.text = `${bcfg[id]["name"]}`;
                    Science.com_effect.text = `效果：${bcfg[id]["effect_dis"]}`;
                    Science.com_cost.text = `消耗：${cost}知识`;
                    Science.sci_num += 1;
                    Science.sci_number.text = `${Science.sci_num}/${Science.sci_max}`;
                }
            })           
    } 
    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = this.props.backNode;
        Science.com_name = this.elements.get("name");
        Science.com_effect = this.elements.get("effect");
        Science.com_cost = this.elements.get("cost");
    }
} 

/**
 * @description 打开知识界面
 */
const open = () => {
    Science.sci_num = 0
    Science.sci_max = DB.data.science.length -1
    Global.mainFace.id = 0;
    Science.unlock_science = []
    //显示解锁的知识按钮
    for(let i=0; i<DB.data.science.length;i++ ){
        if(DB.data.science[i][0] >=1 && !DB.data.science[i][1]){
            Science.unlock_science.push(i+100);
        }
        if(DB.data.science[i][1]>=1){
            Science.sci_num +=1;
        }
    }
    Global.mainFace.node = Scene.open("app-ui-science", Scene.root);
    Science.updateScienceButton(); 
    
}



/****************** 立即执行 ******************/
//注册组件
Widget.registW("app-ui-science",WScience);
Widget.registW("app-ui-comscienceWindow",WcomWindow);
Widget.registW("app-ui-scienceButton",WscienceButton);
//初始化知识数据库 [是否解锁，等级]
const initScience = () => {
    let bcfg = CfgMgr.getOne("app/cfg/science.json@science"),
    tempDB = [[1,0]]
    for(let k in bcfg){
        tempDB.push([0,0]);
    }    
    DB.init("science", tempDB);
};

//注册页面打开事件
AppEmitter.add("intoScience",(node)=>{
    open();
});


//知识注册监听
const emtScience = () => {
    for(let i = DB.data.science.length - 1; i >= 0; i--){
        for(let j =0;j<2;j++){
            DB.emitter.add(`science.${i}.${j}`, ((x,y) => {
                return ()=>{
                    Science.updateScience(x,y)
                }
            })(i,j));
        }
    } 
}  

//重新开始，重置数据库
AppEmitter.add("initDB",(node)=>{
    initScience();
    emtScience();
});

//注册消耗知识监听
DB.emitter.add(`res.sci.1`, () => {
    Science.updatebutton()
});
