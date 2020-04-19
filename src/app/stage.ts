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
import {Global,rand,number} from './global';
import Music from '../libs/ni/music';
import Emitter from "../libs/ni/emitter";


/****************** 导出 ******************/
export const addNews = (news) => {
    Connect.request({type:"app/news@addNews",arg:{id:0,news:news}},(data) => {
        if(data.err){
            return console.log(data.err.reson);
        }
        DB.data.news[0] = data.ok[0];
    })
    Stage.change_Newsface(0);
    Stage.updateNews()
}
export const addFNews = (news) => {
    Connect.request({type:"app/news@addNews",arg:{id:1,news:news}},(data) => {
        if(data.err){
            return console.log(data.err.reson);
        }
        DB.data.news[1] = data.ok[0];
    })
    Stage.change_Newsface(1);
    Stage.updateNews()
}
/****************** 本地 ******************/
let stageNode, // 关卡渲染节点
    startNode, // 开始游戏界面
    circleNode, // 轮回商店界面
    circleFaceNode, //轮回购买界面
    listNode //排行榜节点

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
    static stillStop = 0
    static  res={food:[],wood:[],sci:[],gold:[],win:[],fail:[]}// 资源节点
    static  build =[[]] //建筑节点
    static  com_name // 通用窗口名字节点
    static  com_effect // 通用窗口效果节点
    static  com_cost// 通用窗口消耗节点
    static day //日期节点
    static year //年份节点
    static fiveYear//五行年节点
    static res_name = ["food","wood","sci","gold","win","fail"] 
    static work_name = ["total","food","wood","sci","gold"]  //资源名
    static five = ["金","木","水","火","土"]
    static five_res = [[0,0,0,0.5],[0,0.5,0,0],[0,0,0.5,0],[-0.25,0,0,0],[0.5,0,0,0]]
    static res_Cname = ["粮食","木材","知识","黄金","胜绩","败绩"]
    static season_Cname = ["春","夏","秋","冬"] 
    static face_name =["sceince","people","build","army","map"]
    static dayTime0 = 1500
    static dayTime = 1500
    static dayTimes = 2
    static nextDay = 0
    static resSprite = []
    static messageList = []
    static hungry = ["仓无粮。","地荒，无粮。","大荒。","饿殍满地。","大饥，人相食。"]
    static face_Cname = ["科技","人口","建筑","军队","出征"]
    static face_text = [] //界面切换文字节点
    static face_new = []
    static time 
    static newsNode =[]; //新闻节点
    static newsFace = 0   //0-新闻，1-战报
    static news_change = []
    static face_button = []
    static pause_button
    static restart_button
    static warning_button
    static shopText = [[],[],[]] //轮回商店说明节点
    static shopNumber = []  //天时地利人和的兑换数量节点
    static shopCost = []  //轮回商店的消耗节点
    static shopBuild = [1000,1005,1008,1007]  //轮回商店卖的建筑
    static shopRes = [400,50,50,50]  //轮回商店卖的res
    static coinNode    //轮回币节点
    static cir_cost1 = [1,4,4,15]  //轮回建筑消耗
    static cir_cost2 = [3,10,25,50,100]  //轮回英雄消耗
    static resultNode = [] //字幕文字节点
    static textTime = 0     //字幕时间
    static textNum = 0     //字幕数
    static Ftext        //文字帧循环
    static nextFrame  //帧循环的下一帧时间
    static frameTime = 17 //每帧时间
    static daytimesNode //时间倍数文字节点
    static musicNode = [] //音乐音效开关节点
    static bili = [0.5,0.75,1,1.5,2] //时速调节比例
    static initDB(){
        //初始化资源数据库表[[是否解锁，数量,最大值,增加量,增加量系数(季节),减少量，减少量系数],[]]
        DB.init("res",{food:[1,0,5000,0,0,0,0],wood:[0,0,600,0,0,0,0],sci:[0,0,800,0,0,0,0],gold:[0,0,500,0,0,0,0],win:[0,0,100,0,0,1,0],fail:[0,0,100,0,0,1,0]});
        //warning:[解锁预警，预警时间]
        DB.init("date",{unlock:[0,0],day:[0],warning:[0,0]});
        //主界面解锁
        DB.init("face",{"unlock":[0,0,1,0,0],"new":[0,0,0,0,0]});
        DB.init("event",{"next":[2001],"date":[0]});
        DB.init("news",[[],[]]);//新闻
        //轮回币，上一局将领，最高纪录年
        DB.init("circle",{coin:[0],own:[],city:[],times:[0],temp:[[0,0,0,0],[0,0,0,0],[0,0,0,0,0]]});
        //只在前台使用的数据
        DB.init("fore",{pause:[1]});
    }
    //更新界面按钮文字
    static updateFace(i){
        if(DB.data.date.day[0]>0){
            if(DB.data.face.unlock[i]){
                Stage.face_text[i].text = Stage.face_Cname[i];
                Stage.face_text[i].style.fill = Global.color[1]
                DB.data.face.new[i] = 1
                //初始化据点更新时间
                if(i ==4){
                    DB.data.map.date[0] = DB.data.date.day[0] + 6
                }
            }else{
                Stage.face_text[i].text = "未解锁";
                Stage.face_text[i].style.fill = Global.color[0]
            }
        }
    }
    static updateNew(i){
        if(DB.data.date.day[0]>0){
            if(DB.data.face.new[i]>0){
                Stage.face_new[i].ni.left = 115
            }else{
                Stage.face_new[i].ni.left = 1115
            }
        }
    }
    //更新轮回商店显示
    static updateCircle(type){
        let j = 0,
            n = 0
        if(type ==2){
            n = DB.data.circle.own.length

        }else{
            n = DB.data.circle.temp[type].length
        }
        Stage.coinNode.text = `轮回币：${DB.data.circle.coin[0]}`
        for(let i = 0;i < n;i++){
            let x,
                cost = 1
            x = cir_dis(type,i);
            if(DB.data.circle.temp[type][i]){
                Stage.shopText[type][j].text = `${x[0]}(${x[1]})`
                j += 1;
            }

            //已购买物品数量
            Stage.shopNumber[i].text = `${DB.data.circle.temp[type][i]}`
            //价格变动
            if(type==2){
                let n = 0
                for(let k=0;k<DB.data.circle.temp[2].length;k++){
                    n += DB.data.circle.temp[2][k]
                }
                cost =  Stage.cir_cost2[n]
                Stage.shopCost[i].text = `${cost}轮回币`
            }else if(type==1){
                cost = Stage.cir_cost1[i]
            }
            //价格变颜色
            if(cost > DB.data.circle.coin[0]){
                Stage.shopCost[i].style.fill = Global.color[6]
            }else{
                Stage.shopCost[i].style.fill = Global.color[2]
            }

        }

        for(let i = n-1;i >= j;i--){
            if(Stage.shopText[type] && Stage.shopText[type][i]){
                Stage.shopText[type][i].text = ""
            }
        }
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
            text = "反攻"
            Stage.warning_button.style.fill = Global.color[6]
            Stage.warning_button.ni.left = 30
        }else if(DB.data.date.warning[1] && DB.data.date.warning[0]){
            if(DB.data.date.warning[1] - DB.data.date.day[0]<0){
                Connect.request({type:"app/event@warning_zero",arg:{}},(data) => {
                    if(data.err){
                        return console.log(data.err.reson);
                    }
                    DB.data.date.warning[1] = data.ok[0];
                })
            }else{
                text = `${DB.data.date.warning[1] - DB.data.date.day[0]}天敌袭`
                Stage.warning_button.style.fill = Global.color[6]
                Stage.warning_button.ni.left = 10
            }
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
            Stage.newsNode[0].text = "幸无战事,得以休想生息。"
        }
    }
    //字幕浮现循环
    static textRun(){
        if(Date.now()>Stage.nextFrame){
            if(Stage.textNum >9){
                Stage.textNum = 0
                Stage.textTime = 0
                Frame.delete(Stage.Ftext);
            }else{
                Stage.textTime += 1;
                if(Stage.textTime >= 10){
                    Stage.textTime = 0
                    Stage.resultNode[Stage.textNum].alpha += 0.1
                    if(Stage.resultNode[Stage.textNum].alpha >=1){
                        Stage.textNum +=1
                    }
                }
            }
            Stage.nextFrame += Stage.frameTime
        }
    }

    //更新资源显示
    static updateRes(res_nameID,idType){
        let name = Stage.res_name[res_nameID],
            res = DB.data.res[name],
            num = res[idType],
            people = DB.data.people[name]
        //解锁新资源
        if(idType ==0 && DB.data.res[name][0]>=1 && !Stage.resSprite[res_nameID] && DB.data.date.day[0]>0){
            Stage.resSprite[res_nameID] = Scene.open("app-ui-res", stageNode,null,{id:res_nameID});
        }
        //胜败绩根据其资源数值显示和消失
        if(idType == 1 && res_nameID >3){
            if(num){
                if(!(Stage.resSprite[res_nameID] && Stage.resSprite[res_nameID].parent)){
                    Stage.resSprite[res_nameID] = Scene.open("app-ui-res", stageNode,null,{id:res_nameID});
                }
            }else{
                if(Stage.resSprite[res_nameID].parent){
                    Scene.remove(Stage.resSprite[res_nameID]);
                }
            }
        }
          
        if((idType ==1 || idType == 2|| idType == 4)&&( Stage.res[name][idType]!= undefined) ){
            Stage.res[name][idType].text = `${number(num)}` ;
        }

        //计算加成
        let  times = 1

        if(res_nameID < 4 ){
            if(DB.data.res.win[1] >0){
                times += DB.data.people.win[2];
            }
            if(DB.data.res.fail[1] >0){
                times += -DB.data.people.fail[2];
            }
            let five = Math.floor(DB.data.date.day[0]/400+ (DB.data.circle.city[0] && DB.data.circle.city[0][0] >81?DB.data.circle.city[0][0]%5:0)) % 5,
                five_times = Stage.five_res[five][res_nameID]
            if(DB.data.date.unlock[1] && five_times){
                times += five_times 
            }
        }

        //增加或减少百分比
        if((idType == 4)&&( Stage.res[name][idType]!= undefined) ){
            if(num>0){
                Stage.res[name][idType].text = `+${num.toFixed(1)*100}%` ;
            }else{
                Stage.res[name][idType].text = `${num.toFixed(1)*100}%` ;
            }
        }
        if(idType >2){
            if(Stage.res[name][7] != undefined){
                let change = (res[3]) * (res[4]+1)+people[1]*people[2]*(1+people[3])
                change = change * times-  res[5] *(1+res[6]);
                if (change>=0){
                    Stage.res[name][7].text = `+${number(change)}/秒`;
                    Stage.res[name][7].style.fill = "0xffffff"
                }else{
                    Stage.res[name][7].text = `${number(change) }/秒`;
                    Stage.res[name][7].style.fill = "0xff6347"
                }
            }
        //胜败更新改变数
        }else if(res_nameID > 3){
            for(let i =0;i<4;i++){
                Stage.updateRes(i,3);
            }
        }
        

    }

    //地图添加据点
    static guardAdd(){
        if(DB.data.date.day[0] == DB.data.map.date[0] && DB.data.face.unlock[4] >=1){
            let bcfg = CfgMgr.getOne("app/cfg/city.json@city"),
                bcfg1 = CfgMgr.getOne("app/cfg/city.json@rand")
            Connect.request({type:"app/map@guard_add",arg:{}},(data) => {
                if(data.err){
                    DB.data.map.date[0] = 999999999
                    return console.log(data.err.reson);
                }else{
                    DB.data.map.guard = data.ok[0];
                    DB.data.map.city[1] = data.ok[2];
                    if(data.ok[1]<20000){
                        addNews(`斥候已经侦察好了前往${bcfg[data.ok[1]]["name"]}的道路。`);
                    }else{
                        addNews(bcfg1[data.ok[1]]["dis"]);
                    }
                    //添加红点
                    if(Global.mainFace.id != 4){
                        DB.data.face.new[4] = 1
                    }
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

            //触发相应事件
            if(date >= eventDate){
                Connect.request({type:"app/event@eventtrigger",arg:eventId},(data) => {
                    if(data.err >2000){
                        DB.data.event.next[0] = data.err 
                    }else{
                        if(bcfg[eventId]["class"] == 1 ){
                            DB.data.hero.enemy = data.ok[1];
                            DB.data.date.warning[1] = 0;
                            let backNode
                            pause();
                            DB.data.map.attack[0] = 1
                            backNode = Scene.open(`app-ui-back`,Scene.root,null,{type:1});
                            Scene.open("app-ui-fightWindow", backNode,null,{id:19999,index:-2,backNode:backNode,name:"入侵边境"});
                        }else if(bcfg[eventId]["class"] == 2 && DB.data.map.city[4]>0){
                            let backNode
                            pause();
                            backNode = Scene.open(`app-ui-back`,Scene.root,null,{type:1});
                            Scene.open("app-ui-fightWindow", backNode,null,{id:19999,index:-2,backNode:backNode,name:"入侵核心"});
                        }else{
                            if(data.ok[1]){
                                DB.data[bcfg[eventId].type[0]][bcfg[eventId].type[1]][bcfg[eventId].type[2]] = data.ok[1];
                            }
                        }
                        if(news){
                            let con = bcfg[eventId]["dis_con"],
                                num = bcfg[eventId]["dis_num"],
                                is = true
                            //判断播放信息的条件是否达成
                            if(con.length>1){
                                if(con[0] == "<"){
                                    if(DB.data[con[1]][con[2]][con[3]] >= num){
                                        is = false
                                    }
                                }
                                if(con[0] == ">"){
                                    if(DB.data[con[1]][con[2]][con[3]] <= num){
                                        is = false
                                    }
                                }
                                if(con[0] == "="){
                                    if(DB.data[con[1]][con[2]][con[3]] != num){
                                        is = false
                                    }
                                }
                            }
                            if(is){
                                news = news.replace("{{number}}",bcfg[eventId]["number"])
                                addNews(news);  
                            }
                        }
                        DB.data.event.next[0] = data.ok[0]
                    }
                    //成功触发则立刻查看下一个事件是否可触发
                    Stage.eventTrigger();
                })
         } 
        }
        //自动增减人口

        if(date%5 == 0) {
            Connect.request({type:"app/people@changepeople",arg:{}},(data) => {
                if(data.err){
                    return console.log(data.err.reson);
                }else{
                    DB.data.people.total[0] = data.ok[0]
                    if(data.ok[1] ==1){
                        addNews("一位流民在此定居。（空闲人口+1）")
                    }
                    if(data.ok[1] ==-1){
                        if(data.ok[2]>0){
                            DB.data.people[Stage.work_name[data.ok[2]]][1] = data.ok[3];
                        }
                        addNews(`6${Stage.hungry[rand(Stage.hungry.length)-1] }（人口-1）`)
                    }
                }
     
            })         
        }

        //每季度刷新市场的价格
        if(DB.data.build[13][0]>=1 &&Math.ceil(date/100) > DB.data.shop.date[0]){
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
            let five = Math.floor(DB.data.date.day[0]/400+ (DB.data.circle.city[0] && DB.data.circle.city[0][0] >81?DB.data.circle.city[0][0]%5:0)) % 5,
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
            Stage.time +=Stage.dayTime/3;
        }
        // //处理弹出消息
        // Stage.runMessage();

//时间变化
        if(Date.now()>Stage.nextDay){
            let season
            Connect.request({type:"app/hero@hurt",arg:[]},(data) => {
                if(data.err){
                    return console.log(data.err.reson);
                }else{
                    DB.data.hero.own = data.ok[0];
                }
            })
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
                    Stage.year.text =  `第 ${Math.ceil(DB.data.date.day[0]/400)}年`
                }
                if(DB.data.date.unlock[1]){
                    Stage.fiveYear.text =  `${Stage.five[Math.floor(DB.data.date.day[0]/400+ (DB.data.circle.city[0] && DB.data.circle.city[0][0] >81?DB.data.circle.city[0][0]%5:0)) % 5]} 年`
                }
                Stage.day.text = `${season} ${DB.data.date.day[0] % 100}天`
                //新年弹出新闻信息
                if(DB.data.date.day[0] % 400 == 1 && DB.data.date.day[0] != 1){
                    let st = DB.data.date.unlock[1]?`(${Stage.five[Math.floor(DB.data.date.day[0]/400+ (DB.data.circle.city[0] && DB.data.circle.city[0][0] >81?DB.data.circle.city[0][0]%5:0)) % 5]})`:""
                    addNews(`5--------------第${Math.ceil(DB.data.date.day[0]/400)}年${st}-------------`)
                    for(let i =0;i<4;i++){
                        Stage.updateRes(i,3);
                    }
                    if(DB.data.build[7][0]){
                        addNews(`酒馆来了一批新的客人。`)  
                    }
                }
                if(DB.data.date.day[0] % 100 == 1){
                    Music.play(`audio/season${Math.floor(DB.data.date.day[0]/100)% 4}.mp3`,true);
                }
            })
            Stage.nextDay += Stage.dayTime; 
            //如果上一次跳过了敌人的进攻，再次弹出
             if(DB.data.map.attack[0] == 1 && DB.data.hero.enemy.length){
                 let backNode
                 pause();
                 backNode = Scene.open(`app-ui-back`,Scene.root,null,{type:1});
                 Scene.open("app-ui-fightWindow", backNode,null,{id:19999,index:-2,backNode:backNode,name:"入侵边境"})
             }
        }
 
    }

    static change_Newsface(faceID){
        if(Stage.newsFace != faceID){
            Music.play("audio/but.mp3");
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
 * @description  黑蒙版组件
 */
class WBack extends Widget{
    node: any
    setProps(props){
        super.setProps(props);
        if(props && props.type){
            this.cfg.on = {"tap":{"func":"no"}}
            this.cfg.children[1].data.text = ""
        }   
    }
    no(){}
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
        
        //适配
        this.cfg.children[0].data.width = Scene.screen.width - 200
        let n = Math.floor((Scene.screen.width - 750)/3.4)
        this.cfg.children[3].data.left += n
        this.cfg.children[4].data.left += n
        this.cfg.children[5].data.left += 2*n
        this.cfg.children[6].data.left += 3*n
        this.cfg.children[7].data.left += 3.2*n
        this.cfg.children[8].data.left += 3.4*n

        this.cfg.children[1].data.text = `${Cname}:`;
        this.cfg.children[2].data.text = number(DB.data.res[name][1]);
        this.cfg.children[4].data.text = DB.data.res[name][2]==5000?DB.data.res[name][2]:number(DB.data.res[name][2]);
        let change = (res[3]) * (res[4]+1)+people[1]*people[2]*(1+people[3]),
        times = 1
        
        if(res[4]){
            let str = res[4]>0?"春":"冬"
            addtion.push([`${str}`,res[4]>0?2:6]);
        }


//胜败和五行影响
        if(id < 4 ){
            if(DB.data.res.win[1] >0){
                times += DB.data.people.win[2];
                addtion.push(["胜",2]);
            }
            if(DB.data.res.fail[1] >0){
                times += -DB.data.people.fail[2];
                addtion.push(["败",6]);
            }
            let five = Math.floor(DB.data.date.day[0]/400+ (DB.data.circle.city[0] && DB.data.circle.city[0][0] >81?DB.data.circle.city[0][0]%5:0)) % 5,
                five_times = Stage.five_res[five][id]
            if(DB.data.date.unlock[1] && five_times){
                times += five_times 
                addtion.push([`${Stage.five[five]}`,five_times>0?2:6]);
            }
            change = change * times
        }
        change = change - res[5] *(1+res[6])
        if (change>=0){
            this.cfg.children[5].data.text = `+${number(change)}/秒`;
        }else{
            this.cfg.children[5].data.text = `${number(change)}/秒`;
        }
        for(let i=0;i<addtion.length;i++){
            this.cfg.children[6+i].data.text = addtion[i][0];
            this.cfg.children[6+i].data.style.fill =  Global.color[addtion[i][1]];
        }
 

        this.cfg.data.top = Math.min(id*50 +30,230);
        this.cfg.children[0].on = {"tap":{"func":"dis_res","arg":[id]}};  
    }
    dis_res(type){
        Music.play("audio/but.mp3");
        pause();
        this.backNode = Scene.open(`app-ui-back`,Scene.root);
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
        this.cfg.children[1].data.left = Math.floor((Scene.screen.width - this.cfg.children[1].data.width)/2)
        this.cfg.children[1].children[0].data.text = `${props.text}`;
        this.cfg.children[1].children[1].props.on =  {"tap":{"func":`${props.on}`,"arg":props.arg}};
        if(props.on =="circle_start"){
            this.cfg.children[1].children[2].props.on={"tap":{"func":"out_remove"}}
        }
    }
//将领革职
    hero_delete(id){
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
        name = bcfg[DB.data.hero.own[id][0]]["name"]
        Connect.request({type:"app/army@hero_delete",arg:[id]},(data) => {
            let text = ["叹主不公，积怨成疾，郁郁而终。","被贬，翌日愤懑出走，不知所踪。","听闻被贬，不发一言，拂袖而去。","怒道：“竖子不足与谋！”"]

             DB.data.hero.own = data.ok[0];
             DB.data.army.cur[0] = data.ok[1];
             DB.data.hero.MaxHero[2] = data.ok[2];
             this.remove();
             AppEmitter.emit("message",`${name}已被革职！`);
             addNews(`${name}${text[rand(text.length)-1]}`)
             Scene.remove(Global.mainFace.node);
             AppEmitter.emit("intoArmy");
        })
        start();
    }
    circle_start(){
        cir_start();
    }
    remove(){
        Scene.remove(this.node);
        start();
    }

    out_remove(){
        Scene.remove(this.node);
    }
    added(node){
        this.node = node;
    }
    //空白事件，防穿透
    no(){
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
            dis = [],
            times = 1

        this.cfg.data.left = Math.floor(Scene.screen.width - this.cfg.data.width)/2  
//胜败和五行影响
        if(id < 4 ){
            if(DB.data.res.win[1] >0){
                dis.push(["胜绩：",`总生产+${Math.floor(DB.data.people.win[2]*100 + 0.5)}%`,2]);
                times += DB.data.people.win[2]
            }
            if(DB.data.res.fail[1] >0){
                dis.push(["败绩：",`总生产-${Math.floor(DB.data.people.fail[2]*100 +0.5)}%`,6]);
                times -= DB.data.people.fail[2]
            }
            let five = Math.floor(DB.data.date.day[0]/400+ (DB.data.circle.city[0] && DB.data.circle.city[0][0] >81?DB.data.circle.city[0][0]%5:0)) % 5,
                five_times = Stage.five_res[five][id]
            if(DB.data.date.unlock[1] && five_times){
                dis.push([`${Stage.five[five]}年：`,`总生产${five_times>0?"+":""}${five_times*100}%`,five_times>0?2:6]);
                times += five_times
            }
        }

        if(res[4]){
            let str = res[4]>0?"春":"冬"
            dis.unshift([`${str}季：`,`果园生产${res[4]>0?"+":""}${res[4]*100}%`,res[4]>0?2:6]);
        }
        if(res[5]){
            dis.unshift(["消耗：",`-${number(res[5] *(1+res[6]))}/秒`]);
        }
        if(people[1]){
            dis.unshift(["人口生产：",`+${number(people[1]*people[2]*(1+people[3])*times)}/秒`]);
        }
        if(res[3]){
            dis.unshift(["果园生产：",`+${number(res[3]*(res[4]+1)*times)}/秒`]);
        }
        dis.unshift([`${Cname}`,`(${number(res[1])}/${number(res[2])})`])

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
        //适配
        this.cfg.children[3].data.top = Scene.screen.height -100
        this.cfg.children[3].data.width = Math.floor(Scene.screen.width / 5)
        for(let i=0;i<4;i++){
            this.cfg.children[3].children[1+i].data.left = this.cfg.children[3].data.width * (i +1)
            this.cfg.children[3].children[5+i].data.left = this.cfg.children[3].data.width * (i +1)
        }
            
        

        //预警文字初始化
        if(DB.data.hero.enemy.length){
            text = "反攻"
        }else if(DB.data.date.warning[1] && DB.data.date.warning[0]){
            text = `${DB.data.date.warning[1] - DB.data.date.day[0]}天敌袭`
        }else{
            text = "和平"
            this.cfg.children[6].children[0].data.style.fill = Global.color[5]
        }
        this.cfg.children[6].children[0].data.text = text;
        
        for(let i=0;i<5;i++){
            if(DB.data.face.unlock[i]){
                this.cfg.children[3].children[i].children[2].data.text = Stage.face_Cname[i];
                this.cfg.children[3].children[i].children[2].data.style.fill = Global.color[1]
            }else{
                this.cfg.children[3].children[i].children[2].data.text = "？？";
                this.cfg.children[3].children[i].children[2].data.style.fill = Global.color[0]
            }
        }

        
    }
    start(){
        Stage.down = Date.now();
    }
    end(){
        Stage.up = Date.now();
    }
    pause_button(){
       pause();
       Music.play("audio/but.mp3");
       if(Music.bgm){
        Music.stop(Music.bgm);
       }
       Stage.stillStop = 1
       Stage.pause_button.ni.right = 2000
       Stage.restart_button.ni.right= 20
    }
    restart_button(){
        Music.play("audio/but.mp3");
        Stage.stillStop = 0
        if(Music.bgm){
            Music.play(Music.bgm,true);
        }
        start();
        Stage.pause_button.ni.right = 20
        Stage.restart_button.ni.right= 2000
    }
    system(){
        AppEmitter.emit("stagePause");
        this.backNode = Scene.open(`app-ui-back`,Scene.root);
        Scene.open(`app-ui-system`,this.backNode);
    }
    added(node){    
        Stage.year=  this.elements.get("year");
        Stage.fiveYear=  this.elements.get("fiveYear");
        Stage.day=  this.elements.get("day");
        Stage.pause_button =  this.elements.get("pause_button");
        Stage.restart_button =  this.elements.get("restart_button");
        Stage.warning_button =  this.elements.get("warning_button");
        for(let i=0;i<5;i++){
            Stage.face_button[i]=  this.elements.get(`on${i}`); 
        }
        for(let i=0;i<5;i++){
            Stage.face_text[i]=  this.elements.get(`face_text${i}`); 
        }
        for(let i=0;i<5;i++){
            Stage.face_new[i]=  this.elements.get(`new${i}`); 
        }

    }
    //切换主界面
    changeFace(faceid){
        if(faceid != Global.mainFace.id && DB.data.face.unlock[faceid]){
            Music.play("audio/but.mp3");
            Scene.remove(Global.mainFace.node);

            Stage.face_button[Global.mainFace.id]["alpha"]  = 0;
            Stage.face_button[faceid]["alpha"]  = 1;

            //清除红点
            DB.data.face.new[faceid] = 0
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
        Music.play("audio/but.mp3");
        if(DB.data.hero.enemy.length){
            if(DB.data.army.cur[0]<DB.data.army.total[0]){
                AppEmitter.emit("stagePause");
                this.backNode = Scene.open(`app-ui-back`,Scene.root);
                Scene.open("app-ui-fightWindow", this.backNode,null,{id:19999,index:-1,backNode:this.backNode,name:`边境城市`});
            }else{
                AppEmitter.emit("message",`无可出战的军队！`);
            }
        }else{
            AppEmitter.emit("stagePause");
            this.backNode = Scene.open(`app-ui-back`,Scene.root);
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
        this.cfg.data.left = Math.floor(Scene.screen.width - this.cfg.data.width)/2 
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
    node:any
    setProps(props){
        super.setProps(props);
        let tex = [["9座城池尽数沦陷。","兵败如山倒，","残存亦末路。","“我。。又失败了吗？”","你颓然倒地，心中满是不甘。","仿佛无数次失败身死之情，","尽数交叠于身。","等等，又？"," 为什么是又？"," 。。。"],
        ["一觉醒来","竟回东汉末年","适逢黄巾乱世，宦官当权","庙堂之上，朽木为官","乡野之间，生灵涂炭","好男儿自当拔刀奋起","尽收名士猛将","逐鹿天地之间"],
        ["最多占领9城，","便是9个轮回币。","你死死攥着这些硬币,","深知那是翻盘的最后本钱。","此刻，你已回想起了一切。","豁然开朗之后","便只剩下一个疑问。。。","再来一次，","是否便能改变一切？"],
        ["你的国家繁荣昌盛，","你的军队所向披靡，","你的功绩万人传颂。","你由衷地欣喜，","却不是因为这些。","而是...","你！","终于！","摆脱了！","那无尽的轮回！"]],
            text = tex[props.id]

            Stage.textNum = 0
            Stage.textTime = 0
            if(props.id == 0){
                text[0] = text[0].replace("9", `${DB.data.map.city[0]}`);
            }else if(props.id == 1){
                this.cfg.children[11].on = {"tap":{"func":"start"}}
            }else if(props.id == 2){
                text[0] = text[0].replace("9", `${Math.max(DB.data.map.city[0],DB.data.circle.city[0][0])}`);
                text[1] = text[1].replace("9", `${Math.max(DB.data.map.city[0],DB.data.circle.city[0][0])}`);
                this.cfg.children[11].data.left += 2000
                this.cfg.children[12].data.left -= 2000
                this.cfg.children[13].data.right -= 2000
            }else if(props.id == 3){
                this.cfg.children[13].data.left = this.cfg.children[11].data.left
                this.cfg.children[11].data.left += 2000
            }
            for(let i = 0;i<text.length;i++){
                this.cfg.children[i+1].data.text = text[i]; 
            }

            if(Stage.Ftext){
                Frame.delete(Stage.Ftext);
            }
            //注册循环
            Stage.nextFrame = Date.now() + Stage.frameTime;
            Stage.Ftext = Frame.add(()=>{
                    Stage.textRun();
            });
   
    }
    //下一页
    next(){
        Music.play("audio/but.mp3");
        Scene.remove(this.node);

        Scene.open("app-ui-result", Scene.root,null,{id:2});
    }
    restart(){
        Music.play("audio/but.mp3");
        this.remove();
        Connect.request({type:"app/circle@read",arg:[]},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }else{
                DB.data.circle = data.ok
            }
            circleNode = Scene.open(`app-ui-circleShop`,Scene.root);
        })
    }
    main(){
        Music.play("audio/but.mp3");
        this.remove();
        openStart();
    }
    //场外数据保存与场景清楚
    remove(){
        Scene.root.removeChildren();

    }
    //正式开始游戏
    start(){
        Music.play("audio/but.mp3");
        Scene.remove(this.node);
        begin();
    }
    added(node){
        this.node = node;
        for(let i =0;i<10;i++){
            Stage.resultNode[i] =  this.elements.get(`text${i}`);
        }
    }  
    //空白事件，防穿透
    no(){

    }
}
/**
 * @description 轮回商店界面
 */
class WCircleShop extends Widget{
    node:any
    setProps(props){
        super.setProps(props)
        this.cfg.children[1].data.text = `轮回币：${DB.data.circle.coin[0]}`
        for(let i =0;i<3;i++){
            this.cfg.children[3+i].data.left = (Scene.screen.width - 3 * this.cfg.children[3+i].data.width)/4 * (i+1) +  this.cfg.children[3+i].data.width*i
        }
        // //已购买物品描述
        for(let i=0;i<3;i++){
            let n,t = 0
            if(i ==2){
                n = DB.data.circle.own.length
            }else{
                n = DB.data.circle.temp[i].length
            }
            for(let j = 0;j < n;j++){
                let x
                x = cir_dis(i,j);
                if(DB.data.circle.temp[i][j]){
                    this.cfg.children[3+i].children[2+t].data.text = `${x[0]}(${x[1]})`
                    t+= 1;
                }
            }
        }

    }
    start(){
        if(DB.data.circle.coin[0]){
            Scene.open(`app-ui-confirm`, this.node, null, {text:`还剩余了${DB.data.circle.coin[0]}个轮回币。\n确认开始吗？`,on:"circle_start",arg:[]});
        }else{
            cir_start();

        }
    }
    open(id){
        let good = [[0,1,2,3],[],[]],
            nohero = 0
        good[1] = Stage.shopBuild
        good[2] = DB.data.circle.own
        if(!good[id].length){
            nohero = 1
        }
        circleFaceNode = Scene.open(`app-ui-circleFace`,circleNode,null,{nohero:nohero});
        for(let i=0;i<good[id].length;i++){
            Scene.open(`app-ui-circleGood`,circleFaceNode,null,{type:id,index:i});
        }
    }
    added(node){
        this.node = node;
        Stage.coinNode = this.elements.get("coin");
        for(let i =0;i<3;i++){
            for(let j =0;j<4;j++){
                Stage.shopText[i][j] =  this.elements.get(`text${i}${j}`);
            }
        }
    }   
}
/**
 * @description 轮回商店天时地利人和界面
 */
class WCircleFace extends Widget{
    node:any
    setProps(props){
        super.setProps(props);
        if(props.nohero){
            this.cfg.children[2].data.text = "你在前世没有招募任何将领。" 
        }      
    }
    back(node){
        Scene.remove(circleFaceNode);
        Stage.shopNumber = []
    }
}
/**
 * @description 轮回商店具体内容模板
 */
class WCircleGood extends Widget{
    node:any
    setProps(props){
        super.setProps(props);

        this.cfg.data.left = (Scene.screen.width - 3 * this.cfg.data.width)/4 * (props.index % 3+1) +  this.cfg.data.width*(props.index % 3)
        this.cfg.data.top = 300 + Math.floor(props.index / 3)*250
        let cost,
            color = Global.color[2]
        if(props.type ==2){
            let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero"),
                hero = DB.data.circle.own[props.index],
                army = ["步兵","骑兵","弓兵"],
                n = 0

            for(let i=0;i<DB.data.circle.temp[2].length;i++){
                n += DB.data.circle.temp[2][i]
            }
            cost =  Stage.cir_cost2[n]
            this.cfg.children[0].children[0].data.text = `${bcfg[hero[0]]["name"]}` 
            this.cfg.children[0].children[0].data.style.fill = Global.color[bcfg[hero[0]]["color"]]   
            this.cfg.children[0].children[0].data.top =  10  
            this.cfg.children[0].children[1].data.text = `统帅：${bcfg[hero[0]]["command"]}`
            this.cfg.children[0].children[2].data.text = `${army[bcfg[hero[0]]["arms"]]}：${Math.floor(hero[2]+bcfg[hero[0]]["number"])}`
        }else if(props.type == 0){
            cost = 1
            this.cfg.children[0].children[0].data.text = `${Stage.shopRes[props.index]}${Stage.res_Cname[props.index]}` 
        }else{
            let bcfg = CfgMgr.getOne("app/cfg/build.json@build")
            cost = Stage.cir_cost1[props.index]
            this.cfg.children[0].children[0].data.text = `${bcfg[Stage.shopBuild[props.index]]["name"]}`
        }
        this.cfg.children[0].children[3].data.text = `${cost}轮回币`
        //轮回商店的价格变颜色
        if(cost > DB.data.circle.coin[0]){
            color = Global.color[6]    
        }
        this.cfg.children[0].children[3].data.style.fill = color
        this.cfg.children[0].children[6].data.text = `${DB.data.circle.temp[props.type][props.index]}`
    }

    plus(){
        let id = [this.node.widget.props.type,this.node.widget.props.index]
        Connect.request({type:"app/circle@plus",arg:id},(data) => {
            if(data.err ==2){
                let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero")
                AppEmitter.emit("message",`${bcfg[DB.data.circle.own[id[1]][0]]["name"]}只此一位！`);
                return console.log(data.err.reson);
            }else if(data.err ==1){
                AppEmitter.emit("message",`轮回币不足！`);
            }else{
                DB.data.circle.temp[id[0]][id[1]] = data.ok[0];
                DB.data.circle.coin[0] = data.ok[1];
                Stage.updateCircle(id[0]);
            }
        })
    }
    minus(){
        let id = [this.node.widget.props.type,this.node.widget.props.index]
        Connect.request({type:"app/circle@minus",arg:id},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }else{
                DB.data.circle.temp[id[0]][id[1]] = data.ok[0];
                DB.data.circle.coin[0] = data.ok[1];
                Stage.updateCircle(id[0]);
            }
        })
    }
    added(node){
        this.node = node;
         Stage.shopNumber[node.widget.props.index] =  this.elements.get("number");
         Stage.shopCost[node.widget.props.index] =  this.elements.get("cost");
    }   
}


