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
import {addNews} from './stage';
import Music from '../libs/ni/music';
/****************** 导出 ******************/

/****************** 本地 ******************/
let cityNumberNode, // 占领城市节点
    mul = 3  //武将兵种数值系数
class Map {
    
    static city_sprite = []  //据点精灵
    static armyNode = []  //敌军描述节点
    static tipsNode   //tips描述节点


    static initDB(){
        //初始化敌军数据库guard: [[[据点ID],[将领id,人数],[将领id,人数]],..]
        //city:[占领城市数量，，所有建筑数量，每个城市增加的建筑,被占领城市数量,初始建筑数量上限]
        DB.init("map",{date:[1],city:[1,10000,0,15,0,100],attack:[0],guard:[]});
    }
    //更新据点
    static updateGuard(){
        let time = [15,50,100]
        let newDate =DB.data.date.day[0]+Math.ceil(time[DB.data.map.guard.length]*((700+rand(600))/1000))
        //更新下一次时间
        if( (newDate < DB.data.map.date[0] || DB.data.map.date[0] <= DB.data.date.day[0])&& DB.data.map.guard.length<3 ){
            Connect.request({type:"app/map@date_update",arg:newDate},(data) => {
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
            if(!DB.data.map.guard[0]){
                Map.tipsNode.text = "请等待斥候探查情报"; 
            }else{
                Map.tipsNode.text = "";
            }

        }
    } 
    static updateCity(){
        if(Global.mainFace.id ==4){
            let st =""
            if(DB.data.map.city[4]){
                st = `(${-DB.data.map.city[4]})`
                cityNumberNode.style.fill = Global.color[6]
            }
            cityNumberNode.text = `${DB.data.map.city[0]}${st}/179` ; 
        }
    }

}



/**
 * @description  地图界面组件
 */
class WMap extends Widget{
    setProps(props){
        super.setProps(props);
        let st =""
        if(DB.data.map.city[4]){
            st = `(${-DB.data.map.city[4]})`
            this.cfg.children[1].data.style.fill = Global.color[6]
        }
        this.cfg.children[1].data.text = `${DB.data.map.city[0]}${st}/179` ;
        if(!DB.data.map.guard[0]){
            this.cfg.children[5].data.text = "请等待斥候探查情报"; 
        }
        this.cfg.children[4].data.width = 325 + Scene.screen.width -750
    }

    added(node){
        cityNumberNode = this.elements.get("city_number");
        Map.tipsNode = this.elements.get("tips");
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
            str2 = "",
            color
        //判断城市还是随机据点
        if(id<20000){
            bcfg = CfgMgr.getOne("app/cfg/city.json@city")
        }else{
            bcfg = CfgMgr.getOne("app/cfg/city.json@rand")

        }   

        str2 = bcfg[id]["reward_dis"];
        str2 = str2.replace("{{city_num}}",DB.data.map.city[3])
        this.cfg.children[1].data.text = `${bcfg[id]["name"]}`;
        if(bcfg[id]["belong"]){
            this.cfg.children[2].data.text = `（${bcfg[id]["belong"]}）`;
        }else{
            this.cfg.children[2].data.text = "";
        }
        //驻守军队
        for(let i = 1;i< army.length;i++){
            this.cfg.children[2 + i].data.text = `${bcfg2[army[i][0]]["name"]}(${army[i][1]}${Cname[bcfg2[army[i][0]]["arms"]]})`;
            color = bcfg2[army[i][0]]["color"]
            this.cfg.children[2 + i].data.style.fill = Global.color[color]
        }

        this.cfg.children[6].data.text = `${str2.replace(/\\n/,"\n")}`;

        this.cfg.data.left =  (Scene.screen.width - 660)/4 * (props.index+1) +  220*props.index;
        this.cfg.on = {"tap":{"func":"choose","arg":[id]}};
       
    }
    choose(id){
        Music.play("audio/but.mp3");
        if(DB.data.army.cur[0]<DB.data.army.total[0]){
            AppEmitter.emit("stagePause");
            this.backNode = Scene.open(`app-ui-back`,Scene.root);
            Scene.open("app-ui-fightWindow", this.backNode,null,{id:this.props.id,index:this.props.index,backNode:this.backNode});
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
            army = [],
            str1 = "",
            str2 = "",
            max =  0 ,
            name 

        this.cfg.data.left = Math.floor((Scene.screen.width - this.cfg.data.width)/2)
        //暂停时间    
        AppEmitter.emit("stagePause");
        //判断是进攻还是被入侵
        if(props.index>=0){
            army = DB.data.map.guard[props.index]
        }else{
            army = JSON.parse(JSON.stringify(DB.data.hero.enemy));
            army.unshift([]);
        }
         //判断城市还是随机据点
        if(id<20000){
            bcfg = CfgMgr.getOne("app/cfg/city.json@city")
        }else{
            bcfg = CfgMgr.getOne("app/cfg/city.json@rand")
        }  

        if(props.name){
            name = props.name
        }else{
            name = bcfg[id]["name"]
        }
        //我军上阵
        for(let i=0;i < DB.data.hero.own.length;i++){
            if(DB.data.hero.own[i][1]>0){
                str1 = `${str1}\n${bcfg2[DB.data.hero.own[i][0]]["name"]}(${DB.data.hero.own[i][1]}${Cname[bcfg2[DB.data.hero.own[i][0]]["arms"]]})`
                max += 1;
                if(max == DB.data.hero.MaxHero[0]){
                    break;
                }
            }   
        }
        //敌军上阵
        for(let i=1;i< army.length;i++){
            str2 = `${str2}\n${bcfg2[army[i][0]]["name"]}(${army[i][1]}${Cname[bcfg2[army[i][0]]["arms"]]})`
        }

        //迎战界面
        if(props.index == -2){
            this.cfg.children[5].props.text = "迎战"
            this.cfg.children[5].props.left = 150
            this.cfg.children[6].props.left -= 1000
            this.cfg.children[7].data.alpha = 1
        }

        this.cfg.children[1].data.text = `${name}`;
        this.cfg.children[2].children[0].data.text = `我军${str1}`;
        this.cfg.children[3].children[0].data.text = `敌军${str2}`;

    }
    fight(){

        //判断是否有军队
        if(DB.data.army.cur[0]<DB.data.army.total[0]){
            let own =[],
                bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
                bcfg2 = CfgMgr.getOne("app/cfg/city.json@city"),
                bcfg4 = CfgMgr.getOne("app/cfg/city.json@army"),
                max =  0,
                army = []
            
            if(this.props.index>=0){
                army = DB.data.map.guard[this.props.index]
            }else{
                army = JSON.parse(JSON.stringify(DB.data.hero.enemy));
                army.unshift([]);
            }

            for(let i=0;i < DB.data.hero.own.length;i++){
                if(DB.data.hero.own[i][1]>0){
                    if(!own[max]){own[max] = []}
                    own[max][0] = DB.data.hero.own[i][0]
                    own[max][1] = DB.data.hero.own[i][1]
                    own[max][4] = bcfg[own[max][0]]["arms"]
                    own[max][2] = 1 + (Math.floor(bcfg[own[max][0]]["number"]+DB.data.hero.own[i][2]+DB.data.hero.add[own[max][4]])*mul)/100 
                    own[max][3] = DB.data.hero.own[i][3]
                    max += 1;
                    if(max == DB.data.hero.MaxHero[0]){
                        break;
                    }
                }
            }


            let enemy = []
            for(let i=0;i < army.length-1;i++){
                if(!enemy[i]){enemy[i] = []}
                enemy[i][0] = army[i+1][0]
                enemy[i][1] = army[i+1][1]
                //判断是否是城市
                if(this.props.id < 19999){
                    enemy[i][2] = 1 + bcfg[enemy[i][0]]["number"]/100 + bcfg2[this.props.id]["attribute"]
                }else{
                    enemy[i][2] = 1 + (bcfg[enemy[i][0]]["number"]/100 + bcfg4[Math.ceil(DB.data.date.day[0]/400)] ["attribute"])*mul
                }
                //动态调整
                if(this.props.id == 19999){
                    enemy[i][2] += Math.floor(DB.data.hero.add[0] /4)/100 *mul
                }
                enemy[i][3] = i
                enemy[i][4] = bcfg[enemy[i][0]]["arms"]
            }
            Scene.remove(Global.mainFace.node); 
            AppEmitter.emit("intoFight",{fighter:[own,enemy],city:this.props.id,enemyType:this.props.index});
            this.remove();
        }else{
            AppEmitter.emit("message",`无可出战的军队！`);
        }

    } 
    remove(){
        Scene.remove(this.node);   
    } 
    //投降
    lose(){
        Connect.request({type:"app/fight@lose",arg:[]},(data) => {
            if(data.err == 1){
                Connect.request({type:"app/circle@putin",arg:[]},(data) => {
                    if(data.err){
                        return console.log(data.err.reson);
                    }else{
                        DB.data.circle = data.ok[0];
                        DB.data.date.day[0] = data.ok[1];
                    }
                })
                Scene.open("app-ui-result", Scene.root,null,{id:0});
            }else{
                DB.data.map.attack[0] = 0
                DB.data.map.city[4] = data.ok[0]
                DB.data.res.fail[1] = data.ok[1]
                DB.data.res.win[1] = data.ok[2]
                AppEmitter.emit("stageStart");
                addNews(`6割让边境${DB.data.map.city[4]}城。(败绩+50)`);
                let  bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
                name = DB.data.hero.own[0]?bcfg[DB.data.hero.own[0][0]]["name"]:"军备官"
                if(DB.data.hero.own[0]){
                    addNews(`${name}：此诚危急存亡之秋也。望主公尽快组织反攻，不可懈怠！`);
                }
                this.remove();
            }
        })

    } 

    added(node){
        this.node = this.props.backNode;
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
}



/****************** 立即执行 ******************/
//注册组件
Widget.registW("app-ui-map",WMap);
Widget.registW("app-ui-fightWindow",WfightWindow);
Widget.registW("app-ui-city",WCity);



//注册页面打开事件
AppEmitter.add("intoMap",(node)=>{
    open();
});


//监听据点
DB.emitter.add(`map.guard`, () => {
    Map.updateGuard();
});

//监听占领城市
DB.emitter.add(`map.city.0`, () => {
    Map.updateCity();
});
DB.emitter.add(`map.city.4`, () => {
    Map.updateCity();
});
//初始化数据库
AppEmitter.add("initDB",(node)=>{
    Map.initDB();
});