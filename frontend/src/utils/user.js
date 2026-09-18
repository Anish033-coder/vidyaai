export function getUserId(){

 let id = localStorage.getItem("userId");

 return id;

}

export function saveUserId(id){

 localStorage.setItem("userId",id);

}