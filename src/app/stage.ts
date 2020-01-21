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
export const addNews = (news) => {
    if(DB.data.news[0].length<25){
        DB.data.news[0].unshift(news);
    }else{
        DB.data.news[0].splice(-1,1);
    }
    Stage.change_Newsface(0);
}
export const addFNews = (news) => {
    if(DB.data.news[1].length<25){
        DB.data.news[1].unshift(news);
    }else{
        DB.data.news[1].splice(-1,1);
    }
    Stage.change_Newsface(1);
}
/****************** 本地 ******************/
let stageNode, // 关卡渲染节点
    startNode, // 开始游戏界面
    circleNode, // 轮回商店界面
    circleFaceNode //轮回购买界面


class Stage {
    static width = 0
    static height = 0
    /**
     * @description 自己
     */
    // static self: Shap
    // //自己的默认移动速度

    static svx = -7


    static insertTimer
    //down
    static down = 0
    //up
    static up = 0
    //shap id
    static id = 1
    static pause = 1
    static  res={food:[],wood:[],sci:[],gold:[],win:[],fail:[]}// 资源节点
    static  build =[[]] //建筑节点
    static  com_name // 通用窗口名字节点
    static  com_effect // 通用窗口效果节点
    static  com_cost// 通用窗口消耗节点
    static day //日期节点
    static year //年份节点
    static res_name = ["food","wood","sci","gold","win","fail"] 
    static work_name = ["total","food","wood","sci","gold"]  //资源名
    static five = ["金","木","水","火","土"]
    static five_res = [[0,0,0,0.5],[0,0.5,0,0],[0,0,0.5,0],[-0.25,0,0,0],[0.5,0,0,0]]
    static res_Cname = ["粮食","木材","知识","黄金","胜绩","败绩"]
    static season_Cname = ["春","夏","秋","冬"] 
    static face_name =["sceince","people","build","army","map"]
    static dayTime = 1500
    static nextDay = 0
    static resSprite = []
    static messageList = []
    static hungry = ["仓无粮。","地荒，无粮。","大荒。","饿殍满地。","大饥，人相食。"]


    static time 
    static timeInterval =  500; //增加资源的时间间隔
    static newsNode =[]; //新闻节点
    static newsFace = 0   //0-新闻，1-战报
    static news_change = []
    static face_button = []
    static pause_button
    static restart_button
    static warning_button
    static shopText = [[],[],[]] //轮回商店说明节点

    static initDB(){
        //初始化资源数据库表[[是否解锁，数量,最大值,增加量,增加量系数(季节),减少量，减少量系数],[]]
        DB.init("res",{food:[1,0,5000,0,0,0,0],wood:[0,0,600,0,0,0,0],sci:[0,0,100,0,0,0,0],gold:[1,600,600,0,0,0,0],win:[0,0,200,0,0,1,0],fail:[0,0,200,0,0,1,0]});
        DB.init("date",{unlock:[0,0],day:[0]});
        //主界面解锁
        DB.init("face",{"unlock":[0,0,1,1,1]});
        DB.init("event",{"next":[2001]});

        DB.init("news",[[],[]]);//新闻
    }

    //更新消息显示
    static updateMessage(message){
        let MNode = Scene.open("app-ui-message", Scene.root,null,{text:message});
        Stage.messageList.push(MNode);
        setTimeout(() => {
            Stage.messageList.splice(Stage.messageList.indexOf(MNode),1);
            Scene.remove(MNode);
        }, 1500);
    }

    static runMessage(){
        for(let i=0;i<Stage.messageList.length;i++){
            Stage.messageList[i].y -= 1.2
            Stage.messageList[i].alpha -= 0.007
        }
    }

    //更新预警
    static updateWarning(){
        let text = ""

        if(DB.data.hero.enemy.length){
            text = "被入侵"
            Stage.warning_button.style.fill = Global.color[6]
            Stage.warning_button.ni.left = 30
        }else if(DB.data.date.warning[1] && DB.data.date.warning[0]){
            text = `${DB.data.date.warning[1] - DB.data.date.day[0]}天敌袭`
            Stage.warning_button.style.fill = Global.color[6]
            Stage.warning_button.ni.left = 10
        }else{
            text = "和平"
            Stage.warning_button.style.fill = Global.color[5]
            Stage.warning_button.ni.left = 45
        }
        Stage.warning_button.text = text;
    }

