import express from "express";
import {register,login,ssoLogin} from "../controllers/authController.js";

const router = express.Router();

router.post("/register",register);
router.post("/login",login);
router.post("/sso", ssoLogin);
export default router;