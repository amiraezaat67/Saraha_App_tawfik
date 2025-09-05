import multer from "multer";
import fs from "node:fs";
import { fileExtensions, fileType } from "../Common/Constants/file.constant.js";

const CreateFolder = (path) => {
  fs.mkdirSync(path, { recursive: true });
};

export const localUpload = ({ path = `sample`, limits = {} }) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const filePath = `Uploads/${path}`;
      CreateFolder(filePath);
      cb(null, filePath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "_" + Math.round(Math.random() * 1e9);

      cb(null, `${uniqueSuffix}_${file.originalname}`);
    },
  });

  const fileFilter = function (req, file, cb) {
    const [type, ext] = file.mimetype.split("/");

    if (!fileType[type]) {
      return cb(new Error("This type is not support"), false);
    }

    const extenstion = fileExtensions[type];
    if (!extenstion.includes(ext)) {
      return cb(new Error("This extenstion is not support"), false);
    }
    cb(null, true);
  };

  return multer({ storage, fileFilter, limits });
};