    //更新消息显示
    static updateNews(){
        let type = Stage.newsFace
        let len = DB.data.news[type].length
        if(len < 7){
            for(let i=0;i<len;i++){
                let news = DB.data.news[type][len-1-i],
                    color =parseInt(news[0])
                if(!isNaN(color)){
                    Stage.newsNode[i].style.fill = Global.color[color]
                    Stage.newsNode[i].text = news;
                    Stage.newsNode[i].text = Stage.newsNode[i].text.substring(1);
                }else{
                    Stage.newsNode[i].style.fill = Global.color[1]
                    Stage.newsNode[i].text = news;
                }
            }
            for(let i=len;i<7;i++){
                Stage.newsNode[i].text = ""
            }
        }else{
            for(let i=0;i<7;i++){
                let news = DB.data.news[type][6-i],
                    color =parseInt(news[0])
                if(!isNaN(color)){
                    Stage.newsNode[i].style.fill = Global.color[color]
                    Stage.newsNode[i].text = news;
                    Stage.newsNode[i].text = Stage.newsNode[i].text.substring(1);
                }else{
                    Stage.newsNode[i].style.fill = Global.color[1]
                    Stage.newsNode[i].text = news;
                }


            }
        }

        if(type && !len){
            Stage.newsNode[0].text = "5幸无战事,得以休想生息。"
        }
    }
    static Newscolor(){

    }

    //更新资源显示
    static updateRes(res_nameID,idType){
        let name = Stage.res_name[res_nameID],
            res = DB.data.res[name],
            mun = res[idType],
            people = DB.data.people[name]
        //解锁新资源
        if(idType ==0 && DB.data.res[name][0]>=1 && !Stage.resSprite[res_nameID]){
            Stage.resSprite[res_nameID] = Scene.open("app-ui-res", stageNode,null,{id:res_nameID});
        }
        //胜败绩根据其资源数值显示和消失
        if(idType == 1 && res_nameID >3){
            if(mun){
                if(!Stage.resSprite[res_nameID]){
                    Stage.resSprite[res_nameID] = Scene.open("app-ui-res", stageNode,null,{id:res_nameID});
                }
            }else{
                if(Stage.resSprite[res_nameID]){
                    Scene.remove(Stage.resSprite[res_nameID]);
                }
            }
        }
          
        if((idType ==1 || idType == 2|| idType == 4)&&( Stage.res[name][idType]!= undefined) ){
            Stage.res[name][idType].text = `${mun.toFixed(1)}` ;
        }

        //计算加成
        let  times = 1

        if(res_nameID < 4 ){
            if(DB.data.res.win[1] >0){
                times += 0.5;
            }
            if(DB.data.res.fail[1] >0){
                times += -0.25;
            }
            let five = Math.ceil(DB.data.date.day[0]/400) % 5,
                five_times = Stage.five_res[five][res_nameID]
            if(DB.data.date.unlock[1] && five_times){
                times += five_times 
            }
        }

        //增加或减少百分比
        if((idType == 4)&&( Stage.res[name][idType]!= undefined) ){
            if(mun>0){
                Stage.res[name][idType].text = `+${mun.toFixed(1)*100}%` ;
            }else{
                Stage.res[name][idType].text = `${mun.toFixed(1)*100}%` ;
            }
        }
        if(idType >2){
            if(Stage.res[name][7] != undefined){
                let change = (res[3]) * (res[4]+1)+people[1]*people[2]*(1+people[3])-  res[5] *(1+res[6])
                change = change * times;
                if (change>=0){
                    Stage.res[name][7].text = `+${change.toFixed(1)}/秒`;
                }else{
                    Stage.res[name][7].text = `${change.toFixed(1)}/秒`;
                }
            }
        }
        

    }

