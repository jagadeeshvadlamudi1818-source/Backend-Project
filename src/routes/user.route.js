import { Router } from "express";
import multer from "multer";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();
const upload = multer({ dest: "tmp/" });

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

export default router;
