
const express = require('express'),
  fs = require('fs'),
  bodyParser = require('body-parser'),
  multiparty = require('multiparty'),
  SparkMD5 = require('spark-md5');

// 创建服务器

const app = express(),
  PORT = 8888,
  HOST = 'http://127.0.0.1',
  HOSTNAME = `${HOST}:${PORT}`;

app.listen(PORT, () => {
  console.log(`service is created successfully! you can visit: ${HOSTNAME}`);
})

// 中间件

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  req.method === 'OPTIONS' ? res.send('current service support cross domain requests!') : next();
});

app.use(bodyParser.urlencoded({
  extended: false,
  limit: '1024mb'
}));

const uploadDir = `${__dirname}/data`;

// 延迟函数
const delay = (interval) => {
  typeof interval !== 'number' ? interval = 1000 : null;
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, interval);
  });
};

// 检测文件是否存在 （Promise）
const exist = path => {
  return new Promise(resolve => {
    fs.access(path, fs.constants.F_OK, err => {
      if (err) {
        resolve(false);
      }
      resolve(true);
    });
  });
};

// 创建文件并写入到指定目录 & 返回客户端结果
const writeFile = (res, path, file, fileName, stream) => {
  return new Promise((resolve, reject) => {
    // 流式写入
    if (stream) {}
    fs.writeFile(path, file, err => {
      if (err) {
        reject(err);
        res.send({
          code: 1,
          codeText: err
        });
        return;
      }
      resolve();
      // log
      console.log(`文件「${fileName}」上传成功！`)
      res.send({
        code: 0,
        codeText: 'upload success',
        originalFilename: fileName,
        servicePath: path.replace(__dirname, HOSTNAME)
      });
    });
  });
};

// 基于 multiparty 实现文件上传处理 & form-data 解析
const multiparty_upload = (req, auto) => {
  typeof auto !== 'boolean' ? auto = false : null;
  let config = {
    maxFieldsSize: 200 * 1024 * 1024
  };
  // 文件是否自动存入指定位置
  if (auto) config.uploadDir = uploadDir;
  return new Promise(async (resolve, reject) => {
    await delay();
    const form = new multiparty.Form(config);
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({fields, files});
    });
  });
};

// 单文件上传处理「form-data」（文件可能重复）
app.post('/upload_single_formdata', async (req, res) => {
  try {
    // 文件解析 & 自动存入
    let { fields, files } = await multiparty_upload(req, true),
      file = (files.file && files.file[0]) || {};
    // log
    console.log(`文件「${fields.fileName[0]}」上传成功！`);
    res.send({
      code: 0,
      codeText: 'upload success',
      originalFilename: file.originalFilename,
      servicePath: file.path.replace(__dirname, HOSTNAME)
    });
  } catch (err) {
    res.send({
      code: 1,
      codeText: err
    });
  }
});

// 单文件上传处理「base64」
app.post('/upload_single_base64', async (req, res) => {
  let file = req.body.file,
    fileName = req.body.fileName,
    spark = new SparkMD5.ArrayBuffer(),
    suffix = /\.([0-9a-zA-Z]+)$/.exec(fileName)[1],
    isExist = false,
    path;
  file = decodeURIComponent(file);
  file = file.replace(/^data:image\/\w+;base64,/, '');
  file = Buffer.from(file, 'base64');
  spark.append(file);
  path = `${uploadDir}/${spark.end()}.${suffix}`;
  // 手动延迟
  await delay();
  // 写入文件
  isExist = await exist(path);
  if (isExist) {
    // log
    console.log(`文件「${fileName}」已存在！`)
    res.send({
      code: 0,
      codeText: 'file is exist',
      originalFilename: fileName,
      servicePath: path.replace(__dirname, HOSTNAME)
    });
    return;
  }
  writeFile(res, path, file, fileName, false);
});

// 单文件上传处理「缩略图」（文件不会重复）
app.post('/upload_single_hash', async (req, res) => {
  try {
    let file = req.body.file,
      fileName = req.body.fileName,
      fileOriName = req.body.fileOriName,
      path = `${uploadDir}/${fileName}`;
    file = decodeURIComponent(file);
    file = file.replace(/^data:image\/\w+;base64,/, '');
    file = Buffer.from(file, 'base64');
    let isExist = await exist(path);
    // 模拟延迟
    await delay();
    // 文件是否已存在
    if (isExist) {
      // log
      console.log(`文件「${fileOriName}」已存在！`);
      res.send({
        code: 0,
        codeText: 'file is exist',
        originalFilename: fileOriName,
        servicePath: path.replace(__dirname, HOSTNAME)
      });
      return;
    }
    await writeFile(res, path, file, fileOriName, false);
  } catch (err) {
    res.send({
      code: 1,
      codeText: err
    });
  }
});