    //地图添加据点
    static guardAdd(){
        if(DB.data.date.day[0]==DB.data.map.date[0]){
            let bcfg = CfgMgr.getOne("app/cfg/city.json@city"),
                bcfg1 = CfgMgr.getOne("app/cfg/city.json@rand")
            Connect.request({type:"app/map@guard_add",arg:{}},(data) => {
                if(data.err){
                    return console.log(data.err.reson);
                }
                DB.data.map.guard = data.ok[0];
                if(data.ok[1]<20000){
                    addNews(`斥候已经侦察好了前往${bcfg[data.ok[1]]["name"]}的道路。`);
                }else{
                    addNews(bcfg1[data.ok[1]]["dis"]);
                }

            })
        }
    }


    //事件触发
    static eventTrigger(){
        let date = DB.data.date.day[0]
        if(DB.data.event.next[0]){
            let eventId = DB.data.event.next[0],
                bcfg = CfgMgr.getOne("app/cfg/event.json@event"),
                eventDate = bcfg[`${eventId}`]["date"],
                news = bcfg[eventId]["dis"]


            if(date == eventDate){
                DB.data.event.next[0] = eventId +1;
                Connect.request({type:"app/event@eventtrigger",arg:eventId},(data) => {
                    if(data.err){
                        return console.log(data.err.reson);
                    }
                    if(bcfg[eventId]["class"] == 1 ){
                        DB.data.hero.enemy = data.ok[0];          
                    }else{
                        DB.data[bcfg[eventId].type[0]][bcfg[eventId].type[1]][bcfg[eventId].type[2]] = data.ok[0];
                    }
                    if(news){
                        news = news.replace("{{number}}",bcfg[eventId]["number"])
                        addNews(news);   
                    }
                })
                    //成功触发则立刻查看下一个事件是否可触发
                Stage.eventTrigger();
         } 
        }
        //自动增减人口

        if(date%2 == 0) {
            Connect.request({type:"app/people@changepeople",arg:{}},(data) => {
                if(data.err){
                    return console.log(data.err.reson);
                }
                if(data.ok[1]!=0){
                    DB.data.people[Stage.work_name[data.ok[2]]][data.ok[3]] = data.ok[0];
                }       
                if(data[1] ==1){
                    let str =""
                    addNews("一位流民在此定居。（人口+1）")
                }
                if(data[1] ==-1){
                    addNews(`${Stage.hungry[rand(Stage.hungry.length)-1] }（人口-1）`)
                }
            })         
        }

        //每季度刷新市场的价格
        if(Math.ceil(date/100) > DB.data.shop.date[0]){
            Connect.request(
                {type:"app/shop@updateShop",arg:{}},
                (data) => {
                    let res = ["粮食","木材","知识"]
                    if(data.err){
                        return console.log(data.err.reson);
                    }
                    DB.data.shop.price = data.ok[1];
                    DB.data.shop.date[0] = data.ok[2]
                    if(data.ok[0]<3){
                        addNews(`市场中的${res[data.ok[0]]}似乎卖得很便宜。`)
                    }else{
                        addNews(`有外来商贾高价收购${res[data.ok[0]-3]}。`)
                    }
                }
            )        
        }

        //显示加成的文字
        let addtion = [[],[],[],[]],
            res = DB.data.res
        if(res.food[4]){
            let str = res.food[4]>0?"春":"冬"
            addtion[0].push([`${str}`,res.food[4]>0?2:6]);
        }
        for(let i=0;i<4;i++){
            let name = Stage.res_name[i]
            if(DB.data.res.win[1] >0){
                addtion[i].push(["胜",2]);
            }
            if(DB.data.res.fail[1] >0){
                addtion[i].push(["败",6]);
            }
            let five = Math.ceil(DB.data.date.day[0]/400) % 5,
                five_times = Stage.five_res[five][i]
            if(DB.data.date.unlock[1] && five_times){
                addtion[i].push([`${Stage.five[five]}`,five_times>0?2:6]);
            }
        
            for(let j=0;j<3;j++){
                if(Stage.res[name][10+j]){
                    if(addtion[i][j]){
                        Stage.res[name][10+j].text = addtion[i][j][0];
                        Stage.res[name][10+j].style.fill =  Global.color[addtion[i][j][1]];           
                    }else{
                        Stage.res[name][10+j].text = ""
                    } 
                }
            }
        }        

    }
    //资源自动变化
    static ChangeResource(typename){
        Connect.request({type:"app/res@add",arg:typename},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }
            DB.data.res[typename][1] = data.ok;
        })
        
    }
       
       

    
    static run(){
        if(Date.now()>Stage.time){
            for(let i = Stage.res_name.length - 1; i >= 0; i--){
                Stage.ChangeResource(Stage.res_name[i]);
            }  
            Connect.request({type:"app/hero@hurt",arg:[]},(data) => {
                if(data.err){
                    return console.log(data.err.reson);
                }
                DB.data.hero.own = data.ok[0];
            })
            Stage.time +=Stage.timeInterval;
        }
        //处理弹出消息
        Stage.runMessage();

//时间变化
        if(Date.now()>Stage.nextDay){
            let season
            Connect.request({type:"app/date@update",arg:{}},(data) => {
                if(data.err){
                    return console.log(data.err.reson);
                }
                DB.data.date.day[0] = data.ok[0];
                if (DB.data.res.food[4]!=data.ok[1]){
                    DB.data.res.food[4]=data.ok[1]
                }
                season = Stage.season_Cname[Math.floor(DB.data.date.day[0]/100) % 4];
                if(DB.data.date.unlock[0]){
                    Stage.year.text =  `第${Math.ceil(DB.data.date.day[0]/400)}年`
                    if(DB.data.date.unlock[1]){
                        Stage.year.text =  `${Stage.five[Math.ceil(DB.data.date.day[0]/400) % 5]}第${Math.ceil(DB.data.date.day[0]/400)}年`
                    }
                }
                Stage.day.text = `${season} ${DB.data.date.day[0] % 100}天`
                //新年弹出新闻信息
                if(DB.data.date.day[0] % 400 == 1){
                    addNews(`5--------------第${Math.ceil(DB.data.date.day[0]/400)}年-------------`)
                }
            })
            Stage.nextDay += Stage.dayTime; 
        }
 
    }

    static change_Newsface(faceID){
        if(Stage.newsFace != faceID){
            Stage.news_change[faceID]["alpha"] = 0
            Stage.news_change[Stage.newsFace]["alpha"] = 1
            Stage.news_change[2+faceID]["alpha"] = 1
            Stage.news_change[2+Stage.newsFace]["alpha"] = 0
            Stage.newsFace = faceID;
            Stage.updateNews();
        }
    }

   
}
/**
 * @description  关卡界面组件
 */
