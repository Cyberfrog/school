var validate = function(val) {
   console.log("val",val);
    var change= document.getElementById("btn_change");
   (val.length==0)?change.hidden = true:change.hidden=false;
}