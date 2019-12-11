/****************** 导入 ******************/


/****************** 导出 ******************/
export  class Global{
    //当前主界面信息
    static mainFace ={id:2, node: null};
    static color = ["0xC0C0C0","0xffffff","0xff6347","0x98fb98","0xfff37"] //灰白红绿黄
    
}

export function rand(number){
    return Math.ceil( Math.random() * number );
};