class WBack extends Widget{
    node: any
    remove(){
        Scene.remove(this.node);  
        start(); 
    }  
    added(node){
        this.node = node;
    }
}
/**
 * @description  消息组件
 */
class WMessage extends Widget{
    setProps(props){
        super.setProps(props);
        this.cfg.data.text = props.text;    
    }
}
/**
 * @description  新闻框组件
 */
class WNews extends Widget{
    added(node){
       for(let i=1;i<8;i++){
           Stage.newsNode[i-1] = this.elements.get(`text${i}`);
       }
       Stage.news_change[0] = this.elements.get("off0");
       Stage.news_change[1] = this.elements.get("off1");
       Stage.news_change[2] = this.elements.get("on0");
       Stage.news_change[3] = this.elements.get("on1");

    }
    //消息和战报切换
    change(faceID){
        Stage.change_Newsface(faceID);
    }
}
/**
 * @description  资源显示组件
 */
class WRes extends Widget{
    backNode :any
    setProps(props){
        super.setProps(props);
        let id = props.id,
            name = Stage.res_name[id],
            Cname =Stage.res_Cname[id],
            res = DB.data.res[name],
            people = DB.data.people[name],
            addtion = []
  
        this.cfg.children[1].data.text = `${Cname}:`;
        this.cfg.children[2].data.text = DB.data.res[name][1];
        this.cfg.children[4].data.text = DB.data.res[name][2];
        let change = (res[3]) * (res[4]+1)+people[1]*people[2]*(1+people[3])-  res[5] *(1+res[6]),
        times = 1
        
        if(res[4]){
            let str = res[4]>0?"春":"冬"
            addtion.push([`${str}`,res[4]>0?2:6]);
        }


//胜败和五行影响
        if(id < 4 ){
            if(DB.data.res.win[1] >0){
                times += 0.5;
                addtion.push(["胜",2]);
            }
            if(DB.data.res.fail[1] >0){
                times += -0.25;
                addtion.push(["败",6]);
            }
            let five = Math.ceil(DB.data.date.day[0]/400) % 5,
                five_times = Stage.five_res[five][id]
            if(DB.data.date.unlock[1] && five_times){
                times += five_times 
                addtion.push([`${Stage.five[five]}`,five_times>0?2:6]);
            }
            change = change * times;
        }

        if (change>=0){
            this.cfg.children[5].data.text = `+${change.toFixed(0)}/秒`;
        }else{
            this.cfg.children[5].data.text = `${change.toFixed(0)}/秒`;
        }
        for(let i=0;i<addtion.length;i++){
            this.cfg.children[6+i].data.text = addtion[i][0];
            this.cfg.children[6+i].data.style.fill =  Global.color[addtion[i][1]];
        }
 

        this.cfg.data.top = Math.min(id*50 +30,230);
        this.cfg.children[0].on = {"tap":{"func":"dis_res","arg":[id]}};  
    }
    dis_res(type){
        pause();
        this.backNode = Scene.open(`app-ui-back`,Global.mainFace.node);
        Scene.open(`app-ui-resDis`,this.backNode, null, {id:type});
    }
    added(node){
        let name = Stage.res_name[this.props.id]
        Stage.res[name][1] = this.elements.get("number");
        Stage.res[name][2] = this.elements.get("max");
        Stage.res[name][7] = this.elements.get("change");
        Stage.res[name][10]=  this.elements.get("addtion0");
        Stage.res[name][11]=  this.elements.get("addtion1");
        Stage.res[name][12]=  this.elements.get("addtion2");      
    }
}
/**
 * @description  资源显示组件
 */
