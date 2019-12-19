/****************** 导入 ******************/


/****************** 导出 ******************/
export  class Global{
    //当前主界面信息
    static mainFace ={id:2, node: null};
    static color = ["0xC0C0C0","0xffffff","0x98fb98","0x6495ED","0x8A2BE2","0xFFFF00","0xff6347"] //灰白绿蓝紫黄红
    
}

export function rand(number){
    return Math.ceil( Math.random() * number );
};