/**
 * @description 纪录排行榜
 */
class WList extends Widget{
    node:any
    setProps(props){
        super.setProps(props);
        if(DB.data.circle.city && DB.data.circle.city[0] && DB.data.circle.city[0][0]){
            this.cfg.children[2].data.text = "" 
        }      
    }
    remove(){
        Scene.root.removeChildren();
        openStart();
    }
}
/**
 * @description 纪录排行榜具体名次
 */
class WListRank extends Widget{
    node:any
    setProps(props){
        super.setProps(props);
        this.cfg.data.top = 300 + props.id * 55
        this.cfg.data.left = Math.floor((Scene.screen.width -750)/2)
        this.cfg.children[0].data.text = `第${props.id+1}名`
        this.cfg.children[1].data.text = `${DB.data.circle.city[props.id][0]}座`
        this.cfg.children[2].data.text = `（第${DB.data.circle.city[props.id][1]}次轮回）`    
    }
    remove(){
        Scene.root.removeChildren();
        openStart();
    }
}
/**
 * @description 系统菜单界面
 */
class WSystem extends Widget{
    node:any
    setProps(props){
        super.setProps(props);
        if(!Music.status.loop){
            this.cfg.children[4].data.style.fill = "0xC0C0C0"
            this.cfg.children[5].data.style.fill = "0xffffff"
        }
        if(!Music.status.once){
            this.cfg.children[8].data.style.fill = "0xC0C0C0"
            this.cfg.children[9].data.style.fill = "0xffffff"
        }
        this.cfg.children[13].data.text =  Stage.bili[Stage.dayTimes]
                     
    }
    main(){
        Music.play("audio/but.mp3");
        Scene.root.removeChildren();
        openStart();
    }
    music(id){
        Music.play("audio/but.mp3");
        Stage.musicNode[id].style.fill = "0xffffff"
        Stage.musicNode[id +1 -2*(id % 2)].style.fill = "0xC0C0C0"
        let is = id % 2?false:true,
            type = id<2?"loop":"once"
        Music.setStatue(type,is);
    }
    add(){
        if(Stage.dayTimes < Stage.bili.length-1){
            Stage.dayTimes += 1
            Stage.dayTime = Stage.dayTime0 / Stage.bili[Stage.dayTimes]
            Stage.daytimesNode.text = Stage.bili[Stage.dayTimes]
        }else{
            AppEmitter.emit("message",`已达到最高倍数！`);
        }
    }
    red(){
        if(Stage.dayTimes >0){
            Stage.dayTimes -= 1
            Stage.dayTime = Stage.dayTime0 / Stage.bili[Stage.dayTimes]
            Stage.daytimesNode.text = Stage.bili[Stage.dayTimes]
        }else{
            AppEmitter.emit("message",`已达到最低倍数！`);
        }
    }
    added(node){
        Stage.musicNode[0] = this.elements.get("music0");
        Stage.musicNode[1] = this.elements.get("music1");
        Stage.musicNode[2] = this.elements.get("music2");
        Stage.musicNode[3] = this.elements.get("music3");
        Stage.daytimesNode = this.elements.get("number");
    }   
}
/**
 * @description 开始游戏界面
 */
