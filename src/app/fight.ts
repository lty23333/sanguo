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
let heroList = [],  //己方英雄列表
    lastFace,        //上一个界面
    enemyType,       //敌人种类,-1是入侵的，0,1,2代表第几个据点
    faceName = ["intoScience", "intoPeople","intoBuild","intoArmy","intoMap"],
    fighter,         //参战数据[[[id,num,add+1,位置,兵种],[己方]],[[敌方],[方]]]
    hpNode =[[]],          //扣血节点
    numberNode = [[]],    //军队人数节点
    moverF = [],     //当前精灵阵营，ID
    moverT = [],     //目标精灵阵营，ID
    sitP = [[[]]],         //军队不动时坐标
    attP = [[[]]] ,          //进队进攻的坐标          
    fighter_sprite = [[]],  //参战军队精灵
    armys = [[]],         //参战军队的逻辑对象
    state ,      //表现演播的状态
    isvic,        //是否胜利
    fight_show,  // 战斗表现
    armysF,    //当前军队逻辑对象
    armysT,    //目标军队逻辑对象  
    damage,      //伤害
    vx,          //水平移动速度
    vy,          //竖直移动速度
    damageSprite,   //伤害飘字
    damageNode,    //伤害飘字
    kill_die,       //我军将领杀敌损伤
    cityId          //争夺城市的ID
class Fight {
    

    static pause = 1
    static events = []     //事件列表
    static shake = 2      //震动次数
    static shakeState = 4      //震动阶段



