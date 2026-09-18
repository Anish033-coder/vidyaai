import { useEffect, useState } from "react";

export default function InterviewAvatar({ speaking }) {

 const [blink,setBlink] = useState(false);
 const [mouth,setMouth] = useState(false);

 // blinking
 useEffect(()=>{

  const interval = setInterval(()=>{
   setBlink(true);

   setTimeout(()=>{
    setBlink(false);
   },200);

  },3000);

  return ()=>clearInterval(interval);

 },[]);

 // mouth movement while speaking
 useEffect(()=>{

  if(!speaking) return;

  const interval = setInterval(()=>{
   setMouth(prev=>!prev);
  },180);

  return ()=>clearInterval(interval);

 },[speaking]);

 return(

 <div className="flex flex-col items-center">

  <div className="w-40 h-40 bg-blue-500 rounded-full flex flex-col items-center justify-center relative">

   {/* Eyes */}

   <div className="flex gap-6 mb-2">

    <div className={`w-4 bg-white rounded-full ${blink ? "h-1" : "h-4"}`}></div>

    <div className={`w-4 bg-white rounded-full ${blink ? "h-1" : "h-4"}`}></div>

   </div>

   {/* Mouth */}

   <div
    className={`bg-white rounded-full transition-all duration-75 ${
     mouth && speaking ? "w-8 h-4" : "w-6 h-2"
    }`}
   ></div>

  </div>

  <p className="text-sm text-gray-500 mt-2">
   AI Interviewer
  </p>

 </div>

 );

}