class WStart extends Widget{
    node:any
    setProps(props){
        super.setProps(props);
        if(!localStorage.build || localStorage.date.indexOf("\"day\":[0]") >=0){
            this.cfg.children[0].props.left = 2000
        }
    }

    //重新开始
    startGame(){
        if(DB.data.circle.city && DB.data.circle.city[0] &&DB.data.circle.city[0][0]){
            Scene.open("app-ui-result", Scene.root,null,{id:2});
           // circleNode =Scene.open(`app-ui-circleShop`,Scene.root, null, {});
        }else{
            Scene.open("app-ui-result", Scene.root,null,{id:1});

        }
    }
    //继续游戏
    continue(){
        Connect.request({type:"app/all@read",arg:[]},(data) => {
            let d = JSON.parse(data.ok);
            for(let i in d){
                for(let j in d[i]){
                    if(i == "hero" && (j == "own" || j== "left" || j== "choose" || j==  'enemy')){
                        DB.data.hero[j] = d[i][j];
                    }else{
                        for(let k in d[i][j]){
                            DB.data[i][j][k] = d[i][j][k];
                        }
                    }
    
                }
            }
            begin();
        })
    }
    //纪录按钮
    record(){
        listNode = Scene.open("app-ui-list", Scene.root);
        for(let i =0;i<DB.data.circle.city.length;i++){
            Scene.open("app-ui-listRank", listNode,null,{id:i});
        }
        
    }

