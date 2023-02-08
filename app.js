
const express = require('express'),
  fs = require('fs'),
  bodyParser = require('body-parser'),
  multiparty = require('multiparty'),
  sparkMD5 = require('spark-md5');

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

// 延迟函数
const delay = (interval) => {
  typeof interval !== 'number' ? interval = 1000 : null;
  return new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, interval);
  });
};

// 检测文件是否存在
const exist = () => {};

// 创建文件并写入到指定目录 & 返回客户端结果
const writeFile = () => {};

// 基于 multiparty 实现文件上传处理 & form-data 解析
const uploadDir = `${__dirname}/data`;
const multiparty_upload = (req, auto) => {
  typeof auto !== 'boolean' ? auto = false : null;
  let config = {
    maxFieldsSize: 200 * 1024 * 1024
  };
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

// 单文件上传处理「form-data」
app.post('/upload_single_formdata', async (req, res) => {
  try {
    let { fields, files } = await multiparty_upload(req, true);
    let file = (files.file && files.file[0]) || {};
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