class WConfirm extends Widget{
    node:any
    setProps(props){
        super.setProps(props);
        this.cfg.children[2].data.text = `${props.text}`;
        this.cfg.children[3].props.on =  {"tap":{"func":`${props.on}`,"arg":props.arg}};
    }
//将领革职
    hero_delete(id){
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
        name = bcfg[DB.data.hero.own[id][0]]["name"]
        Connect.request({type:"app/army@hero_delete",arg:[id]},(data) => {
            let text = ["叹主不公，积怨成疾，郁郁而终。","被贬，翌日愤懑出走，不知所踪。","听闻被贬，不发一言，拂袖而去。"]

             DB.data.hero.own = data.ok[0];
             DB.data.army.cur[0] = data.ok[1];
             DB.data.hero.MaxHero[2] = data.ok[2];
             this.remove();
             AppEmitter.emit("message",`${name}已被革职！`);
             addNews(`${name}${text[rand(text.length)-1]}`)
             Scene.remove(Global.mainFace.node);
             AppEmitter.emit("intoArmy");
        })
    }
    remove(){
        Scene.remove(this.node);
    }
    added(node){
        this.node = node;
    }
}
/**
 * @description  资源详情显示组件
 */
class WResdis extends Widget{
    node:any
    setProps(props){
        super.setProps(props);
        let id = props.id,
            name = Stage.res_name[id],
            Cname =Stage.res_Cname[id],
            res = DB.data.res[name],
            people = DB.data.people[name],
            dis = []

        dis.push([`${Cname}`,`(${res[1]}/${res[2]})`])
        if(res[3]){
            dis.push(["果园生产：",`+${res[3]*(res[4]+1)}/秒`]);
        }
        if(people[1]){
            dis.push(["人口生产：",`+${people[1]*people[2]*(1+people[3])}/秒`]);
        }
        if(res[5]){
            dis.push(["消耗：",`-${res[5] *(1+res[6])}/秒`]);
        }
        if(res[4]){
            let str = res[4]>0?"春":"冬"
            dis.push([`${str}季：`,`果园生产${res[4]>0?"+":""}${res[4]*100}%`,res[4]>0?2:6]);
        }
//胜败和五行影响
        if(id < 4 ){
            if(DB.data.res.win[1] >0){
                dis.push(["胜绩：",`总生产+50%`,2]);
            }
            if(DB.data.res.fail[1] >0){
                dis.push(["败绩：",`总生产-25%`,6]);
            }
            let five = Math.ceil(DB.data.date.day[0]/400) % 5,
                five_times = Stage.five_res[five][id]
            if(DB.data.date.unlock[1] && five_times){
                dis.push([`${Stage.five[five]}年：`,`总生产${five_times>0?"+":""}${five_times*100}%`,five_times>0?2:6]);
            }
        }
        for(let i=0;i<dis.length;i++){
            this.cfg.children[i*2+1].data.text = dis[i][0]
            if(dis[i][2]){
                this.cfg.children[i*2+1].data.style.fill = Global.color[dis[i][2]]
                this.cfg.children[i*2+2].data.style.fill = Global.color[dis[i][2]] 
            }
            this.cfg.children[i*2+2].data.text = dis[i][1]
        }
        this.cfg.children[0].data.height =  90 + dis.length * 50
    }
    remove(){
        Scene.remove(this.node);
    }
    added(node){
        this.node = node;
    }
}

