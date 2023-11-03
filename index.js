require("dotenv").config();
const nodemailer = require("nodemailer");
const express = require("express");
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");
const Schema = require("./schema");
const fs = require("fs");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

//app.use(cors({ origin: "*" }));
app.use(fileUpload({ createParentPath: true }));
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

const PORT = 3000;
app.listen(PORT, () => console.log("listening on port ", PORT));

const MONGO_URI = process.env.MONGO_URI;
const mongoConfig = { useNewUrlParser: true, useUnifiedTopology: true };

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PWD,
  },
});

const auth = {
  pass: process.env.MONGO_PASSWORD,
  user: process.env.MONGO_USER,
  dbName: process.env.DB_NAME,
};

mongoose
  .connect(MONGO_URI, auth, mongoConfig)
  .then((_) => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

const saveImage = (image) => {
  fs.writeFile(__dirname + `/images/${image.name}`, image.data, (err) => {
    if (err) {
      console.error("Error saving image:", err);
    } else {
      console.log("Image saved successfully to");
    }
  });
};

const sendEmail = (body) => {
  const { image1, image2, email } = body;
  const mailOptions = {
    from: process.env.email,
    to: email,
    subject: body.caption,
    html: `<html>
    <body>
        <b>Title: ${body.title}
        <br>
        <b>Name: ${body.name}
        <br>
    </body>
    </html>`,
    attachments: [
      {
        filename: image1.name,
        path: __dirname + `/images/${image1.name}`,
      },
      {
        filename: image2.name,
        path: __dirname + `/images/${image2.name}`,
      },
    ],
  };

  transporter.sendMail(mailOptions, (err, info) => console.log(err || info));
};

const saveInDB = async (body) => {
  body.image1 = body.image1.data;
  body.image2 = body.image2.data;
  return await Schema.create(body);
};

app.post("/", async (req, res) => {
  //   const { caption, name, phone, email, region } = req.body;

  //   return await Schema.deleteMany({});

  fs.appendFile('req_log.txt', JSON.stringify(req.body, null, 2), (err) => console.log('data, saved'));
  

  req.body.image1 = req.files.image1;
  req.body.image2 = req.files.image2;

  //   const data = await Schema.find({});
  //   console.log(data);

  saveImage(req.body.image1);
  saveImage(req.body.image2);

  sendEmail(req.body);

  await saveInDB(req.body);
  return res
    .status(200)
    .json({ status: "success", message: "Data posted successfully" });
});

Schema.find({}, { image1: 0 })
  .then((result) => {
    for (const item of result) {
      const image2 = __dirname + `/images/${item._id}.png`;
      if (!item || !item.image2) continue;
      fs.writeFile(image2, item.image2, (err) => {});
    }
  })
  .catch((err) => console.error(err));

app.get("/data/:page", async (req, res) => {
  const itemsPerPage = 10;
  const currentPage = parseInt(req.params.page) || 1;
  const skip = (currentPage - 1) * itemsPerPage;

  try {
    const totalItems = await Schema.countDocuments();

    const items = await Schema.find({}, { image1: 0, image2: 0 })
      .skip(skip)
      .limit(itemsPerPage);

    await Promise.all(
      items.map((item) => {
        const imagePath = __dirname + `/images/${item._id}.png`;
        if (fs.existsSync(imagePath)) {
          item.image = fs.readFileSync(imagePath, "base64");
        }
      })
    );

    return res.render("data", {
      items,
      currentPage,
      totalPages: Math.ceil(totalItems / itemsPerPage),
    });
  } catch (error) {
    console.error(error);
  }
});

/*
app.get("/image", async (req, res) => {
  // const image = await Schema.find({}, { image1: 1 }).limit(10);
  // const blob = image[7].image1;

  for (const e of emails) {
    const data = await Schema.find({ email: e });

    if (!data.length) continue;

    const image1 = __dirname + `/1_${data[0]._id}.png`;
    const image2 = __dirname + `/2_${data[0]._id}.png`;
    console.log({ image1, image2 });

    fs.writeFile(image1, data[0].image1, (err) => {
      if (err) {
        console.error("Error saving the image:", err);
      } else {
        console.log("Image1 saved successfully.");
      }
    });

    fs.writeFile(image2, data[0].image2, (err) => {
      if (err) {
        console.error("Error saving the image:", err);
      } else {
        console.log("Image2 saved successfully.");
      }
    });

    console.log("sending email");
    const mailOptions = {
      from: process.env.email,
      to: e,
      subject: data[0].caption,
      html: `<html>
    <body>
        <b>Title: ${data[0].title}
        <br>
        <b>Name: ${data[0].name}
        <br>
    </body>
    </html>`,
      attachments: [
        {
          filename: "SpookyOccasion.png",
          path: `/${image1}`,
        },
        {
          filename: "FaceFilter.png",
          path: `${image2}`,
        },
      ],
    };

    transporter.sendMail(mailOptions, (err, info) => console.log(err || info));
  }
  // emails.forEach(async (e) => {});

  // console.log(blob);
  // return res.status(200).json(blob);
});*/
