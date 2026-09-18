import express from "express";
import Course from "../models/Course.js";

const router = express.Router();

router.get("/", async (req,res)=>{

  const courses = await Course.find({},{
    title:1
  });

  res.json({
    success:true,
    courses
  });

});

export default router;