/**
 * @description  关卡界面组件
 */
class WStage extends Widget{
    backNode :any
    setProps(props){
        super.setProps(props);
        let text = ""
        //预警文字初始化
        if(DB.data.hero.enemy.length){
            text = "被入侵"
        }else if(DB.data.date.warning[1] && DB.data.date.warning[0]){
            text = `${DB.data.date.warning[1] - DB.data.date.day[0]}天敌袭`
        }else{
            text = "和平"
            this.cfg.children[6].children[0].data.style.fill = Global.color[5]
        }
        this.cfg.children[6].children[0].data.text = text;
        
    }
    start(){
        Stage.down = Date.now();
    }
    end(){
        Stage.up = Date.now();
    }
    pause_button(){
       pause();
       Stage.pause_button.ni.left = 800
       Stage.restart_button.ni.left= 580
    }
    restart_button(){
        start();
        Stage.pause_button.ni.left = 580
        Stage.restart_button.ni.left= 800
    }

    added(node){    
        Stage.year=  this.elements.get("year");
        Stage.day=  this.elements.get("day");
        Stage.pause_button =  this.elements.get("pause_button");
        Stage.restart_button =  this.elements.get("restart_button");
        Stage.warning_button =  this.elements.get("warning_button");
        for(let i=0;i<5;i++){
            Stage.face_button[i]=  this.elements.get(`on${i}`); 
        }

    }
    //切换主界面
    changeFace(faceid){
        if(faceid != Global.mainFace.id && DB.data.face.unlock[faceid]){
            Scene.remove(Global.mainFace.node);

            Stage.face_button[Global.mainFace.id]["alpha"]  = 0;
            Stage.face_button[faceid]["alpha"]  = 1;
            //
            if(faceid ==0){
                AppEmitter.emit("intoScience");
           }
            if(faceid ==1){
                AppEmitter.emit("intoPeople");
           }
            if(faceid ==2){
                AppEmitter.emit("intoBuild");
            }
            if(faceid ==3){
                AppEmitter.emit("intoArmy");
            }
            if(faceid ==4){
                AppEmitter.emit("intoMap");
            }
        }
    }
    //预警按钮
    warning(){
        if(DB.data.hero.enemy.length){
            let isarmy =0;
            for(let i = 0;i<DB.data.hero.own.length;i++){
                if(DB.data.hero.own[0] && DB.data.hero.own[0][1]){
                    isarmy = 1
                }  
            }
            if(isarmy){
                this.backNode = Scene.open(`app-ui-back`,Global.mainFace.node);
                Scene.open("app-ui-fightWindow", this.backNode,null,{id:99999,index:-1,name:`边境城市`});
            }else{
                AppEmitter.emit("message",`无可出战的军队！`);
            }
        }else{
            this.backNode = Scene.open(`app-ui-back`,Global.mainFace.node);
            Scene.open(`app-ui-warning`,this.backNode, null, {});
        }
    }
}

/**
 * @description 预警弹窗
 */
class WWarning extends Widget{
    setProps(props){
        super.setProps(props);
        if(DB.data.date.warning[0] && DB.data.date.warning[1]){
            this.cfg.children[1].data.text = `敌袭预警`;
            this.cfg.children[1].data.style.fill = Global.color[6];
            this.cfg.children[2].data.text = "情报表示，不久将有敌军入侵。"
        }else{
            this.cfg.children[1].data.text = `和平`;
            this.cfg.children[1].data.style.fill = Global.color[5];
            this.cfg.children[2].data.text = "境内没有成气候的敌人。"

        }
        
    }
}
/**
 * @description 失败结局
 */