    remove(){
        Scene.remove(this.node);
    }
    added(node){
        this.node = node;
    }

}

/**
 * @description 打开界面
 */
const open = () => {
    stageNode = Scene.open("app-ui-stage", Scene.root);
    Music.play(`audio/season${Math.floor(DB.data.date.day[0]/100)% 4}.mp3`,true);
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

//恢复暂停
const start = () => {
    if(Stage.stillStop == 0){
        Stage.time = Date.now();
        Stage.nextDay = Date.now();
        Stage.pause = 0;
        DB.data.fore.pause[0] = 0;
    }
} 
const openStart = () => {
    startNode = Scene.open("app-ui-start",Scene.root);
}

const pause = () => {
    Stage.pause = 1;
    DB.data.fore.pause[0] = 1;
}    
//轮回商店已购买物品描述
const cir_dis = (type,i) => {
    let name,num,j
    if(type == 0){
        name = Stage.res_Cname[i]
        num = DB.data.circle.temp[type][i] * Stage.shopRes[i]
    }else if(type == 1){
        let bcfg = CfgMgr.getOne("app/cfg/build.json@build")
        name = `${bcfg[Stage.shopBuild[i]]["name"]}`
        num = DB.data.circle.temp[type][i]
    }else{
        let bcfg = CfgMgr.getOne("app/cfg/hero.json@hero")
        name = `${bcfg[DB.data.circle.own[i][0]]["name"]}`
        num = DB.data.circle.temp[type][i]
    }
    return([name,num])
} 

const begin = () => {
    if(startNode && startNode.parent){
        Scene.remove(startNode);
    }
    open();
    AppEmitter.emit("intoBuild"); 
    startNode = null;
    Stage.pause = 0;  
    DB.data.fore.pause[0] = 0;
    Stage.time = Date.now() + Stage.dayTime/3;
    Stage.nextDay = Date.now() + Stage.dayTime;
}    

const cir_start =()=> {
          //初始化数据库
          DB.data.face = undefined;
          AppEmitter.emit("initDB");
          Connect.request({type:"app/circle@putout",arg:[]},(data) => {
              if(data.err){
                  return console.log(data.err.reson);
              }else{
                  for(let i=0;i<4;i++){
                      DB.data.res[Stage.res_name[i]][0] = data.ok[0][Stage.res_name[i]][0];
                      DB.data.res[Stage.res_name[i]][1] = data.ok[0][Stage.res_name[i]][1];
                  }
                  for(let i=0;i<Stage.shopBuild.length;i++){
                      DB.data.build[Stage.shopBuild[i]-1000][0] = data.ok[1][Stage.shopBuild[i]-1000][0];
                      DB.data.build[Stage.shopBuild[i]-1000][1] = data.ok[1][Stage.shopBuild[i]-1000][1];
                      //如果解锁了果园，把山路也解锁了
                      if(Stage.shopBuild[i] == 1000 && DB.data.build[Stage.shopBuild[i]-1000][0]){
                            DB.data.build[14][0] = 1
                      }
                      if(DB.data.build[Stage.shopBuild[i]-1000][0]){
                        let bcfg = CfgMgr.getOne("app/cfg/build.json@build"),
                            effect = bcfg[Stage.shopBuild[i]]["effect_type"]
                        for(let j=0;j<effect.length;j++){
                            DB.data[effect[j][0]][effect[j][1]][effect[j][2]] = data.ok[5][i][j];
                          }
                      }
                  }
                  
                  DB.data.hero.own = data.ok[2]
                  DB.data.circle = data.ok[3]
                  DB.data.face.unlock[3] = data.ok[4]
                  DB.data.map.city[2] = data.ok[6]
                }              
          })
          Scene.open("app-ui-result", Scene.root,null,{id:1});
}
/****************** 立即执行 ******************/

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
Widget.registW("app-ui-list",WList);
Widget.registW("app-ui-listRank",WListRank);
Widget.registW("app-ui-system",WSystem);

//注册循环

Frame.add(()=>{
    //处理弹出消息
    Stage.runMessage();
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
//切出页面事件
Emitter.global.add("hide",()=>{
    pause();
});
//切回页面事件
Emitter.global.add("show",()=>{
    start();
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
//注册解锁五行监听，更新一下资源显示
DB.emitter.add(`date.unlock.1`, () => {
    Stage.updateRes(0,3)
    Stage.updateRes(1,3)
    Stage.updateRes(2,3)
    Stage.updateRes(3,3)
});
//注册解锁五行监听，更新一下资源显示
DB.emitter.add(`people.win.2`, () => {
    Stage.updateRes(0,3)
    Stage.updateRes(1,3)
    Stage.updateRes(2,3)
    Stage.updateRes(3,3)
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


// //注册新闻监听
// DB.emitter.add(`news`, () => {
//     Stage.updateNews()
// });
//注册消息监听
AppEmitter.add(`message`, (str) => {
    Stage.updateMessage(str);
});


//界面解锁监听
for(let i = 0;i < 5 ; i++){
        DB.emitter.add(`face.unlock.${i}`, ((x) => {
            return ()=>{
                Stage.updateFace(x)
            }
        })(i));
} 
//界面红点监听
for(let i = 0;i < 5 ; i++){
    DB.emitter.add(`face.new.${i}`, ((x) => {
        return ()=>{
            Stage.updateNew(x)
        }
    })(i));
} 


 //初始化数据库
 AppEmitter.add("initDB",(node)=>{
     Stage.initDB();
 });