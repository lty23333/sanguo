/****************** 导入 ******************/


/****************** 导出 ******************/
export  class Global{
    //当前主界面信息
    static mainFace ={id:-1, node: null};
    static color = ["0xC0C0C0","0xffffff","0x98fb98","0x6495ED","0x8A2BE2","0xFFFF00","0xff6347"] //灰白绿蓝紫黄红
    
}

export function rand(number){
    return Math.ceil( Math.random() * number );
};

export function number(num){
    let u = "",
        left = 2
    if(num>=1000000){
        num = num/1000000
        u = "m"
    }else if(num>=1000){
        num = num/1000
        u = "k"
    }

    if(num>=100){
        left = 0
    }else if(num>=10){
        left = 1
    }
    
    return `${num.toFixed(left)/1}${u}`;
};

export function number1(num){
    let u = 1,
        left =2

    if(num>=1000000){
        num = num/1000000
        u = 1000000
    }else if(num>=1000){
        num = num/1000
        u = 1000
    }
    if(num>=100){
        left = 0
    }else if(num>=10){
        left = 1
    }
    
    return parseFloat(num.toFixed(left)) * u;
};