class WResult extends Widget{
    setProps(props){
        super.setProps(props);
        let text = ["兵败如山倒，残存亦末路。","“我。。又失败了吗？”","你颓然倒地，心中满是不甘。","仿佛有无数次失败身死之情交叠于身。","“咦，‘又’？”","“我为什么要说‘又’？”"," 。。。"]
             
            for(let i = 0;i<text.length;i++){
                this.cfg.children[i+1].data.text = text[i];
                for(let j = 1;j<6;i++)
                    setTimeout(() => {
                        this.cfg.children[i+1].data.alpha = j*0.2
                    }, 200*j +i*1000);  
            }
   
    }
    next(){
        let text = ["最高坚持115年，便是115个轮回币。","你死死攥着手中的硬币，深知那是翻盘的最后本钱。","此刻，你已回想起了一切。","豁然开朗之后，便只剩下一个疑问。。。","那么，","再来一次，","是否便能改变一切？"]
        if(this.cfg.children[8].data.alpha == 1){
            this.cfg.children[8].data.alpha == 0
            this.cfg.children[9].data.alpha == 1
            this.cfg.children[10].data.alpha == 1

            for(let i = 0;i<text.length;i++){
                this.cfg.children[i+1].data.text = text[i];
                for(let j = 1;j<6;i++)
                    setTimeout(() => {
                        this.cfg.children[i+1].data.alpha = j*0.2
                    }, 200*j +i*1000);  
            }

        }
    }
    restart(){
        this.remove();
        circleNode = Scene.open(`app-ui-circle`,Scene.root, null, {});
        Scene.open(`app-ui-circleShop`,circleNode, null, {});

    }
    main(){
        this.remove();
        openStart();
    }
    //场外数据保存与场景清楚
    remove(){
        Scene.root.removeChildren();
        Connect.request({type:"app/circle@update",arg:[]},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }else{
                DB.data.circle = data.ok[0];
            }
        })

    }
}
/**
 * @description 轮回商店界面
 */
class WCircleShop extends Widget{
    node:any
    setProps(props){
        super.setProps(props);
        
    }

    open(id){
        let good = [[0,1,2,3],[1000,1005,1007],[]]
        good[2] = DB.data.circle.own
        circleFaceNode = Scene.open(`app-ui-circleFace`,circleNode);
        for(let i=0;i<good[id].length;i++){
            Scene.open(`app-ui-circleGood`,circleFaceNode,null,{type:id,index:i});
        }
    }
    added(node){
        this.node = node;

    }
    
}

/**
 * @description 开始游戏界面
 */
class WStart extends Widget{
    setProps(props){
        super.setProps(props);
        
    }

    //重新开始
    startGame(){
        Connect.request({type:"app/circle@read",arg:[]},(data) => {
            let d = JSON.parse(data.ok);
            for(let i in d){
                for(let j in d[i]){
                    DB.data.cirlce[i][j] = d[i][j];
                }
            }
        })   
        circleNode =Scene.open(`app-ui-circle`,Scene.root, null, {});
        Scene.open(`app-ui-circle_shop`,circleNode, null, {});

    }
    //继续游戏
    continue(){
        Connect.request({type:"app/all@read",arg:[]},(data) => {
            let d = JSON.parse(data.ok);
            for(let i in d){
                for(let j in d[i]){
                    if(j == "own" || j== "left" || j== "choose" || j==  'enemy'){
                        DB.data.hero[j] = d[i][j];
                    }else{
                        for(let k in d[i][j]){
                            DB.data[i][j][k] = d[i][j][k];
                        }
                    }
    
                }
            }
        })
    
        begin();
    }

}

/**
 * @description 打开界面
 */