    static updateHerolist(){
        if(Global.mainFace.id == 4){
            initHero();
        }
    }
    static run(){
        if(state == "start"){
            moverF = sitP[fight_show[0][1]][fight_show[0][2]]
            moverT = attP[fight_show[0][4]][fight_show[0][5]]
            armysF = armys[fight_show[0][1]][fight_show[0][2]]
            armysT = armys[fight_show[0][4]][fight_show[0][5]]
            damage =  fight_show[0][6]
            vx = (moverT[0]-moverF[0])/30
            vy = (moverT[1]-moverF[1])/30
            state = "run1"

        }else if(state == "run1"){
            if(armysF.top == moverT[1]){
                state = "damage"
                if(damageSprite){
                    damageSprite.ni.left = armysT.left;
                    damageSprite.ni.top =armysT.top +10;
                    damageNode.text = `-${damage}`;
                }else{
                    damageSprite = Scene.open("app-ui-fightHp", Global.mainFace.node,null,{left:armysT.left,top:armysT.top +10,damage:damage});
                }

            }else{
                armysF.left +=  vx;
                armysF.top +=  vy;
                Fight.events.push({type:"move",target: armysF});
            }
        }else if(state == "damage"){
            if(Fight.shake>0){
                damageSprite.ni.top += 1;
                if(Fight.shakeState>-9){
                    armysT.left +=  Fight.shakeState/(Math.abs(Fight.shakeState)?Math.abs(Fight.shakeState):1);
                    Fight.shakeState -= 1;
                    Fight.events.push({type:"move",target: armysT});
                }else{
                    Fight.shake -= 1;
                    Fight.shakeState = 4
                }
            }else{
                    Fight.shake = 2;
                    state = "run2";
                    armysT.hp -= damage;
                    numberNode[fight_show[0][4]][fight_show[0][5]] = armysT.max_hp - armysT.hp;
                    hpNode[fight_show[0][4]][fight_show[0][5]].ni.height =  (armysT.max_hp - armysT.hp)/armysT.max_hp *200;
                    damageSprite.ni.top += 2000;
            }
        }else if(state == "run2"){
            if(armysF.top == moverF[1]){
                fight_show.splice(0,1);
                if(fight_show[0]){
                    state = "start";
                }else{
                    state = "end";
                }
            }else{
                armysF.left -= vx;
                armysF.top -= vy;
                Fight.events.push({type:"move",target: armysF});
            }
        }else if(state == "end"){
             Scene.open("app-ui-fightAccount", Global.mainFace.node);
             state = ""
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
    max_hp = 0
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
        if ( !fighter_sprite[ev.target.group]){ fighter_sprite[ev.target.group] = []}
        fighter_sprite[ev.target.group][ev.target.id] = Scene.open("app-ui-fightHero", Global.mainFace.node,null, {id:ev.target.id,group:ev.target.group,left:sitP[ev.target.group][ev.target.id][0],top:sitP[ev.target.group][ev.target.id][1]});
    }
    static move(ev){
        let army = fighter_sprite[ev.target.group][ev.target.id];
        army.x = ev.target.left;
        army.y = ev.target.top;
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
 * @description  战斗界面组件
 */
class WFight extends Widget{
    setProps(props){
        super.setProps(props);
        // this.cfg.children[1].data.text = DB.data.map.city[0] ;
    }

    added(node){

    }
}
/**
 * @description 伤害飘字
 */
class WfightHp extends Widget{
    setProps(props){
        super.setProps(props);
        this.cfg.data.text = `-${props.damage}` ;      
        this.cfg.data.left = props.left;
        this.cfg.data.top = props.top;
    }

    added(node){
        damageNode = this.elements.get("damage");
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
        this.cfg.children[3].data.style.fill = `${Global.color[bcfg[heroId]["color"]]}`;
        this.cfg.children[4].data.text = `${fighter[group][id][1]} ${Cname[fighter[group][id][4]]}`;    
    }
    remove(){
        Scene.remove(this.node);   
    }  
    added(node){
        this.node = node;
        if(!hpNode[this.props.group]){hpNode[this.props.group] = []}
        if(!numberNode[this.props.group]){numberNode[this.props.group] = []}
        hpNode[this.props.group][this.props.id] = this.elements.get("hp");
        numberNode[this.props.group][this.props.id] = this.elements.get("number");
    }
} 

//战斗结算弹窗
class WfightAccount extends Widget{
    node: any

    setProps(props){
        super.setProps(props);
        let bcfg = CfgMgr.getOne("app/cfg/city.json@city"),
        bcfg2 = CfgMgr.getOne("app/cfg/hero.json@hero"),
        result = [["惨胜","小胜","大捷"],["惜败","小败","大败"]],
        resultId = 0,
        kill_all = 0,
        die_all = 0

        for(let i=0;i<kill_die[0].length-1;i++){
            kill_die[0][4] += kill_die[0][i];
            kill_die[1][4] += kill_die[1][i];
        }
        if(kill_die[Math.abs(isvic-1)][4]/kill_die[isvic][4] <1){
            resultId = 0
        }else if(kill_die[Math.abs(isvic-1)][4]/kill_die[isvic][4] <2){
            resultId = 1
        }else{
            resultId = 2
        }

        this.cfg.children[6].data.text = `${result[Math.abs(isvic-1)][resultId]}`;
        for(let i =0;i<fighter[0].length;i++){
            this.cfg.children[8+i].data.text = `${bcfg2[fighter[0][i][0]]["name"]}`;
        }
        for(let i =0;i<fighter[0].length;i++){
            this.cfg.children[13+i].data.text = `${kill_die[0][i]}`;
            kill_all += kill_die[0][i];
        }
        this.cfg.children[17].data.text = `${kill_all}`;
        for(let i =0;i<fighter[0].length;i++){
            this.cfg.children[18+i].data.text = `${kill_die[1][i]}`;
            die_all += kill_die[1][i];
        }
        this.cfg.children[21].data.text = `${die_all}`;
        if(isvic){
            this.cfg.children[22].data.text = `${bcfg[cityId]["reward_dis"]}`;
        }else{
            this.cfg.children[22].data.text = "      +50败绩";
        }
    

    }

    remove(){
        Scene.remove(Global.mainFace.node);
        AppEmitter.emit("stageStart"); 
        AppEmitter.emit(`${faceName[lastFace]}`);
        Fight.pause = 1;
        //发放战斗奖励
        Connect.request({type:"app/fight@fightAccount",arg:{isvic:isvic,cityId:cityId}},(data) => {
            if(data.err){
                return console.log(data.err.reson);
            }
            DB.data.res.fail[1] = data.ok[0];
            DB.data.res.win[1]  = data.ok[1];
            if(data.ok[2]){
                let bcfg = CfgMgr.getOne("app/cfg/city.json@city"),
                    effect = bcfg[cityId]["effect_type"],
                    effect_num = bcfg[cityId]["effect_number"]
                    for(let i=0;i<effect_num.length;i++){
                        DB.data[effect[i][0]][effect[i][1]][effect[i][2]] = data.ok[2][i];
                    }  
            }
        })
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
 
    AppEmitter.emit("stagePause");
    //显示军队
    for(let i=0; i<2;i++ ){
        for(let j=0; j<fighter[i].length;j++ ){
            if (!sitP[i]){sitP[i] = []}
            if (!attP[i]){attP[i] = []}
            if (!sitP[i][j]){sitP[i][j] = []}
            if (!attP[i][j]){attP[i][j] = []}

            sitP[i][j].push(50 + 200 * j,520 - 500 * i)
            attP[i][j].push(50 + 200 * j,sitP[i][j][1] + 200*(i?1:-1))
            if (!armys[i]){armys[i] = []}
            armys[i][j] = new Army({
                left : sitP[i][j][0],
                top : sitP[i][j][1],
                hp : fighter[i][j][1],
                max_hp :fighter[i][j][1],
                group : i,
                id : j
            })
            Fight.events.push({type:"insert",target:armys[i][j]});
        }
    }
    Connect.request({type:"app/fight@fight",arg:[fighter,enemyType]},(data) => {
        if(data.err){
            return console.log(data.err.reson);
        }
        isvic = data.ok[0];
        fight_show = data.ok[1];
        DB.data.hero.own = data.ok[2];
        DB.data.map.guard = data.ok[3];
        DB.data.army.total[0] = data.ok[4];
        kill_die = data.ok[5];
        Fight.pause = 0;
        state = "start"
    })

}



/****************** 立即执行 ******************/
//注册组件
Widget.registW("app-ui-fightAccount",WfightAccount);
Widget.registW("app-ui-fight",WFight);
Widget.registW("app-ui-fightHero",WfightHero);
Widget.registW("app-ui-fightHp",WfightHp);


//注册页面打开事件
AppEmitter.add("intoFight",(node)=>{
    lastFace = Global.mainFace.id;
    fighter = node.fighter;
    enemyType = node.enemyType;
    cityId = node.city;
    open();
});

Frame.add(()=>{
    if(!Fight.pause){
        Show.distribute(Fight.loop());
    }
});


