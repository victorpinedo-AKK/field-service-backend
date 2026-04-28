import multer from "multer";

export const csvUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const allowed =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv");

    if (!allowed) {
      return cb(new Error("Only CSV uploads are allowed"));
    }

    cb(null, true);
  },
});