const open = () => {
    stageNode = Scene.open("app-ui-stage", Scene.root);
    Scene.open("app-ui-news",Scene.root);   
    for(let i=0;i<6;i++){
        let name = Stage.res_name[i]
        if(DB.data.res[name][0]>0){
            Stage.resSprite[i] = Scene.open("app-ui-res", stageNode,null,{id:i});
        }
    }
    Stage.updateNews();
    

    // console.log(Stage.width,Stage.height);
}
const openStart = () => {
    startNode = Scene.open("app-ui-start",Scene.root);
}

const pause = () => {
    Stage.pause = 1;
}    
//恢复暂停
const start = () => {
    Stage.time = Date.now();
    Stage.nextDay = Date.now();
    Stage.pause = 0;
} 

const begin = () => {
    Scene.remove(startNode);
    open();
    AppEmitter.emit("intoBuild"); 
    startNode = null;
    Stage.pause = 0;  
    Stage.time = Date.now() + Stage.timeInterval;
    Stage.nextDay = Date.now() + Stage.dayTime;
}    


/****************** 立即执行 ******************/

//初始化资源数据库表[[是否解锁，数量,最大值,增加量,增加量系数(季节),减少量，减少量系数],[]]
DB.init("res",{food:[1,0,5000,0,0,0,0],wood:[0,0,600,0,0,0,0],sci:[1,100,100,0,0,0,0],gold:[1,600,600,0,0,0,0],win:[0,0,200,0,0,1,0],fail:[0,0,200,0,0,1,0]});
//warning:[解锁预警，预警时间]
DB.init("date",{unlock:[0,0],day:[0],warning:[1,0]});
//主界面解锁
DB.init("face",{"unlock":[1,0,1,1,1]});
DB.init("event",{"next":[2001]});

DB.init("news",[[],[]]);//新闻
DB.init("circle",{coin:[0],own:[],year:[0]});//轮回币，上一局将领，最高纪录年

//注册组件
Widget.registW("app-ui-stage",WStage);
Widget.registW("app-ui-start",WStart);
Widget.registW("app-ui-back",WBack);
Widget.registW("app-ui-message",WMessage);
Widget.registW("app-ui-res",WRes);
Widget.registW("app-ui-resDis",WResdis);
Widget.registW("app-ui-news",WNews);
Widget.registW("app-ui-confirm",WConfirm);
Widget.registW("app-ui-warning",WWarning);
Widget.registW("app-ui-result",WResult);
Widget.registW("app-ui-circleShop",WCircleShop);
Widget.registW("app-ui-circleFace",WCircleFace);
Widget.registW("app-ui-circleGood",WCircleGood);

//注册循环

Frame.add(()=>{
    if(!Stage.pause){
        Stage.run();
    }

});
//注册暂停事件
AppEmitter.add("stagePause",(node)=>{
    pause();
});
//注册开始事件
AppEmitter.add("stageStart",(node)=>{
    start();
});
//注册页面打开事件
AppEmitter.add("intoMain",(node)=>{
    openStart();
});
//资源注册监听

for(let i = 0;i < 6 ; i++){
    for(let j = 0; j <7; j++){
        DB.emitter.add(`res.${Stage.res_name[i]}.${j}`, ((x,y) => {
            return ()=>{
                Stage.updateRes(x,y)
            }
        })(i,j));
    }
} 
DB.emitter.add(`res.gold.1`, () => {
    Stage.updateRes(3,1)
});

//注册日期监听
DB.emitter.add(`date.day.0`, () => {
        Stage.guardAdd()
        Stage.eventTrigger()
        Stage.updateWarning()
    });
//注册预警监听
DB.emitter.add(`date.warning.0`, () => {
    Stage.updateWarning()
});
DB.emitter.add(`date.warning.1`, () => {
    Stage.updateWarning()
});

//注册工作监听
for(let i = 1; i <5; i++){
    for(let j = 1; j <4; j++){

        DB.emitter.add(`people.${Stage.res_name[i-1]}.${j}`, ((x,y) => {
            return ()=>{
                Stage.updateRes(x,y)
            } 
        })(i-1,10));
    }
}


//注册新闻监听
DB.emitter.add(`news`, () => {
    Stage.updateNews()
});
//注册消息监听
AppEmitter.add(`message`, (str) => {
    Stage.updateMessage(str);
});



// //重新开始，重置数据库
// AppEmitter.add("initDB",(node)=>{
//     Stage.initDB();
// });