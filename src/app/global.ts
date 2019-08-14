/****************** 导入 ******************/


/****************** 导出 ******************/
export  class Global{
    //当前主界面信息
    static mainFace ={id:2, node: null};
    static color = ["#adbbd9","#99FF33","#3399FF","#660099","#FF9900","#FF3300"]
    
}
function rnd( seed ){
    seed = ( seed * 9301 + 49297 ) % 233280; //为何使用这三个数?
    return seed / ( 233280.0 );
};

export function rand(number){
    let today = new Date(); 
    let seed = today.getTime();
    return Math.ceil( rnd( seed ) * number );
};